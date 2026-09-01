# Database

Technical reference for the PostgreSQL layer — schema conventions,
connection handling, indexing, and the fixes applied in the Phase 0
production-readiness pass. Pairs with `docs/BACKUP-RESTORE.md` (backups),
`docs/DEPLOYMENT.md` (migrations/process topology), and
`docs/INCIDENT-RUNBOOK.md` (when something breaks).

## Where it actually runs

`DATABASE_URL` points to **Neon serverless Postgres** (a `*.neon.tech`
pooler endpoint), not a self-hosted instance. Neon's own pooler already sits
in front of the connections this app's `pg.Pool` opens — see "Connection
pool" below for what that means for `DB_POOL_MAX`.

## Schema conventions

- Every table uses a `uuid` primary key (`defaultRandom()` /
  `gen_random_uuid()`), no integer/serial PKs anywhere.
- Numeric money/quantity columns are `numeric(precision, scale)`, never
  `float`/`double precision` — `open`/`high`/`low`/`close` are
  `numeric(18,4)`, `volume` is `numeric(20,0)` (ample headroom, no int
  overflow risk).
- Enums (`candle_timeframe`, `job_status`, `provider_status`, `user_role`,
  `user_plan`, `scan_run_status`) are real Postgres enums via
  `pgEnum`, not free text — but `exchange`, `segment`, and `source` remain
  unrestricted `varchar`, relying on application-level constants for
  consistency. There is no `exchanges` table; exchange metadata (timezone,
  session hours, holiday calendar) isn't modeled anywhere yet — fine for the
  4 currently-hardcoded exchanges (`shared/constants/domain.ts`), a real gap
  before adding a market with a materially different trading calendar
  (crypto's 24/7 model, in particular).
- `instruments` identity is `(exchange, symbol)` **and** `(provider,
  instrument_token)` — two separate unique constraints, both enforced.
  Symbol is never assumed globally unique.
- `candles` uniqueness is `(exchange, symbol, timeframe, time)` — string
  keyed, not `instrument_id`-keyed, even though `instrument_id` exists on
  every row. This is deliberate-by-convention (every read and write path
  agrees on the string key) rather than an oversight; switching the identity
  key to `instrument_id` would be a real migration for no currently-measured
  benefit.
- `candles.time` is a plain `date` (no time-of-day, no timezone) — correct
  for the only granularity this app stores today (`1D`/`1W`/`1M`, no
  intraday). Would need to become `timestamptz` the moment intraday candles
  are added.

## Connection pool

Configured in `backend/src/db/client.ts`, tunable via env (see
`docs/ENVIRONMENT-VARIABLES.md`):

| Setting | Env var | Default |
|---|---|---|
| Max connections per process | `DB_POOL_MAX` | 10 |
| Connection acquire timeout | `DB_CONNECTION_TIMEOUT_MS` | 5,000 ms |
| Idle connection timeout | `DB_IDLE_TIMEOUT_MS` | 10,000 ms |
| Server-side statement timeout | `DB_STATEMENT_TIMEOUT_MS` | 30,000 ms |
| Client-side query timeout | `DB_QUERY_TIMEOUT_MS` | 30,000 ms |

**Max possible connections to Postgres** = `(API process pool max) +
(worker process pool max)`. Today that's exactly 2 OS processes — the API
(`server.ts`) and the optional worker (`worker.ts`), each importing
`db/client.ts` and getting its own `Pool` instance (module state doesn't
cross processes) — so with defaults: **2 × 10 = 20 connections, maximum**.
No PM2/cluster mode is configured, so this is the actual ceiling today, not
a padded estimate. If that changes (multiple API replicas, clustered PM2),
recompute as `(replica count) × DB_POOL_MAX` per process type and reconsider
whether Neon's pooler limits (check your plan) or `DB_POOL_MAX` need
adjusting — the pool config is intentionally an env var, not a constant, for
exactly this reason.

The pool has an `error` event handler (logs via pino, doesn't crash the
process on a dropped idle connection) and both processes already close it
gracefully on `SIGINT`/`SIGTERM`.

**Is PgBouncer needed?** Not on top of what's already here — Neon's own
pooler endpoint already provides that layer. Revisit only if connection
counts grow well past Neon's own limits for your plan, which the 20-max
ceiling above is nowhere close to today.

## Indexes

| Table | Index | Serves |
|---|---|---|
| `instruments` | `(exchange, symbol)` unique | Identity; upsert conflict target |
| `instruments` | `(provider, instrument_token)` unique | Vendor-token identity |
| `instruments` | `(exchange, active, symbol)` | Stock list filter+sort |
| `instruments` | `(exchange, active, name)` | Stock list filter+sort |
| `instruments` | `(exchange, active, latest_change_pct)` | Gainers/decliners filter |
| `candles` | `(exchange, symbol, timeframe, time)` unique | Every candle read/write path |
| `sync_jobs` | `(created_at DESC)` | `admin.service.ts`'s `listJobs()` |
| `scanner_drawings` | `(user_id, exchange, symbol, timeframe)` | `drawings.service.ts`'s drawing lookups |

The candle index is the one query pattern worth calling out explicitly —
`WHERE exchange = ? AND symbol = ? AND timeframe = ? AND time BETWEEN ? AND
? ORDER BY time` (the shape every chart/backfill read uses) matches the
index's column order exactly: 3 leading equality columns, then a range +
sort on the trailing column, so Postgres can serve it as a pure index range
scan with no extra sort step. No live `EXPLAIN` was run to confirm this (no
reachable Postgres instance in the environment these changes were made in —
run it yourself before trusting this description at scale):

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM candles
WHERE exchange = 'NSE' AND symbol = 'RELIANCE' AND timeframe = '1D'
  AND time BETWEEN '2025-01-01' AND '2026-01-01'
ORDER BY time;
```

A healthy plan is a single `Index Scan` (or `Index Only Scan`) on
`candles_exchange_symbol_timeframe_time_unique` with no separate `Sort`
node. A `Seq Scan` here would mean either the index is missing/disabled or
the query shape has drifted from what it's built for.

## The `getLatestStockStats` fix

Previously: `WHERE exchange=? AND timeframe='1D' AND symbol IN (...) ORDER
BY symbol, time DESC` with **no `LIMIT`**, keeping only the first 2 rows per
symbol in a JS `Map` — meaning every call transferred a symbol's entire
stored daily history to discard nearly all of it. Called once per 200-symbol
chunk during a full-market price refresh (~50 chunks for NSE's ~9,900
instruments).

Now: a `row_number() OVER (PARTITION BY symbol ORDER BY time DESC)` window
query filtered to `rn <= 2` in an outer query, asking Postgres for exactly
the rows needed instead of filtering client-side. Same composite index,
same response shape (`Map<symbol, {close, open, volume, changePct, time}>`)
— this was a query-shape fix, not an indexing fix. See the function's own
doc comment in `market-data.service.ts` for both the old and new query text
formatted for `EXPLAIN (ANALYZE, BUFFERS)`.

## Transactions

`db.transaction(async (tx) => {...})` is used for every multi-statement
write that needs to succeed or fail as one unit:

- `replaceCandlesAtomically` (`market-data.service.ts`) — delete + 3
  timeframe upserts when replacing a candle range. Added in this pass;
  previously these ran as separate non-transactional statements, so a
  failure between the delete and the first upsert could permanently lose
  candle data. See `market-data.backfill-atomicity.test.ts` for a
  failure-path proof (against a fake transaction-capable client — no
  reachable Postgres in this environment to run it as a true integration
  test; the fake proves the code routes every write through one
  `dbClient.transaction()` call, which is what's actually in this
  codebase's control — Postgres's own rollback guarantee is Postgres's,
  not re-tested here).
- Collection CSV import (`market-collections.service.ts`) — member
  insert/deactivate + collection metadata update. The member insert/
  deactivate steps are currently row-by-row inside this transaction (not
  batched) — a real backend-hardening item, not fixed in this pass.
- Drawing replace-all (`drawings.service.ts`) — delete + re-insert.
- Refresh-token rotation (`auth.service.ts`) — `SELECT ... FOR UPDATE` plus
  family-wide revocation on reuse detection.
- Weekly Strong backtest week persistence (`persistWeeklyStrongBacktestWeek`,
  `weekly-strong-backtest.service.ts`) — upsert the run row (idempotent via
  `ON CONFLICT` on `(collectionId, weekEnding, membershipMode)`) + delete
  that run's previous members + re-insert the current ones, so a rerun
  never leaves stale members from a superseded generation. See
  `weekly-strong-backtest.persistence.test.ts` for the same
  fake-transaction-client proof pattern as `replaceCandlesAtomically`
  above.

Functions that may run either standalone or inside an existing transaction
accept a `dbClient: DbOrTx = db` parameter (see `db/client.ts`) — the
pooled client by default, or the transaction handle passed in explicitly.

## Idempotency

`upsertCandles` and `upsertInstruments` both dedupe their input batch before
`INSERT ... ON CONFLICT DO UPDATE` — `instruments` in particular enforces
*two* unique constraints (`(exchange, symbol)` and `(provider,
instrument_token)`), but `ON CONFLICT` can only target one of them, so a
batch with a same-token collision across two different symbols would
otherwise hard-fail the whole insert even though only one row actually
conflicts. Both dedup passes are deterministic ("last row in the batch
wins") and log a warning when they actually drop something, so a real
vendor data anomaly is visible in the logs rather than silently discarded.

Re-running any sync (candle backfill, instrument sync, price refresh)
produces the same final state — nothing depends on running exactly once.

## Concurrency

Admin-triggered instrument/price syncs enqueue onto the same BullMQ queue
the repeatable scheduled sync uses when Redis is configured (`worker.ts`
runs with BullMQ's default concurrency of 1, so queued jobs serialize); when
Redis isn't configured, those same triggers run inline in the API process
instead, and the worker process refuses to start at all. Either way, two
conflicting writers for the same exchange can't run at once today.
Sector-classification sync and index-candle-backfill always run inline
(never queued) but only ever touch different `instruments` columns than a
concurrent instrument sync would (sector/industry vs. name/token/segment),
so there's no overlapping-write risk between them even without explicit
locking.

## TimescaleDB

**Not installed.** No dependency, no `CREATE EXTENSION`, no hypertable,
anywhere in this codebase. Candles are daily/weekly/monthly only — no
intraday timeframe exists. Plain Postgres comfortably handles this; the
trigger for revisiting TimescaleDB is adding intraday granularity (1-minute
or tick data across thousands of instruments), not row count in the
abstract. If/when that happens, native Postgres range partitioning on
`candles.time` is the more likely first step given this codebase's existing
style (chunked, idempotent, upsert-based patterns) — TimescaleDB only if
partition-maintenance overhead becomes a real operational burden on top of
that.

## Migrations

File-based via `drizzle-kit generate` / `drizzle-kit migrate` (npm scripts
`db:generate` / `db:migrate`) — not `drizzle-kit push`. `generate` only
diffs the schema files against the local migration history in
`drizzle/meta/` and writes a new `.sql` file; it does not touch the live
database. `migrate` is the only command that applies anything, and it's a
separate, deliberate step — see `docs/DEPLOYMENT.md`.
