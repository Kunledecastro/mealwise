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
| 012 | 2026-10-17 | Phase 0 approved: all recommendations accepted (PWA; Next.js + Supabase + Vercel; separate free Supabase project in Phase 2; proposed brand; GitHub repo + Vercel preview) | **Approved** | Product owner: "phase 0 approved" — also closes 002, 003, 005–009 and 011 as approved |
| 013 | 2026-10-17 | Brand: ugu green #1E5B3C, plantain #F4B53F, Bricolage Grotesque + Figtree; meals shown as generated plate illustrations instead of photos | Approved via 012; open to change in Phase 1 review | Distinctive, food-led, no image licensing (lowers R9) |
| 014 | 2026-10-17 | Next.js 16.4.2 with its defaults (Turbopack, Cache Components). Fonts bundled from npm rather than fetched from Google at runtime | Implemented | Current stable; works offline-first and on restricted networks |
| 015 | 2026-10-17 | Prototype state kept in browser memory only, with a banner on every screen saying nothing is saved | Implemented | Brief forbids pretending persistence works |
| 016 | 2026-10-17 | Exact dependency versions pinned in package.json | Implemented | Reproducible builds, including on Vercel |
| 017 | 2026-10-17 | Preview via GitHub-linked Vercel project (repo `Kunledecastro/mealwise`) rather than hand-uploaded files | **Implemented** | Automatic deploys each phase |
| 018 | 2026-10-17 | Vercel Authentication on **all** deployments, including the production address, Node 22 | **Implemented** | Vercel treats `main` as production, whose address would otherwise be public; brief forbids public deployment without approval. Verified: anonymous visit redirects to Vercel login |
