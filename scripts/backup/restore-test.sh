#!/usr/bin/env bash
# Mealwise restore test: rebuild a backup in a fresh, throwaway database and prove nothing was lost.
#
#   bash scripts/backup/restore-test.sh backups/<date-time>
#
# By default it starts a temporary postgres:17 container with Docker (removed afterwards).
# To use another empty database instead, set RESTORE_DB_URL to its address (it must be EMPTY;
# never point this at Supabase).
#
# Steps: stand-ins for Supabase's roles and auth.users -> the schema from supabase/migrations (the
# source of truth) -> the users, then every row of app data from the backup (triggers off, so stored
# values like timestamps stay exactly as backed up) -> the same fingerprint as at backup time.
# PASS means every table has the same rows, byte for byte. Also checks Row Level Security works.
set -euo pipefail
B="${1:?Usage: restore-test.sh <backup folder>}"
B="$(cd "$B" && pwd)"
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
for f in full.dump users.csv fingerprint.txt; do [ -f "$B/$f" ] || { echo "Missing $B/$f"; exit 1; }; done

CONTAINER=""
cleanup() { [ -n "$CONTAINER" ] && docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

if [ -z "${RESTORE_DB_URL:-}" ]; then
  CONTAINER="mealwise-restore-test-$$"
  docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=restore-test -v "$B:/backup:ro" \
    -v "$HERE/supabase:/supabase:ro" postgres:17 >/dev/null
  until docker exec "$CONTAINER" pg_isready -U postgres -q; do sleep 1; done
  sleep 2
  sql() { docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
  restore() { docker exec "$CONTAINER" pg_restore -U postgres -d postgres "$@"; }
  BK=/backup; SB=/supabase
else
  sql() { psql "$RESTORE_DB_URL" -v ON_ERROR_STOP=1 -q "$@"; }
  restore() { pg_restore -d "$RESTORE_DB_URL" "$@"; }
  BK="$B"; SB="$HERE/supabase"
fi

echo "1/5 Supabase stand-ins (roles, auth.users, auth.uid)"
sql -f "$SB/drill/00_supabase_standins.sql"
echo "2/5 Schema from supabase/migrations"
for m in "$HERE"/supabase/migrations/*.sql; do sql -f "$SB/migrations/$(basename "$m")"; done
echo "3/5 Users (ids and emails)"
# The sign-up trigger is off while loading: profiles come from the backup, not from new sign-ups.
sql -c "alter table auth.users disable trigger user" \
    -c "\\copy auth.users (id, email, aud, role, raw_user_meta_data, created_at, updated_at) from '$BK/users.csv' csv header" \
    -c "alter table auth.users enable trigger user"
echo "4/5 App data (triggers off while loading)"
restore --data-only --schema=public --disable-triggers --no-owner "$BK/full.dump"
echo "5/5 Fingerprint and access check"
sql -At -F ' ' -f "$SB/drill/fingerprint.sql" > "$B/restored-fingerprint.txt"
# RLS still on and working after restore: a signed-in user sees only their own profile.
U=$(head -2 "$B/users.csv" | tail -1 | cut -d, -f1)
RLS=$(sql -At -c "begin; select set_config('request.jwt.claims', json_build_object('sub', '$U', 'role', 'authenticated')::text, true); set local role authenticated; select 'rls=' || count(*) filter (where id <> '$U') || ':' || count(*) filter (where id = '$U') from public.profiles; rollback;" | grep '^rls=' | cut -d= -f2)

if diff -u "$B/fingerprint.txt" "$B/restored-fingerprint.txt"; then
  echo "Every table matches the backup:"; cat "$B/restored-fingerprint.txt"
else
  echo "FAIL: the restored data differs from the backup (see the diff above)."; exit 1
fi
# Expect "0:1": no other user's profile visible, and the user's own profile visible.
if [ "$RLS" = "0:1" ]; then echo "Row Level Security works on the restored copy (a user sees only their own profile)."; else echo "FAIL: RLS check returned '$RLS'"; exit 1; fi
echo "PASS: restore test complete. The temporary database is removed."
