# Mealwise — Bugs, Issues and Risk Register

## Defects
None — no code exists yet.

## Risk register (Phase 0)

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Nigerian dish nutrition is inaccurate (oil, yield, regional recipe variation) | High | High | Compute from ingredients with explicit assumptions; label as estimates; source every ingredient; optional dietitian review before launch | Claude + you |
| R2 | Nutrition dataset licence restricts commercial use (FAO/INFOODS WAFCT appears to be published under a non-commercial CC licence — must verify) | Medium | High | Confirm licence before Phase 3; fall back to USDA FoodData Central (public domain) + own documented estimates for local items; or seek permission | You (decision D4) |
| R3 | Allergen data incomplete → unsafe recommendation | Medium | High | Allergen status per ingredient; unknown = excluded for allergic users by default; leak tests; disclaimer | Claude |
| R4 | Food prices go stale fast (inflation) | High | Medium | Dated ranges, staleness flag after 90 days, clear "estimate" labelling; no exact prices | You (D5) |
| R5 | Users with eating-disorder risk, minors, pregnancy, medical conditions given weight targets | Medium | High | Age gate 18+; safety floors; BMI guard; professional-guidance flag disables targets; no shaming copy | Claude |
| R6 | Sensitive data exposure (cross-user access) | Low | High | RLS everywhere, automated RLS tests, no service key client-side | Claude |
| R7 | Data protection obligations (Nigeria Data Protection Act 2023; cross-border hosting in EU region) | Medium | High | Data minimisation, consent capture, export/delete; formal assessment before public launch; no compliance claims until then | You |
| R8 | Free-tier limits: Supabase free projects pause after ~1 week of inactivity; Vercel Hobby is for non-commercial use | High | Medium | Fine for dev/testing; budget upgrade before public/commercial launch (see cost estimate) | You (D2) |
| R9 | Food image rights | Medium | Medium | Illustrations/own photos/licensed stock with credit stored per image | You (D6) |
| R10 | Slow networks / low-end devices in target market | Medium | Medium | Server rendering, JS budget, compressed images, Lighthouse checks | Claude |
| R11 | Catalogue curation effort underestimated | High | Medium | Start with 60–80 high-frequency meals; content template; you review in batches | Both |
| R12 | Scope creep into AI/subscriptions before core works | Medium | Medium | Phase gates; exclusions list | You |
