# Mealwise — Phased Implementation Plan

Status: APPROVED 2026-10-17. Phase 1 approved 2026-10-18. Phase 2 approved 2026-10-18. Phase 3 approved 2026-10-19. Phase 4 complete, awaiting approval.
Rule: one phase at a time; each ends with automated tests, a manual test checklist, a completion report, and a stop for your decision.

| Phase | Name | Main outputs | Rough effort* |
|---|---|---|---|
| 0 | Discovery & plan | These docs | **Approved 2026-10-17** |
| 1 | UI & navigation prototype (**approved 2026-10-18**) | Next.js app, design system, all MVP screens with **labelled sample data**, onboarding flow (local state only), responsive layouts, loading/empty/error states, PWA manifest, Vercel preview URL | 2–3 sessions |
| 2 | Auth & profiles (**approved 2026-10-18**) | Supabase dev project, migrations for profile/preference tables + RLS, sign-up/in/out, magic link, reset, onboarding persisted, profile edit, RLS tests. Also delivered early: data download and account deletion | 2 sessions |
| 3 | Catalogue & recommendations (**approved 2026-10-19**; added: cook it or buy it) | Catalogue schema, 60–80 seeded meals with provenance, nutrition/cost views, deterministic engine, search/filter, save/reject/alternatives wired to real data | 3–4 sessions (content curation is the long pole) |
| 4 | Targets & tracking (**complete, awaiting approval**; added: portion guide, weight trend caution) | Target calculator + safety rules, weight log/chart, meal logging, daily totals, unit conversion | 2 sessions |
| 5 | Planning & shopping | Day/week plans, swap, servings, shopping list aggregation, checklist, ₦ estimate | 2 sessions |
| 6 | QA, security, release | Full regression, accessibility & performance audit, RLS/permission review, data export/delete verification, backups, privacy review (NDPA), deployment guide, production readiness recommendation | 2 sessions |

*"Session" = one working block with me; your testing time is separate.

## Phase 1 detail (next, if approved)

1. Scaffold Next.js + TypeScript + Tailwind + ESLint/Prettier + Vitest + Playwright; git init.
2. Design tokens (colours, type scale, spacing, radius) and core components: Button, Card, MealCard, Input, Select, Chip, Tabs, BottomNav, Sheet, EmptyState, ErrorState, Skeleton, SampleDataBadge.
3. Screens S1–S13 + S16 per PRODUCT_REQUIREMENTS §9, using a typed sample-data file clearly marked `SAMPLE`; banner "Prototype — sample data" on every data screen.
4. Auth screens are visual only and say "Sign-in not active in this prototype".
5. Onboarding stores answers in memory only (lost on refresh — stated in UI).
6. PWA manifest + icons.
7. Playwright smoke tests: every route renders at 375 px and 1280 px, nav works, no console errors.
8. Deploy a Vercel **preview** (not public production) once you approve the GitHub repo + Vercel project creation.

## Dependencies on your decisions
See PROJECT_STATUS → "Decisions requiring your input". Phase 1 needs only D1 (PWA), D9 (brand) and D10 (repo/hosting for preview). Supabase decisions (D3) are needed before Phase 2; catalogue/licensing decisions (D4–D6) before Phase 3.

## Proposed acceptance criteria per phase
As specified in the master prompt §6, plus these additions:
- Phase 1: Lighthouse mobile accessibility ≥ 90; every sample-data screen shows the sample badge.
- Phase 2: RLS tests prove user B cannot read/update/delete user A's rows on every user table.
- Phase 3: Engine unit tests include allergen leak tests with unknown-allergen meals; every published meal has 100% ingredient source coverage or is shown as "incomplete".
- Phase 4: Calorie target tests include safety-floor and under-18/BMI-guard cases; kg↔lb round-trip within 0.01.
- Phase 5: Aggregation tests include incompatible units (kept as separate lines, not wrongly summed).
- Phase 6: No open critical/high defects; documented backup restore tested once.
