# Mealwise — Testing Strategy and Results

## Layers

| Layer | Tool | What it covers | From phase |
|---|---|---|---|
| Unit | Vitest | Pure domain logic: unit conversion, filtering, formatting; later nutrition, recommendations, shopping lists | 1 |
| Component | Vitest + Testing Library | Plate illustration determinism and labels; later forms | 1 |
| Database / RLS | SQL tests against local Supabase (Docker), two synthetic users | Owner-only access on every user table | 2 |
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
| R-05 | E2E | Tests matched text in the previous page, which Next.js 16 keeps hidden in memory | Tests scoped to the visible page (not an app defect) |

---

## Phase 1 manual tests (for you)

Run the app (README → "Run it on your computer"), or use the preview link once D10 is resolved. Use a phone-sized window for at least half of these.

| ID | Feature | Steps | Expected |
|---|---|---|---|
| M1-01 | Landing hero | Open `/` | Dark page; big "What can I eat next?"; a dish name in amber glow and a plate that assembles, changing every few seconds; pause button stops it. Prototype banner at top. |
| M1-01b | Landing motion | Scroll the whole landing page on phone and desktop | Two drifting rows of dishes; "How it works" steps (desktop: phone on the left changes screen per step); feature cards glow under the mouse (desktop); sections fade in once; closing plates float. Nothing jumps or overlaps. |
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
