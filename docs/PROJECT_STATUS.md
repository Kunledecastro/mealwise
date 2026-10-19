# Mealwise — Project Status

**Current phase:** Phase 4 — Targets and tracking
**Last completed phase:** Phase 3 (approved 2026-10-19)
**Implementation status:** Phase 4 **complete and tested. Awaiting your approval.**
**Last updated:** 2026-10-19

## Completed
- Phases 0–3 (approved).
- Phase 4:
  - **Personal daily target**: calories, protein, carbs and fat from your profile and latest weight (Mifflin-St Jeor, activity, goal), with safety rules:
    - never below 1,200 kcal (1,500 for men);
    - loss no faster than about 1% of body weight a week;
    - no target for under-18s, for a weight-loss goal when already underweight, or for anyone pregnant, breastfeeding or with a condition affecting diet (a referral message instead).
  - "How we worked this out" shows every step in plain words.
  - **Sex** (optional) and the **pregnancy/medical yes-no** question added to setup and profile. Only the yes/no is stored, never the condition.
  - **Real meal log**: saved to your account; ½, ¾, 1, 1½ or 2 servings; today or yesterday; Today shows totals against your target and can look back 60 days.
  - **Weight history**: saved to your account; edit and delete; kg/lb; weekly trend, with a gentle caution if losing faster than ~1% a week.
  - **Portion guide**: big plates suggest ¾ or ½ a serving for your target, and suggestions rank against your own target.
  - All sample data removed. Data download now includes your meal log and weights.
  - Landing page lighter: 187 KB of code (was 286 KB), inside the 200 KB budget.

## Incomplete / carried forward
- **Removal checks on the real database** (I18): 6 checks you run once in the Supabase SQL editor (manual test M4-12).
- Cooking prices for 56 meals (I13); ready-made price per dish (I16).
- Signed-in screens 257–294 KB of code vs 200 KB budget (I11).

## Known defects / limitations
No open defects. Open issues (BUGS_AND_ISSUES.md): I7, I11, I12, I13, I14, I16, I18, I19.

## Latest test results (2026-10-19)
- Type check, lint, build: pass.
- Unit 123/123; end-to-end 150/150 (phone + desktop, fresh build); database access 23/23 (new tables).
- Lighthouse: `/` performance 90, accessibility 100; `/sign-in` 93 / 100.

## Decisions requiring your input
| ID | Decision | Recommendation |
|---|---|---|
| I11 | Replace the all-in-one Supabase client with its smaller parts (sign-in + database), saving ~25–30 KB on app screens | Approve, or leave until Phase 6 |
| 047 | +15% on NBS prices for Lagos / small quantities | Keep, or tell me a figure from your experience |
| I13 | Six missing everyday prices | Add to docs/PRICE_SHEET.csv or tell me in chat |
| 030 | Email for outside testers | Decide before inviting others |
| 035 | FAO licence | Fine for the free test; request a licence before any paid launch |

## Where things live
- Code: GitHub `Kunledecastro/mealwise` (`main`).
- Catalogue: `catalogue/`. Account screens: `app/(account)/`.
- Test link: https://mealwise-flame.vercel.app (Vercel login).
- Database: Supabase `mealwise-dev`.

## Exact next step
Run manual test M4-12 (one paste in the Supabase SQL editor), try M4-01 to M4-14, then reply **"Phase 4 approved"** or list changes. Phase 5 (day and week plans, shopping list with ₦ estimate) starts only after approval.
