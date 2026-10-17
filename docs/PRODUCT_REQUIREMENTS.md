# Mealwise — Product Requirements (Phase 0 draft)

Status: APPROVED 2026-10-17 (Phase 0)
Last updated: 2026-10-17

## 1. Problem and vision

Adults who want to manage their weight struggle with two daily questions: *what should I eat next*, and *is it consistent with my goal*. Existing apps are either Western-food-centric calorie spreadsheets or generic recipe sites. Mealwise is a friendly personal food planner that recommends real meals (Nigerian and international) that fit the user's goal, preferences, budget and exclusions, and lets them log and track progress without guilt.

North-star question for the home screen: **"What can I eat next?"**

## 2. Target users (MVP)

Adults (18+) — primarily in Nigeria initially — who want to lose, gain or maintain weight, eat more consistently, and discover affordable meals using familiar ingredients.

Explicitly **not** in MVP scope: under-18s, pregnant/breastfeeding users, users managing a medical condition through diet. For these, the app shows general information only and recommends a qualified professional; it does not compute weight-change targets.

### Personas (illustrative)
- **Amaka, 29, Lagos, office worker** — wants to lose ~6 kg, eats out at lunch, budget-conscious, no time to cook on weekdays.
- **Tunde, 34, Abuja** — wants to gain weight/muscle, cooks at home, likes rice and beans, eggs, chicken.
- **Grace, 45, Port Harcourt** — wants to maintain weight and eat more consistently; shellfish allergy; prefers soups and swallows.

## 3. MVP scope (Phases 1–5)

| Area | In MVP | Notes |
|---|---|---|
| Onboarding | Display name, year of birth (age gate), sex (for energy formula, optional), height, weight, units, goal, target weight, activity level, dietary preferences, allergies/exclusions, likes/dislikes, cuisines, budget band, prep-time tolerance | All except age gate and goal are skippable; editable later |
| Accounts | Email + password, magic link, password reset | Social login optional (decision D8) |
| Recommendations | Breakfast / lunch / dinner / snack, ranked from the catalogue by deterministic rules | No LLM |
| Meal detail | Name, image/illustration, description, serving, kcal & macros (estimates + source), prep time, ingredients, steps, ₦ cost range (dated), "why this suits you" | Estimates always labelled |
| Actions on meals | Save, reject ("not for me"), see alternatives, log as eaten (with portion multiplier) | |
| Search & filter | Text search; filter by meal type, cuisine, prep time, budget band, dietary tags, calorie band | |
| Tracking | Weight log (kg/lb), history & trend chart, meal log, daily kcal & macro totals vs target | Edit/delete all entries |
| Targets | Mifflin-St Jeor-based estimate with conservative safety rules | Transparent "how we calculated this" |
| Meal planning | Daily/weekly plan, replace meal, adjust servings | Phase 5 |
| Shopping list | Aggregated ingredients, checklist, "already have", ₦ estimate | Phase 5 |
| Privacy | Data export, account deletion | Phase 6 must verify |

## 4. Exclusions (not in MVP)

AI meal assistant/chat, recipe import, grocery integrations, pantry tracking, household plans, dietitian portal, push notifications/reminders, premium subscriptions & payments, native iOS/Android store apps, barcode scanning, social features, multi-language UI (English only for MVP; architecture keeps strings externalisable).

## 5. Functional requirements (summary)

- FR-1 A user can complete onboarding in under 2 minutes, skipping optional questions.
- FR-2 Recommendations only come from catalogue records; never invented meals.
- FR-3 Meals containing a user's declared allergen/exclusion are never recommended **when the allergen data for that meal is known**. Meals with unknown allergen data are flagged, not silently shown as safe.
- FR-4 Every nutrition number shows it is an estimate and links to its serving assumption and source.
- FR-5 Every ₦ cost shows a range and the date/source of the price estimate.
- FR-6 Daily totals are computed from logged meals × portion multiplier × catalogue values.
- FR-7 Weight entries support kg and lb; stored canonically in kg.
- FR-8 Calorie targets never fall below safety floors and never imply faster than ~1% bodyweight/week change (see ARCHITECTURE §7).
- FR-9 Users can only read/write their own data (enforced in the database, not just the UI).
- FR-10 Users can export and delete their data.

