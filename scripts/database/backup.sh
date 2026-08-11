#!/usr/bin/env bash
# Compressed pg_dump backup of the application database.
#
# Usage:
#   DATABASE_URL=postgres://... ./scripts/database/backup.sh
#
# Required env:
#   DATABASE_URL       Connection string for the database to back up.
# Optional env:
#   BACKUP_DIR          Directory backups are written to (default: ./backups)
#   BACKUP_RETENTION_DAYS  Delete backups older than this many days after a
#                        successful run (default: 14). Set to 0 to disable
#                        retention cleanup entirely.
#
# Produces: $BACKUP_DIR/stock_harvesting_<UTC timestamp>.dump
#   (pg_dump custom format, -Fc — already compressed, and the only format
#   pg_restore can selectively restore from or list contents of.)
#
# This script only ever reads from the database (pg_dump). It never writes
# to it and never touches any other database.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Refusing to run." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump is not on PATH. Install the PostgreSQL client tools (matching or newer than the server's major version) first." >&2
  exit 1
fi

if ! [[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "ERROR: BACKUP_RETENTION_DAYS must be a non-negative integer, got '$BACKUP_RETENTION_DAYS'." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/stock_harvesting_${timestamp}.dump"
tmp_file="${backup_file}.partial"

echo "Backing up to $backup_file ..."

# Write to a .partial file and rename on success, so a crashed/interrupted
# run never leaves a truncated file indistinguishable from a good one.
if pg_dump --format=custom --file="$tmp_file" --no-owner --no-privileges "$DATABASE_URL"; then
  mv "$tmp_file" "$backup_file"
else
  rm -f "$tmp_file"
  echo "ERROR: pg_dump failed. No backup file was produced." >&2
  exit 1
fi

size_bytes=$(wc -c < "$backup_file" | tr -d ' ')
if [ "$size_bytes" -eq 0 ]; then
  echo "ERROR: backup file is empty ($backup_file). Treating as a failed backup." >&2
  rm -f "$backup_file"
  exit 1
fi

echo "Backup complete: $backup_file ($size_bytes bytes)"

if [ "$BACKUP_RETENTION_DAYS" -gt 0 ]; then
  echo "Removing backups older than $BACKUP_RETENTION_DAYS day(s) in $BACKUP_DIR ..."
  find "$BACKUP_DIR" -maxdepth 1 -name 'stock_harvesting_*.dump' -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete
fi

echo "Done."
