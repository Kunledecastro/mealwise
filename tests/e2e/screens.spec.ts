import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const ROUTES = [
  "/", "/sign-in", "/sign-up", "/reset-password", "/onboarding",
  "/home", "/today", "/meals?slot=breakfast", "/meals?slot=lunch", "/meals?slot=dinner", "/meals?slot=snack",
  "/meals/jollof-rice-chicken", "/search", "/saved", "/progress", "/profile", "/settings",
];

for (const route of ROUTES) {
  test(`${route} renders with banner, heading, no console errors and no serious a11y issues`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    // Measure contrast in the final state, not halfway through a fade-in animation.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.getByTestId("prototype-banner")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    // No horizontal scrolling on any screen size.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("unknown meal shows the not-found page", async ({ page }) => {
  const res = await page.goto("/meals/not-a-real-meal");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  await page.getByRole("link", { name: "Go to home" }).click();
  await expect(page).toHaveURL(/\/home$/);
});

for (const path of ["/meals", "/search", "/saved", "/today", "/progress"]) {
  test(`${path} shows loading, empty and error states`, async ({ page }) => {
    await page.goto(`${path}?demo=loading`);
    await expect(page.locator('[aria-busy="true"]').first()).toBeVisible();
    await page.goto(`${path}?demo=error`);
    if (path !== "/progress" && path !== "/today") {
      await expect(page.getByRole("heading", { name: "Meals didn't load" })).toBeVisible();
    } else {
      await expect(page.getByRole("alert").first()).toBeVisible();
    }
    await page.goto(`${path}?demo=empty`);
    await expect(page.getByText(/No |Nothing /).first()).toBeVisible();
  });
}

test("sample data is labelled on every data screen", async ({ page }) => {
  for (const path of ["/home", "/meals?slot=lunch", "/meals/akara-and-pap", "/search", "/today", "/progress"]) {
    await page.goto(path);
    await expect(page.getByText(/^Sample (meals|figures|entries|target and figures)$/).first()).toBeVisible();
  }
});
