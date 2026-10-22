# Mealwise — Project Status

**Current phase:** None. All build phases (0–6) are complete and approved.
**Last completed phase:** Phase 6 (approved 2026-10-19)
**Implementation status:** MVP complete. Next: closed beta preparation (below).
**Last updated:** 2026-10-22

## Completed
- Phases 0–6 (approved): catalogue of 70 meals, recommendations, accounts, targets, meal log, weights, plans, shopping list.
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
- Kitchen, mood, shop and own items (2026-10-22): setup gains a "Your kitchen and shop" step and moods; suggestions and plans skip meals needing equipment you don't have; your own items on the shopping list; list planned for your shop (shop prices not collected yet). Decisions 072–076.
- Day-fit suggestions (2026-10-21): once a meal is logged today, Home and meal lists size the next meal to the calories left of the daily target (decision 070).
- Photos (2026-10-19, after Phase 6): 31 of 70 meals have real, visually checked photos (21 added from Unsplash, free licence, credited). Fixed a bug where photos only attached to the first batch of meals. The other 39 show illustrations.

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
1. Run M6-01 (backup and restore test) and M6-02 (`rls_tracking_removal.sql`) if not done yet; paste the output so it can be recorded.
2. Set up the email sender (decision 030), then decide how testers get access (Vercel login admits only the owner on Hobby).
3. Invite the first 10–30 testers. Any new features would be a Phase 7, agreed separately.
