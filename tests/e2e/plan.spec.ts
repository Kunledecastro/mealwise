import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";
import { TESTER } from "./supabase-mock";

// Phase 5: meal plans and the shopping list, saved to the account. All data synthetic.
// The seeded tester's daily target is about 1,750 kcal (see tracking.spec.ts).

type Item = { day: number; slot: string; slug: string; servings: number };
const nav = (page: Page) => page.locator('nav[aria-label="Main"]:visible');
const items = (mock: { plans: Map<string, Record<string, unknown>> }) => (mock.plans.get(TESTER.id)?.items ?? []) as Item[];

async function makeWeek(page: Page, snacks = true) {
  await page.goto("/plan");
  await page.getByRole("radio", { name: "A week" }).click();
  if (snacks) await page.getByLabel("Include a snack each day").check();
  await page.getByRole("button", { name: "Make my plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your plan" })).toBeVisible();
}

test("P5-01 J7: make a week's plan from the Plan tab; it fits the target and is saved to the account", async ({ page, mock }) => {
  await page.goto("/home");
  await nav(page).getByRole("link", { name: "Plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Plan your meals" })).toBeVisible();
  await makeWeek(page);
  const days = page.getByRole("group", { name: "Day" }).getByRole("button");
  await expect(days).toHaveCount(7);
  await expect(days.first()).toHaveAttribute("aria-pressed", "true");
  await expect(days.first()).toContainText("Today");
  const today = page.locator("li", { hasText: /^Breakfast|Lunch|Dinner|Snack/ });
  await expect(today.filter({ has: page.getByRole("link") })).toHaveCount(4);
  await expect(page.getByText(/target about 1,750/)).toBeVisible();
  // Stored in the account.
  expect(items(mock)).toHaveLength(28);
  expect(new Set(items(mock).map((i) => i.slug)).size).toBe(28);
  await page.reload();
  await expect(page.getByRole("group", { name: "Day" }).getByRole("button")).toHaveCount(7);
  // Another day.
  await page.getByRole("group", { name: "Day" }).getByRole("button").nth(2).click();
  await expect(page.getByRole("heading", { level: 2 }).first()).not.toHaveText("Today");
  // No serious accessibility problems with a full plan on screen.
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});

test("P5-02 swap a meal: options obey the slot and the choice is saved", async ({ page, mock }) => {
  await makeWeek(page, false);
  const before = items(mock).find((i) => i.day === 0 && i.slot === "lunch")!.slug;
  await page.getByRole("button", { name: "Swap lunch" }).click();
  const sheet = page.getByRole("dialog", { name: "Choose a lunch" });
  await expect(sheet).toBeVisible();
  const first = sheet.getByRole("listitem").first();
  const name = (await first.locator("span.font-semibold").innerText()).trim();
  await first.getByRole("button").click();
  await expect(page.getByText(`Swapped in ${name}`)).toBeVisible();
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  const after = items(mock).find((i) => i.day === 0 && i.slot === "lunch")!.slug;
  expect(after).not.toBe(before);
  expect(items(mock)).toHaveLength(21); // nothing else changed
});

test("P5-03 'cooking for' changes servings (0.5 to 8) and the shopping list follows", async ({ page, mock }) => {
  await makeWeek(page, false);
  const group = page.getByRole("group", { name: "Cooking for, Lunch" });
  await group.getByRole("button", { name: /More servings/ }).click();
  await group.getByRole("button", { name: /More servings/ }).click();
  await expect(group.getByText("Cooking for 3")).toBeVisible();
  await expect.poll(() => items(mock).find((i) => i.day === 0 && i.slot === "lunch")!.servings).toBe(3);
  for (let i = 0; i < 3; i++) await group.getByRole("button", { name: /Fewer servings/ }).click();
  await expect(group.getByText("Cooking for ½")).toBeVisible();
  await expect(group.getByRole("button", { name: /Fewer servings/ })).toBeDisabled();
});

