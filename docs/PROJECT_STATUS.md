# Mealwise — Project Status

**Current phase:** Phase 0 — Discovery & Technical Plan
**Last completed phase:** none (Phase 0 deliverables drafted; approval pending)
**Implementation status:** Documents only. No code, repo, database or deployment created.

## Completed
- Environment inspection (empty workspace; Node 22, pnpm, Docker, psql available; Supabase org has a free active-project slot; Vercel personal team present)
- PRD, MVP scope/exclusions, user journeys, screen inventory → PRODUCT_REQUIREMENTS.md
- Architecture & stack proposal → ARCHITECTURE.md
- Database model → DATABASE_SCHEMA.md
- Phase plan & acceptance criteria → IMPLEMENTATION_PLAN.md
- Testing strategy → TEST_PLAN.md
- Risk register → BUGS_AND_ISSUES.md

## Incomplete
All product features (Phases 1–6).

## Known defects
None (no code).

## Latest test results
None — no tests applicable in Phase 0.

## Estimated running costs (approximate, USD; verify current pricing before any purchase)

| Stage | Items | Monthly |
|---|---|---|
| Development & your testing (Phases 1–5) | Vercel Hobby, Supabase Free, GitHub Free, GitHub Actions free minutes | **$0** |
| Private beta (small tester group) | Same, accepting that free Supabase pauses after inactivity and Vercel Hobby is non-commercial | $0 |
| Public / commercial launch | Supabase Pro (~$25, no pausing, daily backups) + Vercel Pro (~$20 per member) + transactional email provider (free tier likely sufficient at first) + domain (~$10–15/yr) | **≈ $45–50/month** + domain |
| Optional | Store apps later (Apple $99/yr, Google $25 once); dietitian review of catalogue (one-off, quote needed) | — |

No paid service will be introduced without your approval.

## Decisions requiring your input

| ID | Decision | My recommendation | Needed before |
|---|---|---|---|
| D1 | PWA vs native app | Installable PWA | Phase 1 |
| D2 | ~~Accept $0 during development~~ **DECIDED 2026-10-17:** use the same free Supabase org and Vercel Hobby team as Educore. Launch-time upgrade (≈ $45–50/month) to be revisited in Phase 6 | — | Done |
| D3 | Separate free Supabase project "mealwise-dev" in the same org (uses the 2nd free active slot alongside educore-greenfield) **or** share the educore-greenfield database | Separate project | Phase 2 |
| D4 | Nutrition data sources: confirm WAFCT licence suitability; use USDA FDC as public-domain base | Use both, with licence check; I draft, you (ideally a dietitian) review | Phase 3 |
| D5 | Who maintains ₦ price ranges, and how often | You or a helper, quarterly; I build the update template | Phase 3 |
| D6 | Meal images: illustrations, own photos, or licensed stock | Simple illustrations in MVP; real photos later | Phase 3 |
| D7 | Minimum age 18 and safety rules in ARCHITECTURE §7 | Approve as written | Phase 2 |
| D8 | Sign-in methods: email+password and magic link; add Google sign-in? | Email + magic link now; Google later | Phase 2 |
| D9 | Brand: name "Mealwise" final? any colours/logo? | I propose a warm, food-friendly palette if none | Phase 1 |
| D10 | Create a private GitHub repo + Vercel project for preview builds you can open on your phone | Yes | Phase 1 (end) |

## Exact next step
Product owner reviews these documents and replies with approvals/changes, e.g. **"Phase 0 approved"** (accepting recommendations) or specific changes. On approval, Phase 1 (UI prototype with labelled sample data) begins.
