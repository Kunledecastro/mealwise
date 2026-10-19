# Mealwise — Backup and Restore

Status: scripts written and **drill passed on 2026-10-19** (local PostgreSQL, synthetic data). The first backup and restore test of the real `mealwise-dev` database is for the product owner to run (manual test M6-01).

## Why we need this
Mealwise runs on Supabase's **free plan, which keeps no backups** (daily backups start on the Pro plan, $25/month). Supabase recommends that free projects export their data regularly and keep the copies elsewhere. If the project were lost, every account, log, weight and plan would be gone.

## What the scripts do
| Script | What it does |
|---|---|
| `scripts/backup/backup.sh` | Connects to the database with a password you type, and writes three files to `backups/<date-time>/`. `full.dump` holds all app data plus Supabase's sign-in data, for a real recovery. `users.csv` holds each user's id and email, for the restore test. `fingerprint.txt` holds the row count and a checksum for every table. |
| `scripts/backup/restore-test.sh` | Builds a throwaway database (Docker `postgres:17`, removed afterwards). Creates the tables from `supabase/migrations`, loads the backup, then compares fingerprints table by table. It also checks that a user can see only their own profile. Prints **PASS** or **FAIL**. |
| `scripts/backup/drill.sh` | Rehearses both steps on a local PostgreSQL with synthetic users. It includes a deliberately damaged backup that must FAIL. This is how the scripts themselves were tested. |

Backups contain personal data, including sensitive data. The `backups/` folder is git-ignored. Keep backups in an encrypted place (for example an encrypted drive or a password-protected archive), never on GitHub or shared drives. Keep them for **at most 30 days** and delete older ones. The privacy notice promises this, so deleted accounts disappear from backups within 30 days.

## How to back up (about 5 minutes)
You need Docker Desktop, or PostgreSQL 17 tools (`pg_dump`, `psql`). On Windows, use WSL or Git Bash.

1. In the Supabase dashboard, open `mealwise-dev`, click **Connect**, then **Session pooler**, and copy the connection string. It contains `[YOUR-PASSWORD]`: replace that with the database password. If you've forgotten it, reset it under Project Settings → Database.
2. In a terminal, from the project folder:
   ```bash
   export SUPABASE_DB_URL='postgresql://postgres.naaoigrhzfivantuysxl:YOUR-PASSWORD@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
   USE_DOCKER=1 bash scripts/backup/backup.sh
   unset SUPABASE_DB_URL
   ```
   Leave out `USE_DOCKER=1` if you have PostgreSQL 17 tools installed. The password stays in your terminal; the scripts never write or print it.
3. The script prints the fingerprint table (rows and checksums) and the folder it wrote.

## How to test a restore (about 10 minutes, once, then quarterly)
```bash
bash scripts/backup/restore-test.sh backups/<the folder from step 3>
```
Expected ending: `Every table matches the backup`, `Row Level Security works on the restored copy`, `PASS`. Paste the output into chat (it has no personal data, only counts and checksums) and it will be recorded in TEST_PLAN.md.

## Real recovery into a new Supabase project (if ever needed)
1. Create a new Supabase project in eu-west-2 (London).
2. Apply `supabase/migrations/*.sql` in name order (SQL editor, or `supabase db push`).
3. Restore `full.dump` with `pg_restore --data-only --disable-triggers --no-owner -d "<new project's connection string>" full.dump`. This restores the sign-in data first, so users keep their passwords.
4. Deploy the `delete-account` edge function. Point Vercel's two `NEXT_PUBLIC_SUPABASE_*` variables at the new project and redeploy.
5. Run the four `supabase/tests/rls_*.sql` suites on the new project.

Steps 1–5 have **not** been rehearsed: a third free Supabase project isn't available on the current organisation. The restore test above proves the backup is complete and the app data restores exactly. It does not prove Supabase's own sign-in tables restore into a new project. Rehearse this before launch if the account allows (I23).

## Schedule (recommended)
- **Weekly while testing** with real users, plus before every database migration.
- **Restore test** after the first backup, then quarterly.
- On the Pro plan, daily backups are automatic. Keep the weekly export anyway as an off-site copy.

## Drill result (2026-10-19, PostgreSQL 16, synthetic data)
```
auth.users 3 · meal_logs 30 · meal_plans 3 · meal_preferences 9 · profiles 3 · weight_entries 18
Every table matches the backup
Row Level Security works on the restored copy (a user sees only their own profile).
PASS: restore test complete.
Negative check passed: the damaged restore was caught.
DRILL PASSED
```
