import { expect, test, type Page } from "./fixtures";
import { TESTER } from "./supabase-mock";

// Kitchen equipment, moods, usual shop and your own shopping items (DECISION_LOG 072-075). Synthetic data.

async function makeWeek(page: Page) {
  await page.goto("/plan");
  await page.getByRole("radio", { name: "A week" }).click();
  await page.getByRole("button", { name: "Make my plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your plan" })).toBeVisible();
}

test("P7-01 a kitchen without an oven or grill hides boli, and its page says why", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.appliances = ["stove"];
  await page.goto("/meals?slot=snack");
  await expect(page.getByRole("list", { name: "Snack ideas" }).getByRole("link").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Boli", exact: true })).toHaveCount(0);
  await page.goto("/meals/boli");
  await expect(page.getByText(/Needs a charcoal grill, an oven or an air fryer, which isn't in your kitchen list/)).toBeVisible();
});

test("P7-02 Profile: up to three moods, kitchen and shop are saved to the account", async ({ page, mock }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Edit" }).click();
  for (const m of ["Quick", "Light", "Protein-packed"]) await page.getByRole("button", { name: m, exact: true }).click();
  await expect(page.getByRole("button", { name: "Budget-friendly" })).toBeDisabled();
  await page.getByRole("button", { name: "Oven", exact: true }).click();
  await page.getByRole("button", { name: "Stove or cooker" }).click();
  await page.getByRole("button", { name: "Spar", exact: true }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Changes saved")).toBeVisible();
  expect(mock.profiles.get(TESTER.id)).toMatchObject({ moods: ["quick", "light", "protein"], appliances: ["oven", "stove"], shop: "spar" });
  await expect(page.getByText("Quick, Light, Protein-packed")).toBeVisible();
  await expect(page.getByText("Oven, Stove or cooker")).toBeVisible();
});

test("P7-03 a mood shows up as a reason on Home", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.moods = ["classic"];
  await page.goto("/home");
  await page.getByRole("button", { name: "Lunch", exact: true }).click();
  await expect(page.getByRole("list", { name: "Why this may suit you" }).getByText("In the mood for: west african classics")).toBeVisible();
});

test("P7-04 your own items: add, no duplicates, tick, remove, share, and they are saved", async ({ page, mock, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await makeWeek(page);
  await page.getByRole("link", { name: "Shopping list" }).click();
  const add = page.getByLabel("Add an item");
  const mine = page.locator("section", { has: page.getByRole("heading", { name: "Your own items" }) });
  await add.fill("Detergent");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await add.fill("Bread");
  await add.press("Enter");
  await expect(mine.getByRole("checkbox", { name: "Bread" })).toBeVisible();
  await add.fill("bread");
  await add.press("Enter");
  await expect(page.getByText("bread is already on your list.")).toBeVisible();
  await expect.poll(() => (mock.plans.get(TESTER.id)!.extras as { name: string }[]).map((e) => e.name)).toEqual(["Detergent", "Bread"]);

  await mine.getByRole("checkbox", { name: "Bread" }).check();
  await page.getByRole("button", { name: "Remove Detergent" }).click();
  await expect(mine.getByRole("checkbox", { name: "Detergent" })).toHaveCount(0);
  await page.reload();
  await expect(mine.getByRole("checkbox", { name: "Bread" })).toBeChecked();

  await add.fill("Toothpaste");
  await add.press("Enter");
  await page.getByRole("button", { name: "Share list" }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("Your own items\n- Toothpaste");
  expect(text).not.toContain("- Bread");

  // A new plan keeps your own items.
  await page.goto("/plan");
  await page.getByRole("button", { name: "New plan" }).click();
  await page.getByRole("button", { name: "Replace my plan" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Your plan" })).toBeVisible();
  await page.getByRole("link", { name: "Shopping list" }).click();
  await expect(mine.getByRole("checkbox", { name: "Toothpaste" })).toBeVisible();
});

test("P7-05 the list is planned for your shop and is honest that its prices aren't collected yet", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.shop = "shoprite";
  await makeWeek(page);
  await expect(page.getByText("Shopping planned for")).toBeVisible();
  await page.getByRole("link", { name: "Shopping list" }).click();
  await expect(page.getByText(/^Planned for Shoprite/)).toBeVisible();
  await expect(page.getByText("We haven't collected Shoprite prices yet, so these are average market prices. Supermarket prices are often higher.")).toBeVisible();
});
