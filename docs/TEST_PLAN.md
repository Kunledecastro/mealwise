# Mealwise — Testing Strategy and Results

## Layers

| Layer | Tool | What it covers | From phase |
|---|---|---|---|
| Unit | Vitest | Pure domain logic: unit conversion, filtering, formatting; later nutrition, recommendations, shopping lists | 1 |
| Component | Vitest + Testing Library | Plate illustration determinism and labels; later forms | 1 |
| Database / RLS | SQL tests run against the real `mealwise-dev` database, two synthetic users, auto-rolled back (`supabase/tests/`) | Owner-only access on every user table | 2 |
| End-to-end | Playwright, Chromium phone (390×844) + desktop (1280×800) | User journeys | 1 |
| Accessibility | axe-core in Playwright + Lighthouse | WCAG 2.1 AA | 1 |
| Performance | Lighthouse mobile (throttled) | JS budget, LCP, blocking time | 1 baseline, 6 audit |
| Manual | Checklist per phase for the product owner | Real-phone usability, tone | Every phase |

Rules: a test is reported "passed" only if it was actually run. Test data is synthetic only.

Environment note: this workspace can't download Playwright browsers, so tests use the pre-installed Chromium 141 with `@playwright/test` pinned to 1.56.1 (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). On your own machine, run `npx playwright install chromium` once.

---

## Phase 1 automated results (run 2026-10-17)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass, 36 routes |
| Unit tests | **34 passed, 0 failed** (units 10, meals/filters/catalogue 21, plate art 3) |
| E2E tests | **72 passed, 0 failed** (36 per viewport) |
| Lighthouse a11y | 100 on `/`, `/home`, meal detail, `/search`, `/progress`, `/today` |
| Lighthouse performance | 83–96 (run-to-run variation); JS 186 KB compressed |

### E2E coverage (each runs at phone and desktop size)
- E2E-01..17: every screen returns 200, shows the prototype banner and an H1, has no horizontal scroll, no console errors, no serious/critical axe issues.
- E2E-18: unknown meal → 404 page → back home.
- E2E-19..23: loading, empty and error previews on Meals, Search, Saved, Today, Progress.
- E2E-24: sample labels present on all data screens.
- E2E-25: main navigation and current-tab marking; Profile → Settings.
- E2E-26 (J1): onboarding — goal required, under-18 blocked, weight range validation, peanut allergy hides peanut meals.
- E2E-27 (J2): suggestion → meal → log half a serving → appears on Today.
- E2E-28: "Show another" changes the suggestion.
- E2E-29 (J3): "Not for me" hides a meal; "Show again" restores it.
- E2E-30: save/unsave and the empty Saved state.
- E2E-31 (J4): search no-results, clear, text + time filter.
- E2E-32 (J5): weight — non-numeric and future date rejected, add, edit, delete, kg→lb switch.
- E2E-33 (J6): remove logged meals → empty Today.
- E2E-34 (J8): edit preferences → name shown on Home.
- E2E-35: sign-in validation and "accounts aren't switched on" notice.
- E2E-36: PWA manifest and icons served.

### Defects found and fixed during Phase 1 testing
| ID | Found by | Issue | Fix |
|---|---|---|---|
| P1-01 | Build | Sample dates computed from the server clock (UTC) during pre-rendering could show the wrong day | Dates now come from the user's own clock after load; skeletons show meanwhile |
| P1-02 | Lint | State updated inside effects (extra renders) | Clock read via `useSyncExternalStore`; log defaults set when the dialog opens |
| P1-03 | axe (E2E) | Today's totals list had invalid `<dl>` structure for screen readers | Restructured so each `dt` and `dd` sit directly in their group |
| P1-04 | Visual review | Filter chips wrapped text; unit switch stretched full width; chart labels tiny on phones; "Sample" tag stretched | Layout fixes |
| P1-05 | Visual review | Error "Try again" dropped the selected meal tab | Keeps other URL parameters |
| P1-06 | Review | Portion buttons read "½ serving" / "1½ servings" ambiguously to screen readers | Now "Half a serving", "One and a half servings" |

### Redesign (2026-10-17) — results and defects fixed
All checks re-run after the redesign: unit 34/34, E2E 72/72, axe zero serious issues, Lighthouse accessibility 100.

