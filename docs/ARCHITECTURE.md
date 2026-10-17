# Mealwise — Architecture Proposal (Phase 0 draft)

Status: DRAFT — awaiting approval. Nothing below has been provisioned.
Last updated: 2026-10-17

## 1. Environment findings (inspected 2026-10-17)

- Working directory is empty — no existing code, repo, dependencies or config. Greenfield.
- Tooling available: Node 22.22, npm 10.9, pnpm, git, Docker, psql, Python 3.13.
- Connected accounts (read-only check, nothing created):
  - **Supabase**: one organisation with 4 projects; only 1 is active (`educore-greenfield`), 3 are paused. The free plan allows 2 active projects per organisation, so a free "mealwise" project would fit.
  - **Vercel**: personal team "Adekunle Oludele's projects" (Hobby plan assumed).
- No GitHub repository exists yet for Mealwise.

## 2. Platform decision: installable PWA vs native app

| Option | Pros | Cons |
|---|---|---|
| **Responsive web app + installable PWA (recommended)** | One codebase; instant updates; no app-store fees/review; works on any phone with a browser; fastest path to tester feedback | No App Store/Play Store presence initially; limited iOS push notifications (not needed in MVP) |
| Cross-platform native (Expo/React Native) | Store presence; native feel; better offline/notifications | Store accounts ($99/yr Apple, $25 one-off Google), review cycles, slower iteration, still need a web admin later |
| Both | Maximum reach | Roughly doubles UI work; rejected for MVP |

Recommendation: PWA now. If traction warrants store presence later, the backend (Supabase) and domain logic (TypeScript packages) are reusable from an Expo app, or the PWA can be wrapped (e.g., Trusted Web Activity for Play Store).

## 3. Recommended stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | One language front-to-back; type safety for nutrition maths |
| Framework | Next.js (App Router), React | Mature, server rendering for fast first load on slow networks, first-class on Vercel |
| Styling/UI | Tailwind CSS + a small in-house component set (shadcn/ui-style, copied in, not a dependency lock-in) | Consistent design system, small bundle |
| Database | Supabase Postgres | Managed Postgres, generous free tier, SQL migrations |
| Auth | Supabase Auth (email+password, magic link; optional Google) | Built-in, integrates with Row Level Security |
| Access control | Postgres **Row Level Security** on every user table | Security enforced in the database, not only in app code |
| Validation | Zod schemas shared by forms and server actions | Same rules client- and server-side |
| Charts | Recharts (or lightweight alternative if bundle too big) | Weight trend chart |
| Hosting | Vercel | Zero-config Next.js deploys, preview URL per change for your testing |
| Images | Supabase Storage (+ Next.js image optimisation) | Same platform; compressed WebP |
| Testing | Vitest (unit), Playwright (end-to-end, mobile + desktop viewports), pgTAP/SQL tests for RLS via local Supabase (Docker) | See TEST_PLAN |
| Source control | Git + GitHub (private repo) | Needed for Vercel preview deployments |

Alternatives considered: Firebase (NoSQL makes nutrition aggregation and RLS-style rules clumsier); self-hosted Postgres + Auth.js (more ops work); Remix/SvelteKit (fine, but smaller ecosystem for this use).

## 4. High-level architecture

```
Phone/desktop browser (PWA)
   │  HTTPS
   ▼
Next.js on Vercel ── server components / server actions
   │   • reads catalogue, runs recommendation & nutrition logic (pure TS modules)
   │   • uses the signed-in user's session (no service key in the browser)
   ▼
Supabase
   • Postgres (catalogue + user data, RLS)
   • Auth (sessions, password reset emails)
   • Storage (meal images)
```

Code organisation (monorepo-light, single Next.js app):

```
mealwise/
  app/                 routes & screens
  components/          design-system + feature components
  lib/domain/          PURE logic: recommendation engine, nutrition calc, unit conversion,
                       shopping-list aggregation (no I/O → easy to unit test, reusable later)
  lib/data/            database access functions
  supabase/migrations/ SQL schema + RLS policies (versioned)
  supabase/seed/       catalogue seed data with provenance
  tests/unit | tests/e2e | supabase/tests
  docs/
```

## 5. Recommendation engine (Phase 3) — deterministic

