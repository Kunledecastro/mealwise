import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

const PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/reset-password"];
const APP_ROUTES = [
  "/onboarding", "/update-password", "/home", "/today", "/meals?slot=breakfast", "/meals?slot=lunch", "/meals?slot=dinner", "/meals?slot=snack",
  "/meals/jollof-rice-chicken", "/search", "/saved", "/progress", "/profile", "/settings", "/plan", "/plan/shopping",
];

async function checkScreen(page: Page, route: string) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  // Measure contrast in the final state, not halfway through a fade-in animation.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const res = await page.goto(route);
  expect(res?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(route.split("?")[0].replace(/\//g, "\\/") + "(\\?|$)"));
  await expect(page.getByTestId("prototype-banner")).toBeVisible();
  await expect(page.locator("main h1, h1").first()).toBeVisible();
  // No horizontal scrolling on any screen size.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  expect(errors).toEqual([]);
}

test.describe("signed out", () => {
  test.use({ signedIn: false });
  for (const route of PUBLIC_ROUTES) {
    test(`${route} renders with banner, heading, no console errors and no serious a11y issues`, async ({ page }) => {
      await checkScreen(page, route);
    });
  }
});

for (const route of APP_ROUTES) {
  test(`${route} (signed in) renders with banner, heading, no console errors and no serious a11y issues`, async ({ page }) => {
    await checkScreen(page, route);
  });
}

test("unknown meal shows the not-found page", async ({ page }) => {
  // Status is 200 + noindex because the page streams before the lookup (see BUGS_AND_ISSUES I7).
  await page.goto("/meals/not-a-real-meal");
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
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

test("estimates are labelled on every screen that shows calculated figures", async ({ page }) => {
  for (const path of ["/home", "/meals?slot=lunch", "/meals/akara-and-pap", "/search", "/today"]) {
    await page.goto(path);
    await expect(page.getByText(/^Estimates$/).first()).toBeVisible();
  }
});
