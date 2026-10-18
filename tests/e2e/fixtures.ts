import { test as base, expect } from "@playwright/test";
import { SupabaseMock, seedSession } from "./supabase-mock";

/**
 * - The test machine cannot reach the photo hosts (Pexels/Unsplash), so every optimised image
 *   request is answered with a local stand-in photo. Real photos are checked on the preview.
 * - It also cannot reach Supabase, so each test gets its own in-memory Supabase stand-in
 *   (see supabase-mock.ts). By default the synthetic tester is already signed in and set up;
 *   use `test.use({ signedIn: false })` to start signed out.
 */
export const test = base.extend<{ mock: SupabaseMock; signedIn: boolean }>({
  signedIn: [true, { option: true }],
  mock: async ({ context, signedIn, baseURL }, provide) => {
    const mock = new SupabaseMock();
    await mock.install(context);
    if (signedIn) await seedSession(context, mock, undefined, baseURL);
    await provide(mock);
  },
  page: async ({ page, mock }, provide) => {
    void mock; // make sure the mock is installed before the page is used
    await page.route("**/_next/image**", (route) =>
      route.fulfill({ path: "tests/e2e/fixtures/photo.jpg", contentType: "image/jpeg" }),
    );
    await provide(page);
  },
});

export { expect };
export type { Page } from "@playwright/test";
