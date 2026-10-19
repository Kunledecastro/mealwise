# Mealwise — Privacy Review (Nigeria Data Protection Act 2023)

Status: **review of the test version, 2026-10-19.** This is a practical gap analysis written by Claude from the code and database as built. It is **not legal advice**, and Mealwise does **not** claim compliance with the NDPA or any other law. A Nigerian data protection lawyer or a licensed Data Protection Compliance Organisation (DPCO) should review it before a public launch.

Main sources: the Nigeria Data Protection Act 2023 (NDPA) and the NDPC's General Application and Implementation Directive 2025 (GAID), in force since 19 September 2025, as summarised by DLA Piper (June 2025), LawPavilion (September 2025), Templars (January 2026) and Mondaq (April 2026). Section and article numbers below come from those summaries and must be checked against the official texts.

## 1. What personal data Mealwise holds
| Data | Where | Sensitive? | Why |
|---|---|---|---|
| Email, password hash, sign-in sessions | Supabase Auth (`auth.users`) | No | Account |
| Name (optional), year of birth, height, current and target weight, goal, activity, units, sex (optional) | `profiles` | Weight and body measures: health-related | Daily target, suggestions |
| Diet, allergies, dislikes, cuisines, budget, cooking time | `profiles` | Allergies and some diets (e.g. halal) may reveal health or religion | Hard rules in suggestions |
| "Pregnant, breastfeeding or medical condition" yes/no | `profiles.needs_guidance` | **Yes** (health) | Withholds calorie targets for safety. Which condition is never asked or stored |
| Consent version and time | `profiles` | No | Proof of agreement |
| Saved / "Not for me" meals and reasons | `meal_preferences` | Low | Suggestions |
| Meal log (meals, portions, calories, macros, dates) | `meal_logs` | **Yes** (diet and health picture) | Daily totals, variety |
| Weight history | `weight_entries` | **Yes** (health) | Progress |
| Meal plan and shopping ticks | `meal_plans` | Low | Planning |

The daily calorie target is calculated in the browser and never stored. There are no analytics, no advertising, no tracking cookies, and no third-party scripts (enforced by the Content Security Policy). The only cookie is the sign-in session.

## 2. Who processes it
| Party | Role | Location | Notes |
|---|---|---|---|
| Product owner (Mealwise) | Controller | Nigeria | Decides purposes |
| Supabase | Processor (database, sign-in, edge function) | **eu-west-2, London, UK** | Data at rest and in transit encrypted by the provider |
| Vercel | Processor (hosting; sees requests, not database contents) | Global edge, functions in iad1 (US) | Pages are served by Vercel; personal data goes from the browser straight to Supabase |
| Email sender (Supabase built-in for now) | Processor | — | Decision 030: custom sender before outside testers |

