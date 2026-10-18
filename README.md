# Mealwise

Meal recommendations and weight tracking, Nigeria-first. Built in approval-gated phases — see `docs/PROJECT_STATUS.md` for where things stand.

**Current state: Phase 2.** Real accounts (Supabase): sign up, confirm by email, sign in, reset password, and your setup answers and preferences are saved. Meals, logs and weights are still clearly labelled sample data; the real catalogue and targets arrive in Phases 3–4.

## Test link

https://mealwise-flame.vercel.app (sign in with your Vercel account). It updates automatically about a minute after each push to `main`.

## Run it on your computer

You need Node.js 22 or newer (`node -v` to check). Copy `.env.example` to `.env.local` and fill in the Supabase project URL and **publishable** key (Supabase dashboard → Project Settings → API Keys). Never put the secret or service_role key in this file.

```bash
npm install
npm run build
npm start          # then open http://localhost:3000
```

For development with live reload use `npm run dev` instead of build + start.

To try it on your phone on the same Wi-Fi, run `npm start` and open `http://<your-computer's-IP>:3000` on the phone.

## Checks

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests in Chromium at phone (390 px) and desktop (1280 px) sizes, with axe accessibility checks. Run `npm run build` first. If Playwright's browser isn't installed, run `npx playwright install chromium` once. |

## Project layout

```
app/                 screens (Next.js App Router)
  (auth)/            sign-in, sign-up, reset (visual only in Phase 1)
  (app)/             screens with the main navigation
  onboarding/        six-step setup
components/          design system and shared components (plate-art.tsx = meal illustrations)
lib/domain/          pure logic: unit conversion, meal filtering (unit tested)
lib/sample-data.ts   SAMPLE meals, profile and entries — placeholders, not real data
lib/auth.tsx             signed-in user and saved profile (Supabase)
lib/supabase/            Supabase browser client and settings
lib/prototype-store.tsx  sample meals, logs and weights (in memory until Phases 3–4)
proxy.ts                 sends signed-out visitors to sign-in (convenience; RLS is the real protection)
supabase/migrations/     database tables, security rules and triggers
supabase/functions/      delete-account edge function (holds the only secret key)
supabase/tests/          database access tests (run in the Supabase SQL editor)
tests/unit, tests/e2e
docs/                product, architecture, plan, test and status documents
```

## Prototype tools

Settings → Prototype tools links to loading, empty and error previews of each screen (`?demo=loading|empty|error`) and lets you reset the sample data.
