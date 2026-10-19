# Mealwise — Project Status

**Current phase:** Phase 5 — Planning and shopping
**Last completed phase:** Phase 4 (approved 2026-10-19)
**Implementation status:** Phase 5 **complete and tested. Awaiting your approval.**
**Last updated:** 2026-10-19

## Completed
- Phases 0–4 (approved).
- Phase 5:
  - **Plan tab** in the navigation.
  - **Meal plans** for today, 3 days or a week, snacks optional. Every allergy, diet, dislike and "Not for me" rule applies. Meals vary across the week, and each day is fitted to your daily target.
  - **Swap** any meal from a list of suitable ones; **"Cooking for"** ½ to 8 servings; **"I ate this"** logs today's planned meals.
  - **Shopping list**:
    - added up across the plan and servings;
    - shown in buying units (kg, bunch, crate…), grouped like a market trip;
    - "Have it" and bought ticks saved to your account;
    - ₦ estimate for what's still to buy, with unpriced items listed;
    - share as text to WhatsApp or notes.
  - Optional extras that contain your allergens are left off the list.
  - **Lighter Supabase code** (approved): about 32 KB less on every app screen.
  - Data download now includes your plan.

## Incomplete / carried forward
- **M4-12** removal checks (one paste in the Supabase SQL editor), still to do.
- Cooking prices: about half of a week's shopping items are unpriced (I13, I21).
- App screens 224–261 KB of code vs 200 KB budget (I11), for Phase 6.

## Known defects / limitations
No open defects. Open issues (BUGS_AND_ISSUES.md): I7, I11, I12, I13, I14, I16, I18, I19, I20, I21.

## Latest test results (2026-10-19)
- Type check, lint, build: pass.
- Unit 144/144; end-to-end 176/176 (phone + desktop, fresh build); database 20/20 (plans).
- Lighthouse: `/` performance 90, accessibility 100; `/sign-in` 94 / 100.

## Decisions requiring your input
| ID | Decision | Recommendation |
|---|---|---|
| I20 | Avoid two similar staples on one day (e.g. two eba soups) | Try the plans first; add the rule if it bothers you |
| 047 / I13 | +15% NBS markup; six missing everyday prices | Keep +15%, or give a figure; add prices to docs/PRICE_SHEET.csv |
| 030 | Email for outside testers | Decide before inviting others |
| 035 | FAO licence | Fine for the free test; request a licence before any paid launch |

## Where things live
- Code: GitHub `Kunledecastro/mealwise` (`main`).
- Catalogue: `catalogue/`. Account screens: `app/(account)/`.
- Test link: https://mealwise-flame.vercel.app (Vercel login).
- Database: Supabase `mealwise-dev`.

## Exact next step
Sign in on the test link first (M5-12, the first real check of the lighter Supabase code), run M4-12, try M5-01 to M5-11, then reply **"Phase 5 approved"** or list changes. Phase 6 (QA, security, privacy review, release readiness) starts only after approval.
