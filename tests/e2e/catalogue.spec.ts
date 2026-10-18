import { expect, test, type Page } from "./fixtures";
import { TESTER } from "./supabase-mock";

// Phase 3: real catalogue, recommendation rules and saved choices.
const nav = (page: Page) => page.locator('nav[aria-label="Main"]:visible');

test("P3-01 'Not for me' is saved to the account and survives a reload; 'Show again' restores it", async ({ page, mock }) => {
  await page.goto("/meals/akara-and-pap");
  await page.getByRole("button", { name: "Not for me" }).click();
  await page.getByRole("button", { name: "Takes too long" }).click();
  await expect(page).toHaveURL(/slot=breakfast/);
  await expect.poll(() => mock.mealPrefs.get(`${TESTER.id}|akara-and-pap`)?.reject_reason).toBe("too_long");
  await page.reload();
  const list = page.getByRole("list", { name: "Breakfast ideas" });
  await expect(list.getByRole("link", { name: "Akara and pap" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show again" }).click();
  await expect(list.getByRole("link", { name: "Akara and pap" })).toBeVisible();
  await expect.poll(() => mock.mealPrefs.get(`${TESTER.id}|akara-and-pap`)?.rejected_at).toBeNull();
});

test("P3-02 if saving a choice fails, the screen goes back and says so", async ({ page, mock }) => {
  await page.goto("/search");
  mock.failNextChoiceSave = true;
  await page.getByRole("button", { name: "Save Fresh fruit bowl" }).click();
  await expect(page.getByText(/That wasn't saved/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Fresh fruit bowl" })).toBeVisible();
});

test("P3-03 a peanut allergy hides every groundnut meal from suggestions and warns on the meal page", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.allergies = ["Peanuts"];
  await page.goto("/meals?slot=snack");
  const list = page.getByRole("list", { name: "Snack ideas" });
  await expect(list.getByRole("link").first()).toBeVisible();
  for (const name of ["Fried plantain with groundnuts", "Garden eggs with groundnuts"]) await expect(list.getByRole("link", { name })).toHaveCount(0);
  await expect(page.getByText(/not shown because of your allergies, diet or dislikes/)).toBeVisible();
  await page.goto("/meals/plantain-groundnuts");
  await expect(page.getByRole("alert").filter({ hasText: "Allergy warning: Contains Peanuts" })).toBeVisible();
});

test("P3-04 a vegetarian sees no meat, fish or crayfish meals", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.diet = ["Vegetarian"];
  mock.profiles.get(TESTER.id)!.dislikes = [];
  await page.goto("/meals?slot=lunch");
  const list = page.getByRole("list", { name: "Lunch ideas" });
  await expect(list.getByRole("link", { name: "Red red" })).toBeVisible();
  for (const name of ["Jollof rice with chicken", "Egusi soup with pounded yam", "Moi moi"]) await expect(list.getByRole("link", { name, exact: true })).toHaveCount(0);
});

test("P3-05 the meal page shows calculated figures with sources, assumptions and close matches", async ({ page }) => {
  await page.goto("/meals/egusi-pounded-yam");
  await expect(page.getByText("Estimates", { exact: true })).toBeVisible();
  await expect(page.getByText(/^about \d+ kcal$/)).toBeVisible();
  await expect(page.getByText(/Fibre/)).toBeVisible();
  await page.getByText("How these figures are estimated").click();
  await expect(page.getByRole("link", { name: "FAO/INFOODS West Africa 2019" })).toBeVisible();
  await expect(page.getByText(/Spinach \(efo\) stands in for ugu/)).toBeVisible();
  await expect(page.getByText("Close matches used")).toBeVisible();
  await expect(page.getByText(/Contains:/)).toContainText("Shellfish");
  await expect(page.getByText(/May contain:/)).toBeVisible();
  await expect(page.getByText(/check the meat is from a halal source/)).toBeVisible();
});

test("P3-06 Home shows reasons tied to the user's goal", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.goal = "lose";
  await page.goto("/home");
  await page.getByRole("button", { name: "Lunch", exact: true }).click();
  await expect(page.getByRole("list", { name: "Why this may suit you" })).toBeVisible();
  await expect(page.locator("#hero-title")).not.toBeEmpty();
});

test("P3-07 dislikes match local names (ogbono hides the ogbono soup)", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.dislikes = ["ogbono"];
  await page.goto("/meals?slot=dinner");
  await expect(page.getByRole("list", { name: "Dinner ideas" }).getByRole("link").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Ogbono soup with eba" })).toHaveCount(0);
  await nav(page).getByRole("link", { name: "Search", exact: true }).click();
  await page.getByRole("searchbox").fill("ogbono");
  await expect(page.getByRole("link", { name: "Ogbono soup with eba" })).toBeVisible(); // search still finds it
});