| ID | Found by | Issue | Fix |
|---|---|---|---|
| R-01 | axe (E2E) | Dimmed inactive steps in the landing scroll story fell below text contrast minimum | Body text stays full contrast; only headings dim |
| R-02 | Review | Hero headline read as "What can Ieat next?" to screen readers (line break without a space) | Space added before the break |
| R-03 | Visual review | On phones the scroll story showed only one phone screen | Each step shows its own phone screen on small screens |
| R-04 | Lighthouse | Landing performance 68: grain overlay was the slowest-painting element; ~4,000 page elements | Removed grain; tiny plates skip textures (DOM 4,085 → 2,415); headline no longer starts transparent. Now 85–88 |
| R-06 | E2E (flaky 1 in 3) | Contrast check sometimes ran mid fade-in on the landing page | Accessibility checks now run with reduced motion (final state); suite passed twice in a row (148/148) |
| R-05 | E2E | Tests matched text in the previous page, which Next.js 16 keeps hidden in memory | Tests scoped to the visible page (not an app defect) |

---

## Phase 3 (batch 1) automated results (run 2026-10-18)

| Check | Result |
|---|---|
| `npm run typecheck` / `npm run lint` / `npm run build` | Pass / Pass / Pass (40 meal pages pre-built) |
| Unit tests | **95 passed, 0 failed** (new: catalogue maths 16, engine 19, real-catalogue integrity 11, search 8) |
| E2E tests | **122 passed, 0 failed** (61 per viewport), Supabase stand-in |
| Database access tests, `meal_preferences` (real database) | **15/15 passed**, rolled back |
| Supabase advisors | Performance: none. Security: 1 warning, leaked-password protection off (I12) |
| Lighthouse mobile | Accessibility 100 on `/` and `/sign-in`; performance 86 / 93. JS 259 KB compressed, over the 200 KB budget (I11) |

### What the new tests prove
- **Every figure is traceable:** each of the 70 ingredients cites a source table, code and source food name; energy agrees with protein/fat/carbs/fibre within 4% for all of them (catches copy errors).
- **Allergy safety:** for each of the 9 allergens, across every meal slot of the real catalogue, no suggestion contains or *may contain* it; meals with unknown allergen content are hidden from anyone with an allergy; search applies the same rule.
- **Diet labels** are derived from ingredients: crayfish or a beef stock cube makes a dish non-vegetarian.
- **Engine:** deterministic order, lighter/high-protein meals rank first for "lose", energy-dense for "gain"; time, budget, cuisine, variety and saved each move a meal; reasons only state what the data shows.
- **Saved / Not for me** persist in the account across reloads; a failed save rolls back with a message.

### Defects found and fixed during Phase 3 testing
| ID | Found by | Issue | Fix |
|---|---|---|---|
| P3-01 | axe (E2E) | The new "Prices from …" note sat inside the meal facts list in a way screen readers can't parse | Moved inside the value it describes |

## Phase 3 manual tests (for you)

On the test link after the deploy, signed in. M3-01 is the main one: please review the meals themselves.

| ID | Feature | Steps | Expected |
|---|---|---|---|
| M3-01 | **Catalogue review** | Open `docs/CATALOGUE_REVIEW.md` in the Project. For each meal check serving size, ingredient amounts (especially oil), and that nothing is missing | Reply with slug + change for anything that looks wrong. Pay special attention to I14 (roasted corn, okpa, akara fibre) |
| M3-02 | Meal page | Open any meal → "How these figures are estimated" | Fibre shown; assumptions, close matches and sources (FAO/USDA) listed; allergens split into "Contains" and "May contain" |
| M3-03 | Personal ranking | Profile → set goal "Lose weight" → Home → Lunch; then set "Gain weight" | Different top suggestion; reasons such as "High in protein…" or "Good protein for gaining" |
| M3-04 | Allergy | Profile → add Peanuts → Home → Snack and Meal ideas | No groundnut meals; a note says some meals are hidden. Open `/meals/plantain-groundnuts`: red allergy warning |
| M3-05 | Diet | Set Vegetarian | No meat, fish or crayfish meals in any list (e.g. Red red, Okpa, Akara and pap stay) |
| M3-06 | Dislikes | Add "ogbono" and "okro" to dislikes | Ogbono and okra soups disappear from suggestions (search still finds them) |
| M3-07 | Saved persists | Save two meals, close the browser, reopen, open Saved; try on a second device | Both still saved |
| M3-08 | Not for me persists | "Not for me" on a meal → reload → Meal ideas | Listed under "Meals you said weren't for you"; "Show again" brings it back |
| M3-09 | Prices | Look at any meal | "Price not yet estimated" (until prices are added, I13) |
| M3-10 | Search | Search "elubo", "egusi", "beans" | Finds amala, egusi soup, bean dishes |
| M3-11 | Data download | Settings → Download my data | File now includes `meal_choices` |
| M3-12 | Tone | Read meal descriptions, reasons, allergy warnings | Clear, no guilt language; estimates labelled |

