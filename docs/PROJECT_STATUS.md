# Mealwise — Project Status

**Current phase:** Phase 6 — QA, security and release readiness
**Last completed phase:** Phase 5 (approved 2026-10-19)
**Implementation status:** Phase 6 **complete and tested. Awaiting your approval.** All six build phases are then done.
**Last updated:** 2026-10-19

## Completed
- Phases 0–5 (approved): catalogue of 70 meals, recommendations, accounts, targets, meal log, weights, plans, shopping list.
- Phase 6:
  - **Security**:
    - Content Security Policy and security headers on every page.
    - Real 404s for unknown pages.
    - "Sign out on all devices".
    - Least-privilege database permissions.
    - No known vulnerabilities in shipped code.
  - **Verification**:
    - Every database access rule re-tested on the real database (77/77).
    - Deletion cascades through every table.
    - "Download my data" covers every table, with guard tests.
  - **Backups**: free backup and restore-test scripts, drilled to PASS locally (BACKUP_AND_RESTORE.md).
  - **Privacy**:
    - `/privacy` page (draft).
    - Complete consent wording.
    - NDPA gap analysis (PRIVACY_REVIEW.md).
  - **Guides**: DEPLOYMENT_GUIDE.md and RELEASE_READINESS.md.
  - Regression: unit 148/148, end-to-end 184/184, Lighthouse accessibility 100.

## Recommendation
**Closed beta: go** after four steps:
1. Custom email sender.
2. First real backup and restore test (M6-01).
3. Removal and deletion checks (M6-02, M6-05).
4. Keep the group well under 1,000 people.

**Public launch: not yet.** Blockers: privacy and legal review, the FAO licence, paid hosting plans, and a recovery rehearsal (RELEASE_READINESS.md).

## Open issues
I2, I3, I11, I12, I13, I14, I16, I18 (= M6-02), I19, I20, I21, I22, I23, I24. None is critical or high. See BUGS_AND_ISSUES.md.

## Decisions requiring your input
| ID | Decision | Recommendation |
|---|---|---|
| 030 | Email sender for outside testers | Free tier of Resend or Brevo; needed before the beta |
| — | Closed beta size and who | 10–30 people you know; under 1,000 keeps DCMI duties away |
| 035 | FAO licence | Request before any paid or public launch |
| — | Supabase Pro + Vercel Pro (~$45/month) | At public launch, not for the beta |
| — | Lawyer or DPCO for privacy review | Before public launch |

## Where things live
- Code: GitHub `Kunledecastro/mealwise` (`main`). Test link: https://mealwise-flame.vercel.app (Vercel login). Database: Supabase `mealwise-dev`.
- Guides: docs/DEPLOYMENT_GUIDE.md, docs/BACKUP_AND_RESTORE.md, docs/PRIVACY_REVIEW.md, docs/RELEASE_READINESS.md.

## Exact next step
Run M6-01 (backup and restore test) and M6-02, then try M6-03 to M6-07. Reply **"Phase 6 approved"** or list changes. After approval: set up the email sender and invite the first testers.
