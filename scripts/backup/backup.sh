#!/usr/bin/env bash
# Mealwise database backup (free plan: Supabase keeps no backups for us). See docs/BACKUP_AND_RESTORE.md.
#
#   export SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
#   bash scripts/backup/backup.sh            # writes backups/<date-time>/
#
# The URL holds your database password: type it in your own terminal only. It is never written to disk,
# printed, or committed. The backup itself contains personal data — keep it encrypted and off GitHub.
#
# Needs pg_dump and psql version 17 or newer (Supabase runs Postgres 17), or Docker: set USE_DOCKER=1
# to run them from the official postgres:17 image instead.
set -euo pipefail
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL first (see the top of this file)}"

OUT="${BACKUP_DIR:-backups/$(date +%Y-%m-%d_%H%M)}"
mkdir -p "$OUT"
HERE="$(cd "$(dirname "$0")/../.." && pwd)"

if [ "${USE_DOCKER:-0}" = "1" ]; then
  pg() { docker run --rm -i -e DB_URL="$SUPABASE_DB_URL" -v "$PWD/$OUT:/out" -v "$HERE/supabase/drill:/drill:ro" postgres:17 "$@"; }
  DIR=/out; DRILL=/drill
else
  pg() { DB_URL="$SUPABASE_DB_URL" "$@"; }
  DIR="$OUT"; DRILL="$HERE/supabase/drill"
fi
# Commands read the URL from DB_URL inside a shell, so it never appears in the process list or logs.
run() { pg sh -c "$1"; }

echo "1/3 Full data backup (app data and sign-in data, for a real recovery) -> $OUT/full.dump"
run "pg_dump \"\$DB_URL\" --data-only --schema=public --schema=auth --format=custom --no-owner --file=$DIR/full.dump"

echo "2/3 Sign-in users' ids and emails (used by the restore test) -> $OUT/users.csv"
run "psql \"\$DB_URL\" -v ON_ERROR_STOP=1 -q -c \"\\copy (select id, email, aud, role, raw_user_meta_data, created_at, updated_at from auth.users order by id) to '$DIR/users.csv' csv header\""

echo "3/3 Fingerprint of every table (row counts + checksums) -> $OUT/fingerprint.txt"
run "psql \"\$DB_URL\" -v ON_ERROR_STOP=1 -q -At -F ' ' -f $DRILL/fingerprint.sql > $DIR/fingerprint.txt"

cat "$OUT/fingerprint.txt"
echo "Backup written to $OUT. Next: bash scripts/backup/restore-test.sh $OUT"