## 3. Assessment against the main requirements
| Requirement (NDPA / GAID) | What Mealwise does now | Gap / action before launch |
|---|---|---|
| **Lawful basis** | Explicit consent at sign-up (checkbox, not pre-ticked), recorded with version and time; withdrawal = delete account | Consent text now lists every category, including health-related ones, and says data is kept in the UK (version 2026-10-19). Lawyer to confirm the wording is specific enough for **sensitive data** |
| **Transparency / privacy notice** | New `/privacy` page in plain language, linked from sign-up, the landing page and Settings | Marked "draft". Needs: the controller's legal name and contact, a contact for the DPO or privacy lead, a complaint route to the NDPC, retention wording reviewed |
| **Sensitive personal data** (health) | Consent; minimal collection (yes/no instead of the condition; year of birth instead of date of birth; sex optional); owner-only access enforced by the database | Confirm explicit consent covers it; DPIA (below) |
| **Data minimisation** | Only fields used by features; no free-text health notes; dislikes capped at 30 × 40 characters | None |
| **Data subject rights** (access, rectification, erasure, portability, objection) | Access + portability: "Download my data" (JSON of every table, checked by test PV-01). Rectification: Profile, Progress, Today. Erasure: per entry, or account deletion (cascades through every table, checked by PV-02 and the database). Objection: delete account | Add a contact route for requests the app can't handle. Response timelines to be confirmed by the lawyer |
| **Security** (NDPA s.39) | Row Level Security on every table (77 checks on the real database, plus 6 for removal still to run); least-privilege grants; secret key only in the edge function; HTTPS with HSTS; security headers and CSP; sign out on all devices; no secrets in code or logs; prod dependencies 0 known vulnerabilities | Leaked-password check (I12, Pro plan); custom email sender; MFA later |
| **Breach notification** — NDPC within **72 hours**; affected users without delay if high risk | No written procedure yet | Write a one-page incident runbook: who decides, how to check Supabase/Vercel logs, NDPC notification content, user email template |
| **Cross-border transfer** (NDPA Part VIII; GAID Art. 45 and Schedule 5) | Data stored in the UK; the consent now names it | Supabase has no African region. GAID allows transfer on an adequacy decision or an approved instrument; consent is a fallback with limits. **Lawyer to advise** whether consent is enough for the UK, or whether standard clauses with Supabase need NDPC approval. Keep the Supabase data processing agreement on file |
| **DPIA** (GAID Art. 28; mandatory for high-risk processing such as large-scale sensitive data; before processing; GAID template) | This review is a starting point, not a DPIA | Complete the GAID DPIA template before public launch, since health-related data is processed |
| **Data Controller of Major Importance** (registration, DPO, annual Compliance Audit Return through a DPCO) | Test version, a handful of users | Thresholds per Templars (January 2026): over **1,000 data subjects in six months** → Extra-High Level; over **5,000** → Ultra-High Level. CAR fees ₦100,000–₦1,000,000, due 31 March (2026 deadline extended to 30 May). Plan registration, a DPO and the first audit before reaching 1,000 users |
| **Children** | 18+ only: blocked at setup and by the database | None |
| **Retention** | Until the user deletes; backups at most 30 days (BACKUP_AND_RESTORE.md) | Decide whether to delete accounts inactive for e.g. 24 months |
| **Automated decisions** | Suggestions and targets are automated but explained ("Why this may suit you", "How we worked this out"); no legal or similarly significant effect; users can override everything | Lawyer to confirm no Art. 37-style safeguard is needed |
| **Processors** | Supabase and Vercel standard terms | Keep their DPAs on file; record them in a processing register |

## 4. Changes made in this review (Phase 6)
- `/privacy` notice page (draft), linked from sign-up, landing and Settings.
- Consent text names every data category and the UK location; version bumped to 2026-10-19.
- Least-privilege grants: no table-level removal permission where no policy allows it (migration `…130001`).
- Security headers and CSP; "Sign out on all devices".
- Guard tests: every table is in the data download, cascades on account deletion, and has RLS turned on (PV-01–PV-03).

## 5. Before public launch: privacy checklist
1. Lawyer or DPCO review of this document, `/privacy` and the consent wording.
2. DPIA on the GAID template.
3. Cross-border transfer basis confirmed (UK).
4. Incident and breach runbook (72-hour NDPC notification).
5. Controller identity, contact and complaint route in the notice.
6. DCMI registration, DPO and audit plan before 1,000 users.
7. Supabase Pro (backups, leaked-password check) or a weekly backup routine you actually follow.
8. Custom email sender (decision 030).

Sources:
- [DLA Piper — Nigeria: NDPC issues GAID, key compliance insights](https://privacymatters.dlapiper.com/2025/06/nigeria-ndpc-issues-gaid-key-compliance-insights/)
- [LawPavilion — NDP Act 2023 & GAID 2025: a comprehensive guide](https://blog.lawpavilion.com/ndp-act-2023-gaid-2025-a-comprehensive-guide-to-nigerias-new-data-protection-landscape)
- [Templars — Client alert: data protection compliance in Nigeria (January 2026)](https://www.templars-law.com/app/uploads/2026/01/Client-Alert-Data-Protection-Compliance-in-Nigeria.pdf)
- [Mondaq — NDPC extends data audit filing deadline (April 2026)](https://www.mondaq.com/nigeria/privacy-protection/1770448/regulatory-update-ndpc-extends-data-audit-filing-deadline)
- [NDPC — GAID 2025 (official text)](https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf)
- [Supabase — Database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase — Password security (leaked password protection, Pro plan)](https://supabase.com/docs/guides/auth/password-security)
