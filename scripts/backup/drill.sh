#!/usr/bin/env bash
# Rehearses backup + restore end to end on a local PostgreSQL, with synthetic data only.
# Used to test the scripts themselves (no Supabase involved):
#   1. a "source" database built from supabase/migrations + supabase/drill/10_synthetic_data.sql
#   2. backup.sh against it -> backups/drill-*/
#   3. restore-test.sh into a second, empty database -> PASS/FAIL
# Needs PostgreSQL (initdb, pg_ctl, psql, pg_dump, pg_restore) on PATH.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d)"
PORT="${DRILL_PORT:-54331}"
trap 'pg_ctl -D "$WORK/data" -m fast stop >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

initdb -D "$WORK/data" -U postgres -A trust >/dev/null
pg_ctl -D "$WORK/data" -o "-p $PORT -k $WORK" -l "$WORK/log" start >/dev/null
URL="postgresql://postgres@localhost:$PORT"
psql "$URL/postgres" -q -c "create database source" -c "create database target" -c "create database target2"

echo "Building the source database from migrations + synthetic data"
psql "$URL/source" -v ON_ERROR_STOP=1 -q -f "$HERE/supabase/drill/00_supabase_standins.sql"
for m in "$HERE"/supabase/migrations/*.sql; do psql "$URL/source" -v ON_ERROR_STOP=1 -q -f "$m"; done
psql "$URL/source" -v ON_ERROR_STOP=1 -q -f "$HERE/supabase/drill/10_synthetic_data.sql"
OUT="${DRILL_OUT:-$HERE/backups}/drill-$(date +%Y%m%d%H%M%S)"
SUPABASE_DB_URL="$URL/source" BACKUP_DIR="$OUT" bash "$HERE/scripts/backup/backup.sh"
RESTORE_DB_URL="$URL/target" bash "$HERE/scripts/backup/restore-test.sh" "$OUT"

# The check must be able to fail: pretend one meal-log row was lost and expect restore-test to say FAIL.
echo "Negative check: a backup whose fingerprint doesn't match must FAIL"
cp -r "$OUT" "$OUT-tampered"
sed -i 's/^meal_logs .*/meal_logs 29 0000/' "$OUT-tampered/fingerprint.txt"
if RESTORE_DB_URL="$URL/target2" bash "$HERE/scripts/backup/restore-test.sh" "$OUT-tampered" >/dev/null 2>&1; then
  echo "DRILL FAILED: a damaged restore was reported as PASS"; exit 1
fi
echo "Negative check passed: the damaged restore was caught."
echo "DRILL PASSED"