1. **Hard filters** (meal excluded if any fail): meal type matches slot; no declared allergen/excluded ingredient (where allergen data known); dietary rule match (e.g., vegetarian); not in user's "not for me" list.
2. **Unknown-data handling**: meals with unknown allergen status are excluded for users who declared allergies, unless the user opts to "show meals with incomplete allergen info" (shown with a warning).
3. **Scoring** (weighted sum, weights documented and unit-tested): closeness of meal kcal to the slot's share of daily target; budget fit; prep-time fit; liked ingredients/cuisines (+); disliked (−); variety penalty for meals eaten in last N days; saved meals (+ small).
4. **Output**: top N with human-readable reasons derived from the scoring factors ("Under your ₦1,500 budget", "Ready in 20 min", "High in protein for your gain goal").
5. "Refresh"/"alternatives" = next-ranked items, deterministic per day with a seeded tie-break so tests are reproducible.

An LLM is not used. A later AI assistant would be proposed separately with cost, privacy and failure-mode analysis.

## 6. Nutrition data and provenance

- Each ingredient stores per-100 g values with a `source` (e.g., FAO/INFOODS West African Food Composition Table 2019, USDA FoodData Central) and source reference ID.
- Meal nutrition is **computed** from ingredient grams per serving, not typed in by hand — so it is traceable.
- Cooked vs raw, yield and oil absorption are major error sources for Nigerian dishes (stews, fried items); recipes record assumptions explicitly, and the UI labels values "estimated".
- Prices: there is no reliable live API for Nigerian retail food prices. Ingredient prices are stored as dated **ranges** with a source (e.g., NBS Selected Food Prices Watch, manual market survey). The UI shows "≈ ₦1,200–1,600 · prices as of <month year>". Stale prices (> 90 days) are flagged.

## 7. Nutrition target calculation (Phase 4)

- BMR: **Mifflin-St Jeor** equation (widely used, documented). If the user declines to give sex, use the midpoint of the two equations and say so.
- TDEE = BMR × activity factor (1.2 / 1.375 / 1.55 / 1.725).
- Goal adjustment, conservative: lose ≈ −300 to −500 kcal/day; gain ≈ +250 to +400 kcal/day; maintain 0.
- Safety rules: never target below 1,500 kcal (male) / 1,200 kcal (female or unspecified); cap implied rate at ~0.5–1% bodyweight/week; no targets for under-18s, BMI < 18.5 with a "lose" goal (blocked with supportive message), or users who flag pregnancy/medical condition — those see general guidance and a professional-referral note.
- Macros: protein ~1.2–1.6 g/kg (higher for gain), fat 25–35% kcal, carbs remainder — presented as a guide, not a prescription.
- All of this is shown in a "How we calculated this" sheet. Formulas live in `lib/domain/nutrition.ts` with unit tests.

## 8. Security and privacy design

- Body measurements, food logs and weight history treated as sensitive personal data.
- RLS: every user-owned row has `user_id`; policies `user_id = auth.uid()` for select/insert/update/delete. Catalogue tables are read-only to clients.
- Service-role key only in server environment variables; never shipped to the browser; never committed. `.env.local` git-ignored; `.env.example` documents names only.
- Data minimisation: year of birth (not full DOB); sex optional; budget as band.
- Account deletion cascades to all user rows; export as JSON.
- Region: Supabase has no African region; propose **eu-west-2 (London)**. This is a cross-border transfer of personal data from Nigeria; the Nigeria Data Protection Act 2023 has rules for this and for sensitive (health-related) data. **Mealwise will not claim NDPA compliance** until a proper assessment is done (Phase 6 / before public launch).
- Security headers (CSP, HSTS), rate limiting on auth (Supabase built-in), dependency audit in CI.

## 9. Environments and deployment

- **Local**: Next.js dev server + local Supabase via Docker (Supabase CLI) with synthetic seed data.
- **Preview**: Vercel preview deployment per branch, pointing to a Supabase "dev" project — used for your phase testing on your phone.
- **Production**: created only in Phase 6 with your explicit approval.

## 10. Extensibility hooks (not built now)

- `lib/domain` is framework-free → reusable for a future Expo app or AI assistant tool calls.
- Catalogue has `region`/`cuisine` and currency fields → international expansion.
- `households`, `pantry_items`, `subscriptions` can be added as new tables without changing existing ones.
