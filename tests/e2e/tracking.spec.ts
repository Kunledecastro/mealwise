import { expect, test, type Page } from "./fixtures";
import { OTHER, TESTER } from "./supabase-mock";

// Phase 4: daily target, meal log and weight history, saved to the account. All data synthetic.
// The seeded tester: born 1996, 165 cm, 79.4 kg, lightly active, losing weight, sex not given
// → BMR 1,597 (midpoint equation) × 1.375 = 2,196; −439 (20% cap) → about 1,750 kcal.

const nav = (page: Page) => page.locator('nav[aria-label="Main"]:visible');
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test("P4-01 Profile shows the daily target with every step of the calculation", async ({ page }) => {
  await page.goto("/profile");
  const card = page.locator("#target");
  await expect(card.getByText("About 1,750 kcal")).toBeVisible();
  await card.getByText("How we worked this out").click();
  await expect(card.getByText(/about 1,597 kcal/)).toBeVisible();
  await expect(card.getByText(/average of the male and female equations/)).toBeVisible();
  await expect(card.getByText(/Mifflin-St Jeor/)).toBeVisible();
  await expect(card.getByText(/about 2,196 kcal/)).toBeVisible();
  await expect(card.getByText(/kept it smaller to stay at a safe pace/)).toBeVisible();
  await expect(card.getByText(/isn't\s+medical advice/)).toBeVisible();
});

test("P4-02 adding sex in the profile updates the target", async ({ page, mock }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Female", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  // Female equation: BMR 1,514 × 1.375 = 2,082; −416 → about 1,650.
  await expect(page.locator("#target").getByText("About 1,650 kcal")).toBeVisible();
  expect(mock.profiles.get(TESTER.id)).toMatchObject({ sex: "female" });
});

test("P4-03 pregnancy, breastfeeding or a medical condition: no target, a referral, and only a yes/no is stored", async ({ page, mock }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("checkbox", { name: /pregnant or breastfeeding/ }).check();
  await page.getByRole("button", { name: "Save changes" }).click();
  const card = page.locator("#target");
  await expect(card.getByText(/we don't set a calorie target/)).toBeVisible();
  await expect(card.getByText(/kcal a day/)).toHaveCount(0);
  expect(mock.profiles.get(TESTER.id)).toMatchObject({ needs_guidance: true });
  // Today shows totals without a target.
  await nav(page).getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByText("kcal logged", { exact: true })).toBeVisible();
});

test("P4-04 a 'lose' goal with a weight below the healthy range gets no target and a supportive message", async ({ page, mock }) => {
  mock.seedWeights(TESTER.id, [[daysAgo(0), 48]]);
  await page.goto("/profile");
  await expect(page.locator("#target").getByText(/already below the healthy range/)).toBeVisible();
  await expect(page.locator("#target").getByText(/kcal a day/)).toHaveCount(0);
});

test("P4-05 Today shows totals against the target, and the log for yesterday", async ({ page, mock }) => {
  mock.seedLog(TESTER.id, { meal_slug: "akara-and-pap", logged_for: daysAgo(0), meal_type: "breakfast", kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 18 });
  mock.seedLog(TESTER.id, { meal_slug: "red-red", logged_for: daysAgo(1), meal_type: "lunch", kcal: 700 });
  mock.seedLog(OTHER.id, { meal_slug: "fruit-bowl", logged_for: daysAgo(0), meal_type: "snack", kcal: 180 });
  await page.goto("/today");
  await expect(page.getByText("1,250 kcal")).toBeVisible();
  await expect(page.getByText("left of your daily target")).toBeVisible();
  await expect(page.getByText("of about 1,750 kcal")).toBeVisible();
  await expect(page.getByRole("link", { name: "Akara and pap" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fresh fruit bowl" })).toHaveCount(0); // another user's entry
  await page.getByRole("button", { name: "Previous day" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Yesterday" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Red red", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to today" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
});

test("P4-06 a large plate suggests a smaller portion for the target, and logging uses it by default", async ({ page, mock }) => {
  // The log dialog picks the meal time from the clock; pin it to lunchtime so the test doesn't depend on when it runs.
  await page.clock.setFixedTime(new Date(new Date().setHours(13, 0, 0, 0)));
  await page.goto("/meals/afang-soup-eba");
  await expect(page.getByText(/three-quarters of a serving fits a/)).toBeVisible();
  await page.getByRole("button", { name: "I ate this" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Three quarters of a serving" })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Yesterday" }).click();
  await dialog.getByRole("button", { name: "Log meal" }).click();
  await expect(page.getByText("Logged Afang soup with eba to yesterday")).toBeVisible();
  // The figures are copied when logging (¾ × 955 kcal).
  expect(mock.mealLogs[0]).toMatchObject({ meal_slug: "afang-soup-eba", portion: "0.75", kcal: 716, logged_for: daysAgo(1) });
});

test("P4-07 if logging fails, nothing is shown as logged and the dialog stays open", async ({ page, mock }) => {
  await page.goto("/meals/akara-and-pap");
  await page.getByRole("button", { name: "I ate this" }).click();
  mock.failNextTrackingWrite = true;
  await page.getByRole("dialog").getByRole("button", { name: "Log meal" }).click();
  await expect(page.getByText(/That meal wasn't logged/)).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(mock.mealLogs).toHaveLength(0);
});

test("P4-08 a new weight is saved to the account and the target follows the latest weight", async ({ page, mock }) => {
  await page.goto("/progress");
  await page.getByLabel("Weight (kg)").fill("70");
  await page.getByRole("button", { name: "Add weight" }).click();
  await expect(page.getByText("Weight added")).toBeVisible();
  await page.reload();
  await expect(page.getByText("70.0 kg").first()).toBeVisible();
  expect(mock.weights).toEqual([expect.objectContaining({ user_id: TESTER.id, measured_on: daysAgo(0), weight_kg: "70.00", entered_unit: "kg" })]);
  await nav(page).getByRole("link", { name: "Profile", exact: true }).click();
  // 70 kg: BMR 1,503 × 1.375 = 2,067; −413 → about 1,650.
  await expect(page.locator("#target").getByText("About 1,650 kcal")).toBeVisible();
});

test("P4-09 losing faster than about 1% a week gets a gentle caution", async ({ page, mock }) => {
  mock.seedWeights(TESTER.id, [[daysAgo(21), 84], [daysAgo(14), 82.5], [daysAgo(7), 81], [daysAgo(0), 79.4]]);
  await page.goto("/progress");
  await expect(page.getByText(/about 1\.5 kg a week down/)).toBeVisible();
  await expect(page.getByText(/losing more than about 1% of your weight a week/)).toBeVisible();
});

test("P4-10 a weight that fails to save is not shown as saved", async ({ page, mock }) => {
  await page.goto("/progress");
  await page.getByLabel("Weight (kg)").fill("78");
  mock.failNextTrackingWrite = true;
  await page.getByRole("button", { name: "Add weight" }).click();
  await expect(page.getByText(/That weight wasn't saved/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "No weights yet" })).toBeVisible();
  expect(mock.weights).toHaveLength(0);
});

test("P4-11 setup asks the guidance question and shows the target before saving", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("checkbox", { name: /pregnant or breastfeeding/ })).toBeVisible();
  await page.getByRole("button", { name: "Female", exact: true }).click();
  for (const step of ["Continue", "Continue", "Skip", "Skip", "Skip"]) await page.getByRole("button", { name: step, exact: true }).click();
  await expect(page.getByText("Your daily target: about 1,650 kcal")).toBeVisible();
});

test("P4-12 Home sizes the next meal to what is left of today's target", async ({ page, mock }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Dinner", exact: true }).click();
  await expect(page.locator("#hero-title")).not.toBeEmpty();
  await expect(page.getByText(/Lighter ideas first/)).toHaveCount(0); // nothing logged yet: usual sizes

  // 1,400 of the tester's 1,750 kcal logged today.
  mock.seedLog(TESTER.id, { meal_slug: "akara-and-pap", logged_for: daysAgo(0), meal_type: "breakfast", kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 18 });
  mock.seedLog(TESTER.id, { meal_slug: "jollof-rice-chicken", logged_for: daysAgo(0), meal_type: "lunch", kcal: 900, protein_g: 40, carbs_g: 110, fat_g: 30 });
  await page.reload();
  await page.getByRole("button", { name: "Dinner", exact: true }).click();
  await expect(page.getByText("Lighter ideas first: about 350 kcal of today's target is left.")).toBeVisible();
  await expect(page.getByText("1,400", { exact: true })).toBeVisible();
});
