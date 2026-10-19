import { expect, test, type Page } from "./fixtures";
import { TESTER } from "./supabase-mock";

/** YYYY-MM-DD, n days before today on this machine's clock (the browser uses the same clock). */
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const nav = (page: Page) => page.locator('nav[aria-label="Main"]:visible');

test("main navigation reaches every tab and marks the current one", async ({ page }) => {
  await page.goto("/home");
  // The desktop rail also has a logo link to /home, so match tab names exactly.
  for (const [label, url] of [["Plan", /\/plan$/], ["Search", /\/search$/], ["Progress", /\/progress$/], ["Saved", /\/saved$/], ["Profile", /\/profile$/], ["Home", /\/home$/]] as const) {
    await nav(page).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(url);
    await expect(nav(page).getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
  }
  await nav(page).getByRole("link", { name: "Profile", exact: true }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
});

test.describe("new account", () => {
  test.use({ signedIn: false });

  test("J1: sign up, confirm by email link, set up (blocks under-18s, validates input), and the answers are saved", async ({ page, mock }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get started", exact: true }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
    await page.getByLabel("Email").fill("new.person@example.test");
    await page.getByLabel("Password", { exact: true }).fill("Plantain-2026");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Check your email", { exact: true })).toBeVisible();
    expect(mock.emails).toContainEqual({ to: "new.person@example.test", kind: "confirm" });

    // Stand-in for opening the emailed confirmation link in the same browser.
    await page.goto("/auth/callback?code=confirm:new.person@example.test");
    await expect(page).toHaveURL(/\/onboarding$/);

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Choose a goal to continue.")).toBeVisible();
    await page.getByRole("radio", { name: /Gain weight/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("What should we call you?").fill("Tunde");
    const year = new Date().getFullYear();
    await page.getByLabel("Year you were born").fill(String(year - 15));
    await expect(page.getByText(/designed for adults/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();

    await page.getByLabel("Year you were born").fill("1992");
    await page.getByLabel(/Current weight in kg/).fill("900");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter a weight between 20 and 400 kg.")).toBeVisible();
    await page.getByLabel(/Current weight in kg/).fill("68");
    await page.getByLabel(/Height in cm/).fill("178");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: /Active/ }).first().click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Peanuts" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Skip" }).click();

    await expect(page.getByRole("heading", { name: "Summary" })).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByText("Gain weight")).toBeVisible();
    await expect(main.getByText("Peanuts")).toBeVisible();
    await page.getByRole("button", { name: "Save and show me meals" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(/, Tunde$/)).toBeVisible();

    // Saved to the account: consent from sign-up, answers from setup.
    const row = [...mock.profiles.values()].find((r) => r.display_name === "Tunde")!;
    expect(row).toMatchObject({ goal: "gain", birth_year: 1992, allergies: ["Peanuts"], consent_version: "2026-10-18" });
    expect(row.onboarding_completed_at).toBeTruthy();

    // Survives a full reload now (Phase 1 kept this only in memory).
    await page.reload();
    await expect(page.getByText(/, Tunde$/)).toBeVisible();

    // Peanut meals are hidden after declaring the allergy.
    await nav(page).getByRole("link", { name: "Search", exact: true }).click();
    await page.getByRole("searchbox").fill("groundnuts");
    // Only meals where groundnuts are an optional, uncounted side (e.g. boli) may remain.
    await expect(page.getByRole("link", { name: "Roasted plantain (boli)" })).toBeVisible();
    for (const name of ["Fried plantain with groundnuts", "Banana and groundnuts", "Suya beef with onion and cabbage"])
      await expect(page.getByRole("link", { name })).toHaveCount(0);
    await page.getByLabel(/Hide meals with my allergies/).uncheck();
    await expect(page.getByRole("link", { name: "Fried plantain with groundnuts" })).toBeVisible();
  });
});

test("J2: pick a meal, log half a portion, and see it on Today, saved to the account", async ({ page, mock }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Lunch", exact: true }).click();
  const name = (await page.locator("#hero-title").innerText()).trim();
  await page.getByRole("link", { name: "See meal" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await page.getByRole("button", { name: "I ate this" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Half a serving" }).click();
  await dialog.getByRole("button", { name: "Lunch" }).click();
  await dialog.getByRole("button", { name: "Log meal" }).click();
  await expect(page.getByText(`Logged ${name} to today`)).toBeVisible();

  await nav(page).getByRole("link", { name: "Home", exact: true }).click();
  await page.getByRole("link", { name: "Open today" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.getByText(/^½ serving, about/)).toBeVisible();
  // Stored in the account: still there after a full reload.
  await page.reload();
  await expect(page.getByRole("link", { name })).toBeVisible();
  expect(mock.mealLogs.filter((l) => l.user_id === TESTER.id)).toHaveLength(1);
  expect(mock.mealLogs[0]).toMatchObject({ meal_type: "lunch", portion: "0.50", logged_for: daysAgo(0) });
});

test("J2b: Show another cycles suggestions", async ({ page }) => {
  await page.goto("/home");
  await page.getByRole("button", { name: "Dinner", exact: true }).click();
  const first = await page.locator("#hero-title").innerText();
  await page.getByRole("button", { name: "Show another" }).click();
  await expect(page.locator("#hero-title")).not.toHaveText(first);
});

test("J3: Not for me hides a meal and Show again restores it", async ({ page }) => {
  await page.goto("/meals/akara-and-pap");
  await page.getByRole("button", { name: "Not for me" }).click();
  await page.getByRole("button", { name: "Takes too long" }).click();
  await expect(page).toHaveURL(/slot=breakfast/);
  const list = page.getByRole("list", { name: "Breakfast ideas" });
  await expect(list.getByRole("link", { name: "Akara and pap" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show again" }).click();
  await expect(list.getByRole("link", { name: "Akara and pap" })).toBeVisible();
});

test("save and unsave meals, with an empty Saved screen, saved to the account", async ({ page, mock }) => {
  mock.seedSaved(TESTER.id, ["jollof-rice-chicken", "fish-pepper-soup"]);
  await page.goto("/saved");
  for (const n of ["Jollof rice with chicken", "Catfish pepper soup"]) {
    await page.getByRole("button", { name: `Remove ${n} from saved` }).click();
  }
  await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();
  await nav(page).getByRole("link", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Save Fresh fruit bowl" }).click();
  await nav(page).getByRole("link", { name: "Saved", exact: true }).click();
  await expect(page.getByRole("link", { name: "Fresh fruit bowl" })).toBeVisible();
  // Stored in the account: still there after a full reload.
  await page.reload();
  await expect(page.getByRole("link", { name: "Fresh fruit bowl" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jollof rice with chicken" })).toHaveCount(0);
  expect(mock.mealPrefs.get(`${TESTER.id}|fruit-bowl`)?.saved_at).toBeTruthy();
  expect(mock.mealPrefs.get(`${TESTER.id}|jollof-rice-chicken`)?.saved_at).toBeNull();
});

test("J4: search with filters, empty result, and clearing", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox").fill("pizza");
  await expect(page.getByRole("heading", { name: "No meals match" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(page.getByText(/^70 meals/)).toBeVisible();
  await page.getByRole("searchbox").fill("beans");
  await page.getByRole("group", { name: "Time" }).getByRole("button", { name: "Under 45 min" }).click();
  await expect(page.getByRole("link", { name: "Akara and pap" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Beans porridge with plantain" })).toHaveCount(0);
});

test("J5: add, validate, edit, delete weight and switch units", async ({ page, mock }) => {
  mock.seedWeights(TESTER.id, [[daysAgo(15), 80.6], [daysAgo(8), 80.0], [daysAgo(1), 79.4]]);
  await page.goto("/progress");
  await expect(page.getByText("79.4 kg").first()).toBeVisible();

  await page.getByLabel("Weight (kg)").fill("abc");
  await page.getByRole("button", { name: "Add weight" }).click();
  await expect(page.getByText("Use numbers only, for example 72.5.")).toBeVisible();

  const future = new Date();
  future.setDate(future.getDate() + 3);
  const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Date").fill(iso);
  await page.getByLabel("Weight (kg)").fill("78.9");
  await page.getByRole("button", { name: "Add weight" }).click();
  await expect(page.getByText("The date can't be in the future.")).toBeVisible();

  await page.getByLabel("Date").fill("2026-10-15");
  await page.getByRole("button", { name: "Add weight" }).click();
  await expect(page.getByText("Weight added")).toBeVisible();
  const history = page.locator("section", { has: page.getByRole("heading", { name: "History" }) });
  await expect(history.getByText("78.9 kg")).toBeVisible();

  await page.getByRole("button", { name: "Edit weight for 2026-10-15" }).click();
  await page.getByLabel("Weight (kg)").fill("78.5");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(history.getByText("78.5 kg")).toBeVisible();
  await expect(history.getByText("78.9 kg")).toHaveCount(0);

  await page.getByRole("button", { name: "Delete weight for 2026-10-15" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(history.getByText("78.5 kg")).toHaveCount(0);

  await page.getByRole("radio", { name: "lb" }).click();
  await expect(page.getByText("175.0 lb").first()).toBeVisible();
  await expect(page.getByLabel("Weight (lb)")).toBeVisible();
});

test("J6: remove a logged meal from Today, removed from the account", async ({ page, mock }) => {
  mock.seedLog(TESTER.id, { meal_slug: "fruit-bowl", logged_for: daysAgo(0), meal_type: "snack", kcal: 180 });
  mock.seedLog(TESTER.id, { meal_slug: "oats-banana-groundnuts", logged_for: daysAgo(0), meal_type: "breakfast", kcal: 450 });
  await page.goto("/today");
  await page.getByRole("button", { name: "Remove Fresh fruit bowl from this day" }).click();
  await page.getByRole("button", { name: /Remove Oats with banana/ }).click();
  await expect(page.getByRole("heading", { name: "Nothing logged today" })).toBeVisible();
  expect(mock.mealLogs).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Nothing logged today" })).toBeVisible();
});

test("J8: edit preferences saves them to the account", async ({ page, mock }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Name").fill("Grace");
  await page.getByRole("button", { name: "Shellfish" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Grace" })).toBeVisible();
  await expect(page.getByText("Shellfish")).toBeVisible();
  expect(mock.profiles.get(TESTER.id)).toMatchObject({ display_name: "Grace", allergies: ["Shellfish"] });
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Grace" })).toBeVisible();
  await nav(page).getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByText(/, Grace$/)).toBeVisible();
});

test("J8b: if saving fails, the change is not shown as saved and can be retried", async ({ page, mock }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Name").fill("Grace");
  mock.failNextProfileSave = true;
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /internet connection|went wrong/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible(); // still editing, nothing lost
  expect(mock.profiles.get(TESTER.id)?.display_name).toBe("Amaka");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Grace" })).toBeVisible();
});

test("PWA manifest and icons are served", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.name).toBe("Mealwise");
  expect(m.display).toBe("standalone");
  for (const icon of m.icons) expect((await request.get(icon.src)).status()).toBe(200);
});

test("real photos show a credit; dishes without one say they are illustrations", async ({ page }) => {
  await page.goto("/meals/jollof-rice-chicken");
  const credit = page.getByRole("link", { name: "Mohammad Fahim on Pexels" });
  await expect(credit).toBeVisible();
  await expect(credit).toHaveAttribute("href", /pexels\.com\/photo\//);
  await expect(page.locator("main img").first()).toBeVisible();

  await page.goto("/meals/fish-pepper-soup");
  await expect(page.getByText("Illustration. A real photo of this dish is coming.")).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Photo credits" })).toBeVisible();
  await expect(page.getByRole("link", { name: /on (Pexels|Unsplash)$/ })).toHaveCount(10);
});
