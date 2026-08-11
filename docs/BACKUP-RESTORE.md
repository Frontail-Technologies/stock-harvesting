# Backup and restore

This document covers `scripts/database/backup.sh` and
`scripts/database/restore-test.sh` — the minimum backup plan for the
current stage, per the database production-readiness audit. It intentionally
does not assume any platform-provided backup exists; check the "Neon" note
below before treating this as your only safety net.

## Why this exists

Before this was added, there was no backup script, restore procedure, or
documentation anywhere in the repository. A backup nobody has ever restored
is not a verified backup — this plan makes restoring the normal, scripted
path, not a one-off crisis procedure.

## What the scripts do

### `backup.sh`

- Runs `pg_dump --format=custom` (compressed, and the only format
  `pg_restore` can selectively restore from) against `DATABASE_URL`.
- Writes to a temp file first, only renaming to the final
  `stock_harvesting_<UTC timestamp>.dump` name on success — a crashed run
  never leaves a file that looks like a real backup.
- Deletes backups older than `BACKUP_RETENTION_DAYS` (default 14) after a
  successful run.
- Read-only against the database. Never writes to it.

```bash
DATABASE_URL="postgres://..." \
BACKUP_DIR="./backups" \
BACKUP_RETENTION_DAYS=14 \
  ./scripts/database/backup.sh
```

### `restore-test.sh`

- Restores the newest (or a given) backup into `SCRATCH_DATABASE_URL` — a
  throwaway database you create yourself, never the production database.
- Refuses to run if `SCRATCH_DATABASE_URL` equals `DATABASE_URL`.
- Prints a row-count table for a configurable list of tables, comparing the
  restored scratch database against the live source (read-only `SELECT
  count(*)`, nothing else touches the source).

```bash
# One-time setup — a database that only exists for restore testing:
createdb stock_harvesting_restore_test

DATABASE_URL="postgres://...prod..." \
SCRATCH_DATABASE_URL="postgres://...restore_test..." \
  ./scripts/database/restore-test.sh
# or point at a specific backup file:
  ./scripts/database/restore-test.sh ./backups/stock_harvesting_20260101T030000Z.dump
```

**This script never restores over `DATABASE_URL`.** The identity check at
the top is a hard stop, not a warning.

## Requirements

Both scripts need the PostgreSQL client tools (`pg_dump`, `pg_restore`,
`psql`) on `PATH`, ideally matching or newer than the server's major
version. On the app's current Neon Postgres instance, check the server
version in the Neon dashboard and install a matching `postgresql-client`
package.

## Recommended schedule for this stage

- **Daily** `backup.sh`, off the API/worker host (a small scheduled task —
  cron, a scheduled CI job, or a platform cron feature — is enough; nothing
  in this repo runs it automatically yet).
- **Weekly** `restore-test.sh` against the scratch database, so a broken
  backup is caught within days, not discovered during an actual incident.
- Store backup files somewhere other than the machine that produced them
  (object storage, a second host) — a backup that lives next to the
  database it protects doesn't survive the failure modes that actually
  matter (disk failure, host loss, accidental deletion of both at once).

## Neon-specific note

`DATABASE_URL` in this project points to Neon serverless Postgres (a
`*.neon.tech` pooler endpoint). Neon's paid plans offer point-in-time
recovery and branch-based restore as a platform feature — if that's active
on your plan, it may already cover more than these scripts do. This was not
verified from the codebase (it's a dashboard/plan setting, not something
visible in `backend/.env`); check the Neon console before assuming either
that these scripts are redundant or that they're your only protection.
Whichever is actually true, run `restore-test.sh` at least once against a
real backup to confirm it in practice, not just in the plan description.

## RPO / RTO for this stage

Not previously defined anywhere in the repo. With the daily schedule above:

- **RPO (data loss on failure):** up to 24 hours of writes, bounded by
  backup frequency — narrower if Neon's own PITR is active on your plan.
- **RTO (time to restore):** the time to run `pg_restore` against a fresh
  database plus reconfiguring `DATABASE_URL` to point at it — untimed here
  since it depends on backup size; time it the first real restore-test run
  and record the number.

If these numbers aren't tight enough for the business, the fix is a shorter
backup interval or confirming/enabling Neon's PITR, not a different tool.

## What this deliberately does not do

- **No automatic restore over production**, ever — by design, not by
  omission.
- **No encryption of backup files** — add it at the storage layer (e.g. a
  private, encrypted-at-rest S3 bucket) rather than in these scripts, since
  that's usually already how the destination storage is configured.
- **No automated scheduling** — the scripts are the mechanism; wiring them
  to cron/CI is a deployment-environment decision this repo doesn't make
  for you.
