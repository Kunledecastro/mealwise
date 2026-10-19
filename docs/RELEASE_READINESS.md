# Mealwise — Release Readiness Recommendation

Date: 2026-10-19 (end of Phase 6). Author: Claude, for the product owner.

## Recommendation
- **Closed beta with invited testers: GO, after four short steps** (below). The app is complete for its MVP scope. It has no open critical or high defects and passes 148 unit tests, 184 browser tests and 77 database access checks. Personal data is protected by the database itself.
- **Public launch: NO-GO for now.** The blockers are legal, privacy and commercial, not code quality. Each has a clear owner and next step.

## Before inviting outside testers
1. **Custom email sender** (decision 030). Without it, sign-up emails reach only members of the Supabase organisation. A free tier (e.g. Resend, Brevo) is enough. About 30 minutes, including domain verification.
2. **First real backup and restore test** (M6-01), then weekly backups while testers are active.
3. **Removal and deletion checks on the real service** (M6-02, M6-05).
4. **Keep the test small**, well under 1,000 people. Above 1,000 data subjects in six months, Mealwise becomes a Data Controller of Major Importance under the NDPA (registration, DPO, annual audit).

## Public launch blockers
| # | Blocker | Why | Next step | Cost |
|---|---|---|---|---|
| 1 | Privacy: legal review of `/privacy` and consent, DPIA, breach runbook, cross-border basis (UK) | Health-related data; NDPA and GAID duties (PRIVACY_REVIEW.md) | Engage a Nigerian data protection lawyer or a DPCO | Professional fees |
| 2 | FAO food table licence (decision 035) | WAFCT licence is non-commercial; most meal figures use it | Request a licence from FAO, or replace with open (USDA) values where possible | Unknown; ask FAO |
| 3 | Hosting plans | Vercel Hobby terms are non-commercial; Supabase free has no backups or leaked-password check | Vercel Pro and Supabase Pro | About $45/month |
| 4 | Full recovery rehearsal into a new Supabase project (I23) | Recovery time is unknown | Rehearse once on Pro or a spare project | ₦0–$25 |
| 5 | Production environment | None exists; the test link is behind Vercel login | Follow DEPLOYMENT_GUIDE.md once 1–4 are done | — |

## Known limitations that don't block a beta
- About half of a week's shopping items have no price yet (I13, I21). The ₦ figures are lower bounds and say so.
- App screens are 224–261 KB of code against a 200 KB budget (I11). Lighthouse speed is 85–98 on public pages.
- Some plans pair similar staples on one day (I20). One-tap swap.
- A few FAO values to sense-check (I14). Ready-made prices are generic (I16).

## What was verified in Phase 6
Security headers and CSP; real 404s; least-privilege database grants; every access rule re-tested on the real database; account deletion cascades through every table; data download covers every table; sign out on all devices; no known vulnerabilities in shipped dependencies; backup and restore scripts drilled to PASS, including a negative check; accessibility (axe on every screen, Lighthouse 100); privacy gap analysis.