## 6. Non-functional requirements

- Mobile-first; usable at 360 px width; good on desktop.
- Usable on mid-range Android phones over slow 3G/4G: initial page JS budget target ≤ 200 KB gzipped; images lazy-loaded and compressed.
- Accessibility: WCAG 2.2 AA target (contrast, labels, keyboard, focus).
- Installable PWA (home-screen icon, offline shell for viewing saved meals — offline writes are out of MVP).
- Tone: supportive, non-judgemental. No "bad food", "cheat", "guilt" language; no red "over budget" shaming.

## 7. Success measures for the MVP (to validate with testers)

- Tester can go from sign-up to a relevant lunch suggestion in < 3 minutes.
- ≥ 70% of shown recommendations rated "relevant" in your manual test.
- Zero allergen-exclusion leaks in automated tests.
- Daily totals match hand-calculated values in test cases exactly.

## 8. User journeys

**J1 — First-time user**: Welcome → "Get started" → goal (lose/gain/maintain) → basics (age gate, height, weight, units) → activity → food preferences & exclusions (skippable) → budget & prep time (skippable) → summary of estimated daily target with "how we calculated this" → Home.

**J2 — "What can I eat next?"**: Home shows next meal slot based on time of day (e.g., Lunch) with top 3 suggestions → tap a card → Meal detail → "I ate this" (portion ½/1/1½/2) or "Save" or "Show alternatives".

**J3 — Not interested**: On a suggestion → "Not for me" → optional reason (don't like / too expensive / too long to make / allergy) → card replaced; reason tunes future ranking.

**J4 — Find something specific**: Search "beans" → filter "under 30 min", "≤ ₦1,500" → results → detail.

**J5 — Log weight**: Progress tab → "Add weight" → value + date → chart updates; edit/delete via list.

**J6 — Review my day**: Today view → logged meals, estimated kcal & macros vs target, gentle copy ("You've logged 2 meals today").

**J7 — Plan the week** (Phase 5): Plan tab → "Generate week" → swap any meal → adjust servings → "Shopping list" → tick "already have" → ₦ estimate.

**J8 — Manage my data**: Settings → edit profile/units → export data → delete account (with confirmation).

## 9. UI screen inventory

| # | Screen | Phase built (UI / real data) |
|---|---|---|
| S1 | Welcome / intro | 1 / – |
| S2 | Sign up / sign in / reset password | 1 (shell) / 2 |
| S3 | Onboarding steps (goal, basics, activity, preferences, budget, summary) | 1 / 2 |
| S4 | Home ("What can I eat next?") | 1 / 3 |
| S5 | Meal-slot recommendations (breakfast/lunch/dinner/snack tabs) | 1 / 3 |
| S6 | Meal detail (incl. "how estimated" sheet) | 1 / 3 |
| S7 | Search & filters | 1 / 3 |
| S8 | Saved meals | 1 / 3 |
| S9 | Log meal sheet (portion picker) | 1 / 4 |
| S10 | Today (daily intake summary) | 1 / 4 |
| S11 | Progress (weight chart + entries) | 1 / 4 |
| S12 | Profile & preferences | 1 / 2 |
| S13 | Settings (units, data export, delete account, about/disclaimer) | 1 / 2 & 6 |
| S14 | Meal plan (day/week) | – / 5 |
| S15 | Shopping list | – / 5 |
| S16 | Empty, loading, error, offline states (shared components) | 1 |

Primary navigation (bottom tab bar on mobile, side rail on desktop): **Home · Search · Progress · Saved · Profile** (Plan added in Phase 5).