---

## Phase 2 automated results (run 2026-10-18)

| Check | Result |
|---|---|
| `npm run typecheck` / `npm run lint` / `npm run build` | Pass / Pass / Pass |
| Unit tests | **52 passed, 0 failed** (Phase 1: 34; new: profile mapping, safe redirects, error messages, session-cookie check: 18) |
| E2E tests | **108 passed, 0 failed** (54 per viewport), against the Supabase stand-in |
| Database access tests (`supabase/tests/rls_profiles.sql`) on the real database | **18/18 passed**; data rolled back (0 users, 0 profiles afterwards) |
| Supabase security + performance advisors | No warnings |
| axe (in E2E) | Zero serious/critical issues on 18 screens + the delete-account dialog |
| Lighthouse mobile (public pages) | Accessibility 100 on `/`, `/sign-up`, `/sign-in`; performance 88 / 95 / 97 |

**What the stand-in does and doesn't prove.** This workspace has no network route to supabase.co, so the browser tests answer Supabase's calls with an in-memory copy (`tests/e2e/supabase-mock.ts`) that follows the same rules (own profile only, 18+, protected consent fields). They prove the app's screens, sessions, redirects and error handling. They do **not** prove real email delivery, real email links, or the deployed delete-account function — those are your manual tests M2-01 to M2-10 below. The database rules themselves are proven by the SQL tests on the real database.

### Database access checks (real database)
01 sign-up trigger creates profile with consent · 02 user reads own profile · 03 user sees only one row · 04 can't read another user · 05 updates own profile · 06 can't update another user · 07 can't insert profiles · 08 consent fields can't be changed · 09 id can't be changed · 10 under-18 birth year rejected · 11 over-long dislike rejected · 12 out-of-range height rejected · 13 internal trigger function not callable · 14 signed-out visitor can't read · 15 signed-out visitor can't update · 16 other user's row unchanged after attempts · 17 RLS switched on · 18 only "read own" and "update own" policies exist (so removal and insertion are refused).

### New E2E coverage (each at phone and desktop size)
- A1 signed-out visitors to any app screen go to sign-in, then back where they were going.
- A2 sign-in validation; the same message for wrong password and unknown email.
- A3 unconfirmed account: told to confirm; resend works with a 60-second cooldown.
- A4 sign-up checks email, 8+ character password and consent before sending anything.
- A5 signing up with an existing email looks identical to a new sign-up.
- A6 forgotten password → link → reusing the old password refused → new password saved → "Password updated".
- A7 expired or invalid email links explain what to do.
- A8 sign-in ignores links to other websites (`?next=//evil.example`).
- A9 "Email me a sign-in link" never reveals whether an account exists.
- A10 signed-in visitors skip the sign-in and sign-up pages.
- A11 sign out clears the session and locks the app.
- A12 the app only requests the signed-in user's own profile.
- A13 an account that hasn't finished setup is sent to setup.
- A14 "Download my data" gives a JSON file with the account and profile only, no tokens.
- A15 delete account: confirmation required (type DELETE), account and profile removed, signed out, other users untouched, old password no longer works.
- A16 delete dialog passes accessibility checks.
- J1 (updated) sign up → confirm link → setup → answers saved, consent recorded, still there after reload.
- J8 / J8b (updated) profile edits save to the account and survive reload; a failed save shows an error, keeps the edit, and can be retried.

