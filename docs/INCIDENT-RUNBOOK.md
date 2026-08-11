# Incident runbook

What to check first for the failure modes this codebase actually has —
written from the verified state of the code, not a generic template.

## No error-tracking tool is installed

There is no Sentry, APM agent, or metrics collector in this project today —
just structured pino logs to stdout. **Recommendation, not yet
implemented**: add an error-tracking SDK (e.g. Sentry has a free tier) so
failures surface without someone needing to be actively watching logs. This
was intentionally not added as part of this pass — it's a dependency
decision that needs sign-off, not something to add silently. Until it
exists, the sections below tell you where to look manually.

## "The site is down" / API not responding

1. `GET /api/health` — the fastest signal. `503` with `database.ok: false`
   means Postgres is unreachable; `200` means the API and database are both
   up and something else is wrong (frontend, network, DNS).
2. If the health check itself doesn't respond, the API process is down —
   check whether it's running (`server.ts`'s process) and its stdout logs
   for a crash.
3. Database pool errors log as `"Database pool error on an idle client"`
   (`db/client.ts`) — search logs for this if the health check flips
   between `ok`/not-`ok` intermittently rather than staying down.

## A sync job failed (admin panel shows "failed", or gainers/decliners data looks stale)

1. Check `GET /api/admin/jobs` (backed by `sync_jobs`, newest 50) for the
   job's `errorMessage`.
2. Search logs for `"Ingestion job failed"` (structured with `syncJobId`,
   `type`, and the exchange where relevant) — added in this pass; every
   admin-triggered sync (`triggerInstrumentSync`,
   `triggerSectorClassificationSync`, `triggerIndexCandleBackfill`,
   `triggerPriceRefresh`) now logs here in addition to writing the failed
   status to `sync_jobs`.
3. Provider-side failures (vendor API errors, expired tokens) log as
   `"Market data provider action failed"` — a 401/403 from the provider
   automatically marks that connection `expired` in
   `data_provider_connections`, which is why "reconnect" is usually the
   right first fix for a provider-auth-shaped failure.
4. Re-triggering the same sync is always safe — every upsert path
   (`upsertCandles`, `upsertInstruments`) is idempotent; re-running doesn't
   duplicate or corrupt data.

## Candle data for a symbol looks wrong or missing after a resync

1. Since this pass, `backfillDailyCandles`'s delete+replace runs inside one
   transaction (`replaceCandlesAtomically`) — a failed replacement no longer
   leaves the range empty. If you're looking at data from *before* this
   fix was deployed, a manual re-backfill for that symbol
   (`triggerCandleBackfill`) is the recovery path; there's no way to
   recover data that was already lost under the old code.
2. Search logs for `"upsertCandles complete"` (debug level — raise log
   level if needed) to see `insertedCount`/`updatedCount`/`durationMs` for
   the most recent write to that symbol.
3. Search for `"Dropped duplicate candle rows within a single upsert
   batch"` — if the provider sent duplicate rows for the same
   exchange/symbol/timeframe/time in one fetch, one was kept deterministically
   (last in the batch) and this logs how many were dropped.

## Connection pool exhaustion ("too many connections" / requests hanging)

1. `GET /api/health`'s `database.pool` field reports `total`/`idle`/`waiting`
   right now.
2. Max possible connections is `2 × DB_POOL_MAX` (API process + worker
   process) — see `docs/DATABASE.md` for the exact calculation. If you've
   scaled to multiple API replicas without updating this doc's assumption,
   recompute before assuming 20 is still the ceiling.
3. `DB_STATEMENT_TIMEOUT_MS`/`DB_QUERY_TIMEOUT_MS` (default 30s each) exist
   specifically so one runaway query can't hold a connection forever — if
   you suspect a specific query is the culprit, it will time out on its own
   within 30 seconds rather than needing a manual kill.

## Suspected data loss / need to restore from backup

Go straight to `docs/BACKUP-RESTORE.md`. **Never run `pg_restore` against
`DATABASE_URL` directly** — `scripts/database/restore-test.sh` refuses to
run if its scratch-database target matches `DATABASE_URL`, by design; there
is deliberately no "restore over production" path in this repo's tooling.

## Duplicate instrument rows / a sync partially failed with a constraint error

`instruments` enforces two unique constraints
(`(exchange, symbol)` and `(provider, instrument_token)`); `upsertInstruments`
dedupes a batch against both before inserting (this pass's fix — see
`docs/DATABASE.md`'s "Idempotency" section). If you see
`"Dropped duplicate instrument rows within a single sync batch"` in the
logs, that's the dedup working as intended — a genuine vendor data anomaly
(two symbols claiming the same instrument token, most likely), not a bug.
The dropped row simply doesn't update this round; it picks up on the next
sync once the vendor data is consistent again.