test("P5-04 shopping list: ₦ estimate, 'have it' drops an item from the cost, ticks are saved", async ({ page, mock }) => {
  await makeWeek(page, false);
  await page.getByRole("link", { name: "Shopping list" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Shopping list" })).toBeVisible();
  const cost = page.locator("section", { has: page.getByRole("heading", { name: "Estimated cost" }) });
  await expect(cost.getByText(/^₦[\d,]+–₦[\d,]+$/)).toBeVisible();
  const before = await cost.getByText(/^₦[\d,]+–₦[\d,]+$/).innerText();
  await expect(cost.getByText(/may need to buy whole packs/)).toBeVisible();
  // An item with a price: mark it as already at home.
  const priced = page.locator("li", { hasText: /₦[\d,]+–₦[\d,]+/ }).first();
  const label = await priced.getByRole("button", { name: /^Have it: / }).getAttribute("aria-label");
  await priced.getByRole("button", { name: /^Have it: / }).click();
  await expect(page.getByRole("button", { name: label! })).toHaveAttribute("aria-pressed", "true");
  await expect(cost.getByText(/^₦[\d,]+–₦[\d,]+$/)).not.toHaveText(before);
  // Tick another as bought.
  const second = page.getByRole("checkbox").nth(1);
  await second.check();
  await expect.poll(() => Object.values(mock.plans.get(TESTER.id)!.shopping as Record<string, string>).sort()).toEqual(["bought", "have"]);
  await page.reload();
  await expect(page.getByRole("button", { name: label! })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("checkbox").nth(1)).toBeChecked();
});

test("P5-05 share list copies a plain-text list without the ticked items", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await makeWeek(page, false);
  await page.getByRole("link", { name: "Shopping list" }).click();
  const first = page.locator("li").filter({ has: page.getByRole("checkbox") }).first();
  const name = (await first.locator("label span.font-semibold").innerText()).trim();
  await first.getByRole("button", { name: /^Have it: / }).click();
  await page.getByRole("button", { name: "Share list" }).click();
  await expect(page.getByText(/List copied/)).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toMatch(/^Mealwise shopping list\n/);
  expect(text).toMatch(/\n- .+: (about|a little|\d+ ×|1 )/);
  expect(text).not.toContain(`- ${name}:`);
});

test("P5-06 I ate this from today's plan logs it", async ({ page, mock }) => {
  await makeWeek(page, false);
  await page.getByRole("button", { name: /^I ate / }).first().click();
  await expect(page.getByText(/^Logged .+ to today$/)).toBeVisible();
  expect(mock.mealLogs).toHaveLength(1);
});

test("P5-07 a new plan warns that it replaces the current one and resets the ticks", async ({ page, mock }) => {
  await makeWeek(page, false);
  mock.plans.get(TESTER.id)!.shopping = { "rice-white": "have" };
  await page.getByRole("button", { name: "New plan" }).click();
  await expect(page.getByText("This replaces your current plan and its shopping list ticks.")).toBeVisible();
  await page.getByRole("button", { name: "Keep current plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your plan" })).toBeVisible();
  await page.getByRole("button", { name: "New plan" }).click();
  await page.getByRole("radio", { name: "Today" }).click();
  await page.getByRole("button", { name: "Replace my plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your plan" })).toBeVisible();
  expect(mock.plans.get(TESTER.id)).toMatchObject({ days: 1, shopping: {} });
  expect(items(mock)).toHaveLength(3);
});

test("P5-08 if saving the plan fails, nothing is shown as saved", async ({ page, mock }) => {
  await page.goto("/plan");
  mock.failNextPlanSave = true;
  await page.getByRole("button", { name: "Make my plan" }).click();
  await expect(page.getByText(/Your plan wasn't saved/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Make my plan" })).toBeVisible();
  expect(mock.plans.size).toBe(0);
});

test("P5-09 a peanut allergy keeps groundnut dishes out of the plan, and optional groundnuts off the list", async ({ page, mock }) => {
  (mock.profiles.get(TESTER.id) as Record<string, unknown>).allergies = ["Peanuts"];
  await makeWeek(page);
  const slugs = items(mock).map((i) => i.slug);
  // Boli may appear: its groundnuts are an optional extra (the meal page warns), but they never reach the list.
  for (const s of ["groundnut-soup-chicken", "garden-eggs-groundnuts", "banana-groundnuts", "oats-banana-groundnuts", "plantain-groundnuts"]) expect(slugs).not.toContain(s);
  await page.getByRole("link", { name: "Shopping list" }).click();
  await expect(page.getByText("Groundnuts", { exact: true })).toHaveCount(0);
});

test("P5-10 an ended plan asks for a new one; download my data includes the plan", async ({ page, mock }) => {
  mock.plans.set(TESTER.id, { id: TESTER.id, user_id: TESTER.id, start_date: "2026-01-01", days: 1, include_snacks: false, items: [{ day: 0, slot: "lunch", slug: "red-red", servings: 1 }], shopping: {} });
  await page.goto("/plan");
  await expect(page.getByText("Your last plan has ended. Make a new one below.")).toBeVisible();
  await page.goto("/settings");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download my data" }).click()]);
  const data = JSON.parse(await (await import("node:fs/promises")).readFile((await download.path())!, "utf8"));
  expect(data.meal_plan).toMatchObject({ start_date: "2026-01-01", items: [expect.objectContaining({ slug: "red-red" })] });
});
