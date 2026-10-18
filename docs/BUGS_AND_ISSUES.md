# Mealwise — Bugs, Issues and Risk Register

## Open defects
None.

## Fixed in Phase 1
P1-01 to P1-06 — see TEST_PLAN.md "Defects found and fixed during Phase 1 testing".

## Fixed in Phase 2
P2-01 to P2-03 — see TEST_PLAN.md "Defects found and fixed during Phase 2 testing".

## Known limitations (Phase 1, by design)
| ID | Limitation | Resolved in |
|---|---|---|
| L1 | ~~Nothing persists~~ Account, setup answers and preferences now save (Phase 2). Meals logged, saved meals, "not for me" and weights still reset on reload | Phases 3–4 |
| L2 | All meals, nutrition figures, prices, weights and the daily target are placeholders, labelled "Sample" | Phases 3–4 |
| L3 | Suggestions are simple filters (meal time, allergies, dislikes, diet), not the ranked engine | Phase 3 |
| L4 | ~~Sign-in/up/reset forms don't create accounts~~ | **Done in Phase 2** |
| L5 | ~~Data export and account deletion disabled~~ Working; export covers account + profile (all we store so far) | **Done in Phase 2**; export grows with each phase |
| L6 | `?demo=` preview links and "Prototype tools" are prototype-only and must be removed before release | Phase 6 |

## Open issues
| ID | Issue | Impact | Plan |
|---|---|---|---|
| I1 | ~~Preview deployment blocked by invalid GitHub token~~ | — | **Resolved 2026-10-17**: you created the repo; code pushed; Vercel project deployed behind login |
| I2 | Lighthouse mobile shows 240–510 ms total blocking time on throttled CPU (mostly React start-up); landing LCP ~3 s on throttled 4G | Minor; scores 83–92 | Re-measure in Phase 6 performance audit; consider lighter hydration once real data is server-rendered |
| I3 | 5 "high" npm audit findings in dev-only lint tooling (`braces` via `fast-glob` in `eslint-config-next`); 0 in production dependencies | None at runtime | Re-check on next Next.js upgrade |
| I5 | 7 sample dishes have no real photo yet (moi moi, amala, pepper soup, plantain frittata, beans porridge, jollof spaghetti, oats, groundnuts) — shown as illustrations | Visual only | Product owner supplies photos, or Phase 3 sources them |
| I6 | Photos are loaded from Pexels/Unsplash servers via Vercel; if a photographer deletes a photo it would disappear | Low | Before launch, copy final photos into our own storage (Supabase Storage, Phase 2+) |
| I7 | An unknown meal address (e.g. `/meals/not-a-real-meal`) shows the correct "We couldn't find that page" screen, marked `noindex`, but the HTTP status is 200 instead of 404. Next.js 16 starts streaming the page before the lookup runs | None for users (app pages are behind sign-in, so not indexed) | Revisit in Phase 3 when meals come from the database (check in the proxy, or prerender known slugs) |
| I8 | Supabase's built-in email sender only reaches members of the Supabase organisation and is rate-limited | Outside testers can't sign up yet | Decision 030: custom email sender before wider testing |
| I9 | Email links (confirm, reset, sign-in link) and the delete-account function could not be exercised end-to-end from this workspace (no network route to supabase.co) | Covered by stand-in tests + database tests; real path needs your manual test M2-01..M2-10 | Product owner manual tests |
| I10 | Signing out uses "this device" scope; other devices stay signed in until their session expires | Low | Add "sign out everywhere" in Phase 6 hardening |
| I4 | Playwright pinned to 1.56.1 to match the workspace's pre-installed Chromium | None for the product | Unpin when the workspace allows browser downloads |

## Risk register (from Phase 0)

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Nigerian dish nutrition is inaccurate (oil, yield, recipe variation) | High | High | Compute from ingredients with explicit assumptions; label estimates; source every ingredient; optional dietitian review | Claude + you |
| R2 | Nutrition dataset licence may restrict commercial use (FAO/INFOODS WAFCT appears non-commercial — verify) | Medium | High | Confirm licence before Phase 3; fall back to USDA FDC + documented estimates | You (D4) |
| R3 | Allergen data incomplete → unsafe recommendation | Medium | High | Allergen status per ingredient; unknown = excluded for allergic users; leak tests; disclaimer | Claude |
| R4 | Food prices go stale fast | High | Medium | Dated ranges, staleness flag after 90 days | You (D5) |
| R5 | Weight targets for minors, pregnancy, medical conditions, eating-disorder risk | Medium | High | Age gate 18+ (built in Phase 1 onboarding); safety floors; professional-guidance flag | Claude |
| R6 | Cross-user data exposure | Low | High | RLS everywhere, automated RLS tests | Claude |
| R7 | Nigeria Data Protection Act 2023; EU hosting region | Medium | High | Minimisation, consent, export/delete; assessment before public launch; no compliance claims | You |
| R8 | Free-tier limits (Supabase pausing; Vercel Hobby non-commercial) | High | Medium | Fine for dev/testing; upgrade before commercial launch | You |
| R9 | Food image rights and accuracy | Low | Medium | Only Pexels/Unsplash photos (free commercial licences), credited; matched to dishes from the source descriptions; product owner to confirm each looks right. Phase 3 catalogue to use own or commissioned photos where possible | Claude + you |
| R10 | Slow networks / low-end devices | Medium | Medium | Static pre-rendering, bundled fonts, JS budget (186/200 KB) | Claude |
| R11 | Catalogue curation effort underestimated | High | Medium | 60–80 meals first; batch review | Both |
| R12 | Scope creep | Medium | Medium | Phase gates | You |
