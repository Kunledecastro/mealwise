import { readFile } from "node:fs/promises";
import { expect, test } from "./fixtures";
import { AUTH_COOKIE, OTHER, TESTER } from "./supabase-mock";

// Phase 2: accounts, sessions, access control, data export and deletion. Synthetic users only.

test.describe("signed out", () => {
  test.use({ signedIn: false });

  test("A1: app screens send signed-out visitors to sign in, then back to where they were going", async ({ page }) => {
    for (const path of ["/home", "/progress", "/profile", "/settings", "/onboarding", "/meals/akara-and-pap"]) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=${encodeURIComponent(path).replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`));
    }
    await page.goto("/sign-in?next=%2Fprogress");
    await page.getByLabel("Email").fill(TESTER.email);
    await page.getByLabel("Password", { exact: true }).fill(TESTER.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/progress$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("A2: sign-in validates input and gives one message for wrong email or wrong password", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter an email address like name@example.com.")).toBeVisible();
    await expect(page.getByText("Enter your password.")).toBeVisible();

    await page.getByLabel("Email").fill(TESTER.email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    const wrong = page.getByText("That email and password don't match. Check them and try again.");
    await expect(wrong).toBeVisible();

    await page.getByLabel("Email").fill("nobody@example.test");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(wrong).toBeVisible(); // same message: accounts can't be discovered this way
  });

  test("A3: an unconfirmed account is told to confirm and can resend the email", async ({ page, mock }) => {
    mock.addUser({ email: "pending@example.test", password: "Pending-pass-1", id: "33333333-3333-4333-8333-333333333333" }, { onboarded: false, confirmed: false });
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("pending@example.test");
    await page.getByLabel("Password", { exact: true }).fill("Pending-pass-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Please confirm your email first/)).toBeVisible();
    await page.getByRole("button", { name: "Send the email again" }).click();
    await expect(page.getByText("Sent. Check your inbox and spam folder.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send again in \d+s/ })).toBeDisabled();
    expect(mock.emails.some((e) => e.to === "pending@example.test" && e.kind === "resend")).toBe(true);
  });

  test("A4: sign-up checks email, password length and consent before sending anything", async ({ page, mock }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter an email address like name@example.com.")).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(page.getByText("Please agree so we can save your preferences.")).toBeVisible();
    await page.getByLabel("Email").fill("short@example.test");
    await page.getByLabel("Password", { exact: true }).fill("1234567");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    expect(mock.calls.filter((c) => c.includes("/signup"))).toEqual([]);
  });

  test("A5: signing up with an existing email looks the same as a new sign-up", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Email").fill(TESTER.email);
    await page.getByLabel("Password", { exact: true }).fill("Another-pass-9");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Check your email", { exact: true })).toBeVisible();
  });

  test("A6: forgotten password → email link → new password → sign in with it", async ({ page, mock }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await page.getByLabel("Email").fill(TESTER.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Check your email", { exact: true })).toBeVisible();
    expect(mock.emails).toContainEqual({ to: TESTER.email, kind: "recover" });

    // Stand-in for the emailed reset link.
    await page.goto(`/auth/callback?code=confirm:${TESTER.email}&next=/update-password`);
    await expect(page).toHaveURL(/\/update-password$/);
    await page.getByLabel("New password").fill(TESTER.password);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Your new password must be different from your current one.")).toBeVisible();
    await page.getByLabel("New password").fill("Brand-new-pass-3");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText("Password updated")).toBeVisible();
    expect(mock.user(TESTER.email).password).toBe("Brand-new-pass-3");
  });

  test("A7: an expired or reused email link explains what to do", async ({ page }) => {
    await page.goto("/auth/callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    await expect(page.getByRole("heading", { name: "That link didn't work" })).toBeVisible();
    await expect(page.getByText(/expired/i).first()).toBeVisible();
    await page.goto("/auth/callback?code=not-a-real-code");
    await expect(page.getByRole("heading", { name: "That link didn't work" })).toBeVisible();
  });

  test("A8: after sign-in, a link to another website is ignored", async ({ page }) => {
    await page.goto("/sign-in?next=%2F%2Fevil.example%2Fsteal");
    await page.getByLabel("Email").fill(TESTER.email);
    await page.getByLabel("Password", { exact: true }).fill(TESTER.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/localhost:\d+\/home$/);
  });

  test("A9: magic sign-in link never reveals whether the email has an account", async ({ page, mock }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Email me a sign-in link instead" }).click();
    await page.getByLabel("Email").fill("nobody@example.test");
    await page.getByRole("button", { name: "Email me a sign-in link", exact: true }).click();
    await expect(page.getByText(/If there's an account for/)).toBeVisible();
    expect(mock.emails).toContainEqual({ to: "nobody@example.test", kind: "otp" });
  });
});

test("A10: signed-in visitors skip the sign-in and sign-up pages", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/home$/);
});

test("A11: sign out ends the session and locks the app again", async ({ page, context }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  const cookies = await context.cookies();
  expect(cookies.filter((c) => c.name.startsWith(AUTH_COOKIE) && !c.name.includes("verifier") && c.value)).toEqual([]);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fhome$/);
});

test("A12: the app only ever asks for the signed-in user's own profile", async ({ page, mock }) => {
  await page.goto("/home");
  await page.goto("/profile");
  await expect(page.getByRole("heading", { level: 1, name: "Amaka" })).toBeVisible();
  // Every profile request was filtered to the signed-in user; the stand-in, like the real database, returns nothing else.
  expect(mock.calls.some((c) => c.includes("/rest/v1/profiles"))).toBe(true);
  expect(mock.profiles.get(OTHER.id)?.display_name).toBe("Amaka"); // untouched
});

test("A13: a new account that hasn't finished setup is sent to setup first", async ({ page, mock }) => {
  mock.profiles.get(TESTER.id)!.onboarding_completed_at = null;
  await page.goto("/home");
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("A14: download my data gives a JSON file with the account, profile, choices, meal log and weights", async ({ page, mock }) => {
  mock.seedWeights(TESTER.id, [["2026-10-01", 80]]);
  mock.seedWeights(OTHER.id, [["2026-10-01", 61.5]]);
  mock.seedLog(TESTER.id, { meal_slug: "red-red", logged_for: "2026-10-02", meal_type: "lunch", kcal: 600 });
  await page.goto("/settings");
  await expect(page.getByText(TESTER.email)).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download my data" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^mealwise-my-data-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(data.account).toMatchObject({ id: TESTER.id, email: TESTER.email });
  expect(data.profile).toMatchObject({ id: TESTER.id, display_name: "Amaka", consent_version: "2026-10-18" });
  expect(data.meal_log).toEqual([expect.objectContaining({ meal_slug: "red-red", kcal: 600 })]);
  expect(data.weights).toEqual([expect.objectContaining({ measured_on: "2026-10-01", weight_kg: "80.00" })]);
  expect(JSON.stringify(data)).not.toContain(OTHER.email);
  expect(JSON.stringify(data)).not.toContain("61.5");
  expect(JSON.stringify(data)).not.toContain("access_token");
});

test("A15: delete my account asks for confirmation, removes the account, and signs out", async ({ page, mock }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete my account" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  await expect(dialog).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Delete permanently" });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  expect(mock.users.has(TESTER.email)).toBe(true);

  await page.getByRole("button", { name: "Delete my account" }).click();
  await dialog.getByLabel("Type DELETE to confirm").fill("delete");
  await confirm.click();
  await expect(page).toHaveURL(/\/\?account=deleted$/);
  await expect(page.getByText("Your account and profile have been deleted.")).toBeVisible();
  expect(mock.users.has(TESTER.email)).toBe(false);
  expect(mock.profiles.has(TESTER.id)).toBe(false);
  expect(mock.users.has(OTHER.email)).toBe(true); // nobody else affected

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(TESTER.email);
  await page.getByLabel("Password", { exact: true }).fill(TESTER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match. Check them and try again.")).toBeVisible();
});

test("A16: Settings shows the delete dialog without accessibility problems", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});
