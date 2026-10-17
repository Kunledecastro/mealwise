# Mealwise — Decision Log

| # | Date | Decision | Status | Rationale |
|---|---|---|---|---|
| 001 | 2026-10-17 | Project starts greenfield (empty workspace) | Fact | Inspection found no existing code |
| 002 | 2026-10-17 | Responsive web app + installable PWA, not native, for MVP | **Proposed** | One codebase, fastest testing loop, no store costs |
| 003 | 2026-10-17 | Next.js + TypeScript + Tailwind; Supabase (Postgres, Auth, Storage, RLS); Vercel hosting | **Proposed** | See ARCHITECTURE §3 |
| 004 | 2026-10-17 | Deterministic, rule-based recommendation engine; no LLM in MVP | Required by brief | Testable, free, explainable |
| 005 | 2026-10-17 | Meal nutrition computed from ingredient data with source per ingredient | **Proposed** | Traceability requirement |
| 006 | 2026-10-17 | Mifflin-St Jeor + conservative safety floors; adults 18+ only for targets | **Proposed** | Documented method; safety |
| 007 | 2026-10-17 | Weights stored canonically in kg; year of birth not full DOB | **Proposed** | Consistency; data minimisation |
| 008 | 2026-10-17 | Supabase region eu-west-2 (London) | **Proposed** | Nearest available region to Nigeria; cross-border implications noted (R7) |
| 009 | 2026-10-17 | Prices as dated ranges, never exact | **Proposed** | Inflation, honesty |
| 010 | 2026-10-17 | Use the same free resources as Educore: existing Supabase organisation (Free plan) and Vercel team "Adekunle Oludele's projects" (Hobby). $0 running cost; no paid upgrades without separate approval | **Approved by product owner** | Keeps development at $0 (answers D2) |
| 011 | 2026-10-17 | Separate Supabase project for Mealwise vs sharing the `educore-greenfield` database | **Open — awaiting product owner** | See PROJECT_STATUS D3 |
