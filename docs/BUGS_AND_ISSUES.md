# Mealwise — Bugs, Issues and Risk Register

## Open defects
None.

## Fixed in Phase 1
P1-01 to P1-06 — see TEST_PLAN.md "Defects found and fixed during Phase 1 testing".

## Fixed in Phase 2
P2-01 to P2-03 — see TEST_PLAN.md "Defects found and fixed during Phase 2 testing".

## Fixed in Phase 3
P3-01 — see TEST_PLAN.md "Defects found and fixed during Phase 3 testing".

## Known limitations (Phase 1, by design)
| ID | Limitation | Resolved in |
|---|---|---|
| L1 | ~~Nothing persists~~ Account, setup answers and preferences now save (Phase 2). Meals logged, saved meals, "not for me" and weights still reset on reload | Phases 3–4 |
| L2 | ~~Meals and nutrition are placeholders~~ Real catalogue (estimates) since Phase 3. Weights, meal log and daily target still sample, labelled | Phase 4 |
| L3 | ~~Suggestions are simple filters~~ Ranked engine since Phase 3 | **Done in Phase 3** |
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
| I11 | JavaScript per page is ~259 KB compressed vs 200 KB budget: Supabase sign-in library (~71 KB, since Phase 2) and the catalogue (~33 KB) load on every page, including the public landing page. Lighthouse still 86–93 | Slower first load on low-end phones | Load account code only on account screens and pass landing meals from the server; target Phase 4 start, verify in Phase 6 |
| I12 | Supabase "leaked password protection" (check against breached-password lists) is off | Weak/breached passwords accepted (8-character minimum still enforced) | Appears to need a paid Supabase plan; decide before public launch |
| I13 | No ₦ prices yet: NBS reports are on microdata.nigerianstat.gov.ng, which the workspace still can't reach. Every meal shows "Price not yet estimated"; budget preference scores neutral | Budget filter and price display not useful yet | Add that domain (Settings → Capabilities), or fill docs/PRICE_SHEET.csv yourself |
| I14 | A few source values look high and need your sense-check: fresh maize 178 kcal and 16 g fibre per 100 g (roasted corn 420 kcal with coconut); bambara flour fibre 29 g per 100 g (okpa); peeled beans fibre 13 g per 100 g. They are the published FAO figures | Possible over-estimate for 3–4 meals | Product owner / dietitian review; can switch to another FAO entry if agreed |
| I15 | Many Nigerian lunch/dinner portions are 750–955 kcal (afang soup and ofe onugbu from the eCookbook are the largest); with a "lose" goal they rank lower but are still shown | By design, but users may want smaller portions | Phase 4: portion scaling against the personal target |
| I16 | Ready-made prices are one generic buka range from a secondary source (Lagos.Cool), not per dish; 32 meals have none | "Buy it" is a rough guide | Product owner refines per dish and area in docs/READY_MADE_PRICE_SHEET.csv |
| I17 | Ingredient price references found but not loaded: Lagos State Ministry of Agriculture tracker via Lagos.Cool (31 Jul 2026: tomatoes ₦2,000/kg, onions ₦1,000/kg, eggs ₦5,500/crate, medium yam ₦2,800, long-grain rice ₦60,000/50 kg) and Nairametrics September 2026 Lagos market survey (wholesale bags). Converting wholesale to retail needs assumptions | Cooking cost still "not yet estimated" | Use these as starting points when filling docs/PRICE_SHEET.csv |
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