### Defects found and fixed during Phase 2 testing
| ID | Found by | Issue | Fix |
|---|---|---|---|
| P2-01 | E2E A7 | An expired email link said "Enter a valid email address" (Supabase's wording "link is invalid or has expired" matched the email check first) | Link errors are checked first; unit test U2-17 |
| P2-02 | E2E A6 | Reusing your current password said "Choose a stronger password" (Supabase's wording "should be different" matched the weak-password check) | Same-password checked first; unit test U2-18 |
| P2-03 | E2E A11, A15 | After "Sign out" or "Delete my account", you landed on the sign-in page instead of the welcome page (the screen guard reacted before the planned redirect) | The app remembers the sign-out was deliberate and lets the screen choose where to go |

---

## Phase 2 manual tests (for you)

Do these on the test link (https://mealwise-flame.vercel.app, Vercel login first) **using your own email address** (it must be a member of the Supabase organisation — see M2-00). Use your phone for at least M2-01 to M2-05. Open every email link on the **same phone/browser** where you started.

| ID | Feature | Steps | Expected |
|---|---|---|---|
| M2-00 | Setup (once) | Supabase dashboard → project `mealwise-dev` → Authentication → URL Configuration. Site URL: `https://mealwise-flame.vercel.app`. Redirect URLs: add `https://mealwise-flame.vercel.app/**` and `http://localhost:3000/**`. Save | Saved. Without this, email links point to localhost and fail |
| M2-01 | Sign up | Welcome page → Get started → your email, a password of 8+ characters, tick the agreement → Create account | "Check your email". An email from Supabase arrives within a few minutes (check spam) |
| M2-02 | Confirm | Open the email's link on the same device | After Vercel login if asked, you land on setup ("onboarding") |
| M2-03 | Setup saves | Complete setup with a peanut allergy → Save and show me meals. Then close the browser fully and reopen the link | Home greets you by name; after reopening you're still signed in and your name is still there |
| M2-04 | Edit profile | Profile → Edit → change name and add Shellfish → Save changes. Refresh | Toast "Changes saved"; the change is still there after refresh |
| M2-05 | Second device | Sign in on a laptop with the same email/password | Same name and preferences appear |
| M2-06 | Wrong password | Sign out, then sign in with a wrong password | "That email and password don't match…" — no hint whether the account exists |
| M2-07 | Reset password | Sign in → Forgot your password? → your email → open the email link → choose a new password | Home with "Password updated"; the new password works next sign-in |
| M2-08 | Sign-in link | Sign in → "Email me a sign-in link instead" → open the email | You're signed in without a password |
| M2-09 | Download | Profile → Settings → Download my data → open the file | A `.json` file with your email and your profile answers; nothing about anyone else |
| M2-10 | Delete | Settings → Delete my account → type DELETE → Delete permanently. Then try to sign in | Welcome page says the account was deleted; signing in fails. (Sign up again afterwards if you want to keep testing) |
| M2-11 | Signed-out lock | Sign out, then open `https://mealwise-flame.vercel.app/progress` | Sent to sign-in; after signing in you land on Progress |
| M2-12 | Banner | Look at any app screen | Banner says account and preferences are saved; meals, logs and weights are still sample data |
| M2-13 | Tone | Read the sign-up, error and delete messages | Clear, calm, no blame; nothing technical |

Record Pass/Fail and any issue against each ID when you reply.

---

## Phase 1 manual tests (for you)

Run the app (README → "Run it on your computer"), or use the preview link once D10 is resolved. Use a phone-sized window for at least half of these.

| ID | Feature | Steps | Expected |
|---|---|---|---|
| M1-01 | Landing hero | Open `/` | Dark page; big "What can I eat next?"; a dish name in amber glow and a plate that assembles, changing every few seconds; pause button stops it. Prototype banner at top. |
| M1-01b | Landing motion | Scroll the whole landing page on phone and desktop | Two drifting rows of dishes; "How it works" steps (desktop: phone on the left changes screen per step); feature cards glow under the mouse (desktop); sections fade in once; closing plates float. Nothing jumps or overlaps. |
| M1-01d | Real photos | Open the landing page, Home, and these meals: jollof rice with chicken, akara and pap, yam and egg sauce, egusi, efo riro, roasted corn, rice and beans with plantain, fried plantain with groundnuts, fruit bowl, chicken salad | Each shows a real photo that matches the dish name, with "Photo: … on Pexels/Unsplash" under it on the meal page. Tell me any that look wrong. |
| M1-01c | Reduced motion | Turn on "Remove animations" (Android: Settings → Accessibility) or "Reduce motion" (iPhone/Mac), reload `/` | No slideshow, no drifting rows, everything visible immediately. |
| M1-02 | Onboarding: goal | Get started → press Continue without choosing | "Choose a goal to continue." Choose any goal → Continue works. |
| M1-03 | Onboarding: age gate | On "About you", enter a birth year making you 16 | Message that Mealwise is for adults; Continue disabled. |
| M1-04 | Onboarding: validation | Enter 1990, weight 900 → Continue | "Enter a weight between 20 and 400 kg." Fix to a real value → continues. |
| M1-05 | Onboarding: units | Switch to "lb and ft" | Height becomes feet + inches; weight labels say lb. |
| M1-06 | Onboarding: skip | On "Food you eat" and "Budget and time", press Skip | Moves on; Summary shows "None given"/"Not given". |
| M1-07 | Onboarding: finish | Summary → "Show me meals" | Home greets you by the name you entered. |
| M1-08 | Home | Look at Home at different times, or tap Breakfast/Lunch/Dinner/Snack | One suggestion with plate, kcal, time, ₦ range, reasons; "Show another" changes it; "Sample meals" label visible. |
| M1-09 | Not for me | Tap "Not for me" → pick a reason | Toast confirms; that meal no longer suggested. On Meal ideas, "Show again" brings it back. |
| M1-10 | Meal detail | Open any meal | Plate, description, tags, per-serving facts labelled sample, macro bar, "How these figures are estimated", ingredients, numbered steps, allergen note. |
| M1-11 | Log a meal | On a meal tap "I ate this" → choose ½ → Log meal | Toast "Logged … to today". Home → "Open today" shows it with 0.5 servings and updated totals. |
| M1-12 | Today | Remove a logged meal with the bin icon | It disappears; totals drop. Remove all → "Nothing logged today". |
| M1-13 | Save | Tap a bookmark on any list, then open Saved | Meal is listed. Remove all → "Nothing saved yet". |
| M1-14 | Search | Type "beans"; tap "Under 45 min"; type "pizza" | Results narrow; "pizza" shows "No meals match" with a clear button that resets. |
| M1-15 | Progress | Add a weight for yesterday; try a future date; try "abc" | Valid entry appears in chart + history; future date and non-numbers show clear errors. |
| M1-16 | Progress edit/delete | Pencil → change value → Save; bin → Delete | Value updates; entry removed after confirming. |
| M1-17 | Units | Progress → switch to lb | All weights show in lb (79.4 kg → 175.0 lb). |
| M1-18 | Profile | Profile → Edit → change name and an allergy → Save | Profile and Home reflect it for this session. |
| M1-19 | Settings states | Settings → Prototype tools → open each "View" link | Each shows a loading skeleton, a helpful empty message, or an error with "Try again". |
| M1-20 | 404 | Settings → "meal that doesn't exist" | "We couldn't find that page" with a way home. |
| M1-21 | Sign in | `/sign-in` → submit empty, then a valid email + password | First shows a field error; then a clear notice that accounts aren't on yet. Nothing is sent anywhere. |
| M1-22 | Reset behaviour | Make changes, then refresh the browser | Everything returns to the sample data (expected in this prototype). |
| M1-23 | Desktop | Open at full desktop width | Left navigation rail; content stays readable; nothing overlaps. |
| M1-24 | Install (optional) | On Android Chrome, menu → "Add to Home screen" | Mealwise icon installs and opens without browser bars. (Needs an https preview link; won't work on a plain local IP.) |
| M1-25 | Tone | Read through the screens | No guilt or shaming language; anything that is an estimate or sample says so. |

Record Pass/Fail and any issue against each ID when you reply.
