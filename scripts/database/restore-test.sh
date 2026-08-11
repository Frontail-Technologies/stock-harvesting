#!/usr/bin/env bash
# Restores a backup produced by backup.sh into a separate scratch database
# and verifies row counts against the source — this is the step most teams
# skip, and the only thing that actually proves a backup is restorable.
#
# Usage:
#   DATABASE_URL=postgres://... SCRATCH_DATABASE_URL=postgres://...scratch \
#     ./scripts/database/restore-test.sh [path/to/backup.dump]
#
# If no backup path is given, the newest *.dump file in $BACKUP_DIR is used.
#
# Required env:
#   SCRATCH_DATABASE_URL   Connection string for a throwaway database. Must
#                          be different from DATABASE_URL — this script
#                          refuses to run otherwise. Create the scratch
#                          database yourself first (e.g. `createdb
#                          stock_harvesting_restore_test`); this script only
#                          cleans tables inside it via `pg_restore --clean`,
#                          it does not create or drop the database itself.
# Optional env:
#   DATABASE_URL           Source database, used read-only here to pull
#                          comparison row counts. If unset, the restored
#                          counts are printed without a comparison.
#   BACKUP_DIR              Where to look for the newest backup when no path
#                          argument is given (default: ./backups)
#   VERIFY_TABLES           Space-separated table list to row-count
#                          (default: "instruments candles users
#                          market_collections sync_jobs")
#
# This script never runs anything against DATABASE_URL except read-only
# SELECT count(*) queries. All destructive operations (pg_restore --clean)
# target SCRATCH_DATABASE_URL only, and only after the identity check below
# passes.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
VERIFY_TABLES="${VERIFY_TABLES:-instruments candles users market_collections sync_jobs}"

if [ -z "${SCRATCH_DATABASE_URL:-}" ]; then
  echo "ERROR: SCRATCH_DATABASE_URL is not set. Refusing to run." >&2
  exit 1
fi

if [ -n "${DATABASE_URL:-}" ] && [ "$SCRATCH_DATABASE_URL" = "$DATABASE_URL" ]; then
  echo "ERROR: SCRATCH_DATABASE_URL is identical to DATABASE_URL. Refusing to restore over what looks like the production database." >&2
  exit 1
fi

for bin in pg_restore psql; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "ERROR: $bin is not on PATH. Install the PostgreSQL client tools first." >&2
    exit 1
  fi
done

backup_file="${1:-}"
if [ -z "$backup_file" ]; then
  backup_file="$(find "$BACKUP_DIR" -maxdepth 1 -name 'stock_harvesting_*.dump' -type f -print0 | xargs -0 ls -t 2>/dev/null | head -n1 || true)"
  if [ -z "$backup_file" ]; then
    echo "ERROR: no backup path given and no stock_harvesting_*.dump files found in $BACKUP_DIR." >&2
    exit 1
  fi
  echo "No backup path given — using newest: $backup_file"
fi

if [ ! -f "$backup_file" ]; then
  echo "ERROR: backup file not found: $backup_file" >&2
  exit 1
fi

echo "Restoring $backup_file into SCRATCH_DATABASE_URL ..."
echo "(This runs pg_restore --clean against the scratch database only — it drops and recreates objects inside that database, never DATABASE_URL.)"

# --clean --if-exists: reset the scratch DB's existing objects before
# restoring, so re-running this script against the same scratch database
# doesn't accumulate leftovers from a previous test.
pg_restore \
  --dbname="$SCRATCH_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$backup_file"

echo ""
echo "Restore finished. Row counts:"
echo ""
printf '%-28s %14s %14s\n' "table" "scratch" "source"
printf '%-28s %14s %14s\n' "----------------------------" "--------------" "--------------"

mismatch_found=0
for table in $VERIFY_TABLES; do
  scratch_count="$(psql "$SCRATCH_DATABASE_URL" -Atqc "SELECT count(*) FROM ${table};" 2>/dev/null || echo "ERROR")"

  if [ -n "${DATABASE_URL:-}" ]; then
    source_count="$(psql "$DATABASE_URL" -Atqc "SELECT count(*) FROM ${table};" 2>/dev/null || echo "ERROR")"
  else
    source_count="(DATABASE_URL not set)"
  fi

  printf '%-28s %14s %14s\n' "$table" "$scratch_count" "$source_count"

  if [ "$scratch_count" = "ERROR" ]; then
    mismatch_found=1
  fi
done

echo ""
if [ "$mismatch_found" -eq 1 ]; then
  echo "One or more tables could not be counted in the restored scratch database — treat this restore as FAILED and investigate before trusting this backup." >&2
  exit 1
fi

echo "Scratch counts above are your restore-test evidence. A source count of 0 alongside a real scratch table (or vice versa), or counts wildly apart with no writes in between, means investigate before trusting this backup — this script reports counts, it does not silently pass or fail that judgment call for you."
