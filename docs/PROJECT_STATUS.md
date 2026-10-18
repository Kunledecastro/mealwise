# Mealwise — Project Status

**Current phase:** Phase 2 — Accounts and saved profiles
**Last completed phase:** Phase 1 (approved 2026-10-18)
**Implementation status:** Phase 2 built and tested by Claude. **Awaiting your one-time Supabase setting (M2-00), your testing, and approval.**
**Last updated:** 2026-10-18

## Completed
- Phase 0 documents (approved).
- Phase 1 prototype and redesign with real photos (approved).
- Phase 2:
  - Supabase project `mealwise-dev` (free, London) with the `profiles` table, Row Level Security, triggers and tightened permissions (DATABASE_SCHEMA §0).
  - Sign up (with consent), confirm by email, sign in with password or emailed link, forgotten password, set new password, sign out.
  - Screens locked when signed out; new accounts sent to setup; setup answers and profile edits saved to your account and kept across reloads and devices.
  - Settings: shows who you're signed in as; **Download my data** (JSON); **Delete my account** (confirmation required, server-side deletion that only ever deletes the caller).
  - Vercel now has the two public Supabase settings, so the test link talks to the real database.

## Incomplete (by design, later phases)
- Meals, saved meals, "not for me", meal logs and weights are still in-memory sample data (Phases 3–4). The banner says so.
- Real catalogue and recommendation engine (Phase 3); real calorie targets (Phase 4); plans and shopping lists (Phase 5).
- Emails from outside the Supabase organisation (decision 030), security headers, "sign out everywhere" (Phase 6).

## Known defects / limitations
No open defects. Three defects found by testing were fixed (TEST_PLAN P2-01..03). Open issues I7–I10 in BUGS_AND_ISSUES.md: unknown-meal page returns status 200 (not 404, users see the right page); built-in email only reaches organisation members; real email links and the deployed delete function need your manual test; sign-out is per device.

## Latest test results (2026-10-18)
- TypeScript, ESLint, production build: pass.
- Unit tests: **52/52 passed**.
- End-to-end (phone + desktop, Supabase stand-in): **108/108 passed**, including axe accessibility checks (zero serious issues).
- Database access tests on the real database: **18/18 passed**, test data rolled back. Supabase advisors: no warnings.
- Lighthouse (mobile): accessibility 100 on welcome, sign-up, sign-in; performance 88 / 95 / 97.
- **Not tested by Claude** (no network route from this workspace): real email delivery and links, and the deployed delete-account function. These are M2-01..M2-10.

## Decisions requiring your input
| ID | Decision | Recommendation |
|---|---|---|
| 030 | Email for testers outside your Supabase organisation | Keep the free built-in sender while only you test. Before inviting others, add a custom sender (e.g. Resend free tier, needs a domain you own). I won't set it up or incur cost without your approval |

## Where things live
- Code: private GitHub repo `Kunledecastro/mealwise`, branch `main`.
- Hosting: Vercel project `mealwise` (Hobby, free). Every push to `main` deploys automatically. Test link: https://mealwise-flame.vercel.app — Vercel login required (not public).
- Database: Supabase project `mealwise-dev` (ref `naaoigrhzfivantuysxl`), free plan. Free projects pause after about a week without use; un-pausing is free from the dashboard.

## Exact next step
1. Set the Supabase URL configuration (TEST_PLAN M2-00, two minutes).
2. Run the Phase 2 manual tests M2-01..M2-13 in TEST_PLAN.md.
3. Reply **"Phase 2 approved"**, or list changes. Phase 3 (meal catalogue and recommendations) starts only after approval.
