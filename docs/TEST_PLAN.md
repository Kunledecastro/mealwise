# Mealwise — Testing Strategy

Status: DRAFT. No tests exist yet (no code yet).

## Layers

| Layer | Tool | What it covers | From phase |
|---|---|---|---|
| Unit | Vitest | Pure domain logic: unit conversion, Mifflin-St Jeor & safety rules, recommendation filtering/scoring, nutrition roll-ups, shopping-list aggregation, validation schemas | 1 (validators), 3–5 heavily |
| Component | Vitest + Testing Library | Forms, meal card states, empty/error states | 1 |
| Database / RLS | SQL tests against local Supabase (Docker), two synthetic users | Owner-only access on every user table; catalogue read-only; cascade delete | 2 |
| End-to-end | Playwright, Chromium mobile (375×812) + desktop (1280×800) | User journeys J1–J8 | 1 (navigation), grows each phase |
| Accessibility | axe-core in Playwright + Lighthouse | WCAG 2.2 AA checks | 1, full audit in 6 |
| Performance | Lighthouse (mobile, throttled) | Bundle size, LCP on slow 4G | 1 baseline, 6 audit |
| Manual | Checklist per phase for you | Real-phone usability, tone, relevance | Every phase |

## Rules
- A test is reported "passed" only if it was actually run; results are pasted into the phase report.
- Test data is synthetic only (e.g., `tester.a@example.test`); no real health data.
- Every bug fix gets a regression test where practical.
- CI (GitHub Actions, free tier) runs lint, typecheck, unit and e2e on each push once the repo exists.

## Manual test format
Test ID · Feature · Steps · Expected · Actual · Pass/Fail · Issue — delivered at the end of each phase.

## Latest results
None yet — Phase 0 produced documents only.
