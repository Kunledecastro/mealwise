# Mealwise — Deployment Guide

How to run Mealwise in a new environment (for example production), from an empty Supabase project and Vercel project. Nothing here has been done for production: creating it, buying a domain, or upgrading plans needs the product owner's approval (master prompt rule). Costs are noted at each step.

## 1. What you need
| Service | Plan | Cost (as checked 2026-10-19) | Notes |
|---|---|---|---|
| GitHub repo `Kunledecastro/mealwise` | Free | ₦0 | Source of truth for code, schema (`supabase/migrations`) and catalogue |
| Supabase | Free for testing; **Pro recommended for launch** | Pro $25/month per organisation | Pro adds daily backups and the leaked-password check (I12) |
| Vercel | Hobby for testing; **Pro for a commercial launch** | Pro $20/month per member | Hobby terms are for non-commercial use |
| Email sender (decision 030) | e.g. Resend or Brevo free tier | ₦0 to start | Supabase's built-in sender only reaches project members |
| Domain (optional) | — | Varies | Then add it to the edge function's allowed origins (step 4) |

## 2. Supabase project
1. Create the project in **eu-west-2 (London)**, the closest region to Nigeria. Save the database password in a password manager.
2. Apply every file in `supabase/migrations/` **in name order**, in the SQL editor or with `supabase db push`. They create the tables, Row Level Security, grants, triggers and validation.
3. Run the database checks in the SQL editor: `supabase/tests/rls_profiles.sql`, `rls_meal_preferences.sql`, `rls_tracking.sql`, `rls_meal_plans.sql` and `rls_tracking_removal.sql`. Each ends with `RLS_TEST_RESULTS {...}`, and **every value must be true**. They roll themselves back.
4. Deploy the edge function `supabase/functions/delete-account` (`supabase functions deploy delete-account`). Add the production web address to `ALLOWED_ORIGINS` at the top of `index.ts` first. It uses Supabase's built-in secrets; don't add keys yourself.
5. Auth settings:
   - **Site URL** = the production address.
   - **Redirect URLs** = `https://<address>/auth/callback`.
   - Email confirmation **on**.
   - Minimum password length 8 or more.
   - Leaked-password protection **on** (Pro).
   - Custom SMTP sender (decision 030).
   - Use the email templates from Phase 2, whose links go to `/auth/callback`.
6. Run the security and performance advisors (Dashboard → Advisors). The only accepted warning on free is leaked-password protection.

## 3. Vercel project
1. Import the GitHub repo. The framework is detected as Next.js; no build settings needed.
2. Environment variables. Only these two, both safe to be public; never add the secret key to Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://<ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_…`
3. Deploy. Security headers and the Content Security Policy come from `next.config.ts`. The CSP allows connections only to the Supabase URL above, so the variable must be set **before** building.
4. For a test environment, keep **Vercel Authentication** on so only invited people can open it. For production, turn it off only when you're ready to launch.
5. Before connecting a custom domain, add it to the edge function's allowed origins (2.4) and to Supabase Auth (2.5).

## 4. After each deployment (smoke test, 5 minutes)
1. Open the site: landing page, `/privacy`, sign up with a test address, confirm by email, finish setup.
2. Home shows a suggestion; Profile shows a daily target; log a meal; add a weight; make a plan; open the shopping list.
3. Settings → Download my data (the file has profile, meal_log, weights, meal_plan).
4. Sign out, sign in again, then delete that test account.
5. Response headers include `content-security-policy` and `strict-transport-security`. In the browser console, run `fetch('/')` and check the headers, or use securityheaders.com.

## 5. Updating
- **Code:** push to `main`, and Vercel deploys. Every change must pass `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run test:e2e` first; the last one builds and runs about 180 browser checks.
- **Database:** add a new numbered file in `supabase/migrations/`, take a backup (BACKUP_AND_RESTORE.md), apply it, and re-run the `rls_*.sql` suites.
- **Catalogue:** edit `catalogue/`, then run `npm run catalogue:report`. That refreshes `docs/CATALOGUE_REVIEW.md` and the meal list the 404 check uses; the D-14 test fails if you forget.
- **Prices:** `npm run catalogue:prices export` → edit `docs/PRICE_SHEET.csv` → `npm run catalogue:prices import`.

## 6. Rollback
- **App:** Vercel → Deployments → the previous good deployment → **Promote / Instant Rollback**. It takes seconds and the database is untouched.
- **Database:** migrations only add things. To undo one, write a new migration that reverses it. If data was damaged, restore from the latest backup (BACKUP_AND_RESTORE.md, "Real recovery").

## 7. Monitoring
- Vercel → Logs and Runtime errors.
- Supabase → Logs (API, Auth, Edge Functions) and Advisors, weekly.
- Check `npm audit --omit=dev` monthly; it shows 0 vulnerabilities today.
