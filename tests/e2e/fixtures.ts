import { test as base, expect } from "@playwright/test";

/**
 * The test machine cannot reach the photo hosts (Pexels/Unsplash), so every optimised
 * image request is answered with a local stand-in photo. Layout, sizing and states are
 * still exercised; real photos are verified on the deployed preview instead.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("**/_next/image**", (route) =>
      route.fulfill({ path: "tests/e2e/fixtures/photo.jpg", contentType: "image/jpeg" }),
    );
    await use(page);
  },
});

export { expect };
export type { Page } from "@playwright/test";
