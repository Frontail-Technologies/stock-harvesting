# Backtest (Weekly Strong Backtest)

Architecture only — **no qualification thresholds/formulas documented
here** (proprietary; see `backend/src/modules/market-data/weekly-strong-evaluator.ts`
directly in-repo if you need the actual logic, and see
[DASHBOARD.md](./DASHBOARD.md) for why this is a *separate* system from
the top 4 Dashboard widgets — do not conflate them).

## Persisted tables

`backend/src/db/schema/weekly-strong-backtest.ts`:

- **`weekly_strong_backtest_runs`** — one row per
  `(collectionId, weekEnding, membershipMode)` — "the backtest bar for
  that week." Columns include `membershipVersionId` (nullable FK →
  `market_collection_versions.id`, **restrict** on delete — deliberate, so
  provenance can't silently vanish), `membershipMode` (enum:
  `current_membership` | `historical_membership`), `evaluatorVersion`,
  `totalPassing`, `generatedAt`. Unique on
  `(collectionId, weekEnding, membershipMode)` for idempotent reruns.
- **`weekly_strong_backtest_members`** — the passing stocks for one run.
  Denormalized `symbol`/`name`/`exchange`/`sector`/`industry` snapshot
  **at generation time** (not a live join) — a later sector/industry
  reclassification does not retroactively change an old run's display
  values. FK `runId` → runs (cascade), `instrumentId` → instruments
  (cascade).

## Membership mode — do not blend

| Mode | `membershipVersionId` | Meaning |
|---|---|---|
| `current_membership` | `NULL` | Evaluated against the collection's *current* active membership at generation time |
| `historical_membership` | populated | Evaluated against the collection's membership **as it actually was** on that specific completed week — resolved via `getCollectionMembershipAt()` (`market-collection-versions.service.ts`) |

Backed by `market_collection_versions` /
`market_collection_version_members` (immutable point-in-time snapshots,
created on every confirmed admin CSV import — never updated in place; a
correction creates a **new** version via an explicit replace workflow).
`market_collection_version_members` deliberately excludes sector/industry
(joined live at rebuild time from `instruments`, so later classification
corrections can reach old historical reruns without needing new
snapshots). A given chart/series is always one mode or the other, never
mixed — see [REGRESSION_RULES.md](./REGRESSION_RULES.md).

## Module ownership

`backend/src/modules/weekly-strong-backtest/` is split by responsibility,
not one large service file:

- **`weekly-strong-backtest.generation.ts`** — orchestrates a run: resolves
  the relevant membership (current, or historical via
  `market-collection-versions.service.ts`), fetches the market data the
  canonical evaluator needs, invokes it, and hands the result to
  persistence. Never writes to `weekly_strong_backtest_*` itself.
- **`weekly-strong-backtest.persistence.ts`** — the one place that writes
  `weekly_strong_backtest_runs`/`_members`: `persistWeeklyStrongBacktestWeek`.
  Idempotent per `(collectionId, weekEnding, membershipMode)` —
  `onConflictDoUpdate` on the run row, then a full delete-then-reinsert of
  that run's members (not a diff), so a rebuild can never leave a stale
  member behind and reruns are safe to call from generation, the
  incremental sync, or an admin rebuild alike. Covered independently by
  `weekly-strong-backtest.persistence.test.ts` against a fake db client.
- **`weekly-strong-backtest.queries.ts`** — the Dashboard-facing reads
  (stacked-by-week chart data, week detail, week-over-week membership
  changes) — always persisted rows, never the evaluator. Owns the
  current/historical run-preference logic and the sector aggregation the
  chart consumes. `getWeeklyStrongBacktestMembershipChanges` takes a
  required `weekEnding` (the canonical week-ending Friday the live Harvest
  Results table shows — see "Canonical week-ending Friday" below) and
  resolves the persisted run whose stored `weekEnding` falls in that
  date's own Monday-Sunday ISO week (via `getIsoWeekRange`, from
  `trading-calendar.ts`) — **never** "whichever run happens to be latest",
  since the Backtest's own generation cadence can lag or lead the live
  snapshot. If no run exists for that exact week, the response reports
  `available: false` with no other run substituted, rather than silently
  showing a different week's data under the current week's label. Once a
  matching run is found, the previous week is the closest persisted run
  with an earlier `weekEnding` in the same mode; the actual diff runs
  through the pure, independently-tested `computeMembershipChanges` —
  identity is `exchange:symbol`, never symbol alone; no evaluator call, no
  live recomputation. With no earlier run at all (a collection's first
  generated week), every current member counts as entered and nothing
  counts as exited — a decided convention (no prior one existed to match),
  not a fallback that silently hides missing history. Every `weekEnding`/
  `previousWeekEnding` this module returns is passed through
  `getWeekEndingFriday` before leaving the module — see below.
- **`weekly-strong-backtest.status.ts`** — the Admin operational status
  (Not generated / Generating / Ready / Failed) for each of the two
  generation jobs, read from `sync_jobs` + the persisted run stats.
- **`weekly-strong-backtest.routes.ts`** mounts only the two public
  Dashboard-facing reads above; the admin generate/rebuild/status endpoints
  are mounted under `admin.routes.ts` instead (same split as
  market-collections' own admin vs. public routes).

Generation functions:

- `runWeeklyStrongBacktestBackfill(...)` — generates `current_membership`
  runs. Triggered from Admin (collection detail page → "Generate").
- `runWeeklyStrongBacktestHistoricalRebuild(...)` — rebuilds
  `historical_membership` runs against the relevant point-in-time
  versions. Triggered from Admin ("Rebuild Historical").
- `syncWeeklyStrongBacktestIncremental(exchange)` — the scheduled path.
  **Piggybacked onto the existing `instrument-sync` BullMQ job**, per
  exchange, every ~30 min (not its own separate schedule) — idempotent
  no-op except when a new week has actually closed. Errors here are
  swallowed (best-effort) so a backtest hiccup never fails the underlying
  instrument/price sync it rode in on.

**Verified, not assumed**, against `admin.service.ts` directly: the two
admin-triggered jobs (`triggerWeeklyStrongBacktestBackfill`,
`triggerWeeklyStrongBacktestHistoricalRebuild`) each check
`getMarketDataQueue()` — if a queue exists (`REDIS_URL` set), the job is
enqueued for `worker.ts`; if not, **the same service function runs inline
in the API request instead**, and the `sync_jobs` row is marked
`completed`/`failed` synchronously rather than `queued`. Both paths exist
in code today; neither is a fallback stub. The incremental sync
(`syncWeeklyStrongBacktestIncremental`) is different — it only ever runs
from inside the worker's `instrument-sync` job handler, so it has **no**
inline equivalent and simply does not happen without `REDIS_URL` set and
`worker.ts` running. See [ARCHITECTURE.md](./ARCHITECTURE.md) "BullMQ /
background jobs" for the full per-operation table across all features.

## Canonical week-ending Friday

`weekly_strong_backtest_runs.weekEnding` is **stored unchanged** — still
whatever `aggregateWeeklyCandles` produced (the ISO week's first trading
day, normally Monday — see [MARKET_DATA.md](./MARKET_DATA.md)'s "Why
weekly candles aren't Friday-keyed"). No migration was run and no write
path was touched. Instead, **every API-response boundary in this module
converts through `getWeekEndingFriday`** (`trading-calendar.ts`) before a
value reaches the frontend — the stacked chart's `points[].weekEnding`,
week-detail's `weekEnding`, and membership-changes' `weekEnding`/
`previousWeekEnding` are all canonical Fridays; internal lookups still
range-match via `getIsoWeekRange` since the stored value's exact weekday
can vary. This was a deliberate choice over migrating the column: it's
zero-risk for historical rows (nothing about a stored value's meaning
changes, only how it's displayed) and avoids a data migration for a
purely cosmetic/identity fix. If a new consumer of this module ever reads
`run.weekEnding` directly from the DB (bypassing this module's read
functions), it must apply `getWeekEndingFriday` itself — the raw column is
not user-facing.

This is the same rule the Dashboard's Harvest Results table and Weekly
Stock In/Out tables use for their own `weekEnding` — see
[DASHBOARD.md](./DASHBOARD.md) "Canonical weekly identity."

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/weekly-strong-backtest/:code` | Stacked-by-week chart data — **always reads persisted runs**, never runs the evaluator live |
| `GET` | `/api/weekly-strong-backtest/:code/membership-changes?weekEnding=` | Week-over-week membership diff (entered/exited), anchored to the exact ISO week containing the canonical `weekEnding` — required, never "latest". Registered before `:weekEnding` below so the literal path always wins |
| `GET` | `/api/weekly-strong-backtest/:code/:weekEnding` | Week detail (member list) |
| `GET` | `/api/admin/market-collections/:id/weekly-strong-backtest/status` | Admin status |
| `GET` | `/api/admin/market-collections/:id/weekly-strong-backtest/historical-status` | Admin historical status |
| `POST` | `/api/admin/market-collections/:id/weekly-strong-backtest/generate` | Trigger backfill |
| `POST` | `/api/admin/market-collections/:id/weekly-strong-backtest/rebuild-historical` | Trigger historical rebuild |

## Frontend

- `src/features/weekly-strong-backtest/*` — `api/`, `hooks/use-weekly-strong-backtest.ts`
  (`useWeeklyStrongBacktestStacked`, `useWeeklyStrongBacktestWeekDetail`,
  `useWeeklyStrongBacktestMembershipChanges`, all 1-hour `staleTime` — data
  only changes on weekly generation or an admin rebuild), `types.ts`.
- `src/features/dashboard/components/WeeklyStrongBacktestSection.tsx` —
  the actual chart/detail UI, embedded in the Dashboard page,
  `key={code}` remounted per segment. Its own period/sector-filter/
  selected-week state is a **separate** state system from the Dashboard's
  top-widget cross-filter — see [DASHBOARD.md](./DASHBOARD.md).
- `src/features/dashboard/components/WeeklyStrongMembershipChanges.tsx` —
  the "Stocks In This Week" / "Stocks Out This Week" pair rendered directly
  under the main Harvest Results table (`WeeklyStrongStockTable.tsx`), not
  inside it — a separate data source (persisted backtest runs, not the
  live Harvest snapshot), so it's a sibling component rather than new logic
  bolted onto that table.

## Invariant

**Persisted backtests must not be recomputed during normal page render.**
Every read path above serves stored `weekly_strong_backtest_runs`/
`_members` rows; generation only happens via the explicit admin triggers
or the piggybacked incremental sync job, never as a side effect of a GET
request.

## Collection data preparation (post-import automation)

A third trigger for backtest generation, alongside the admin buttons and
the incremental sync job above: `prepareCollectionData` in
`backend/src/modules/market-collections/market-collection-preparation.service.ts`,
which runs automatically after every successful membership import (single
or Bulk Import) — a freshly-imported collection would otherwise have no
persisted backtest until an admin manually clicked "Generate Backtest,"
and `runWeeklyStrongBacktestBackfill` produces empty-looking results for
any member whose history was never fetched (it only reads stored candles,
never fetches). This step closes that gap without any new
evaluator/generation logic — it only orchestrates:

1. Determine which of the collection's current members are missing the
   evaluator's own required candle history (`readCandleHistoryRange`/
   `findSymbolsNeedingHistoryBackfill`, `market-data.candles.ts`), reusing
   the exact fetch window `computeWeeklyStrongBacktestMembers` already
   uses (`WEEKLY_STRONG_BACKTEST_FETCH_YEARS`, `market-data.metrics.ts`) —
   never a separately-invented lookback.
2. Backfill only those members via the existing `runChartBackfillOnce`
   (`market-data.candle-sync.ts`) — reused specifically because it already
   dedupes concurrent/duplicate backfill requests for the same
   `exchange:symbol:from:to` (in-flight promise map + a completion
   cooldown), which is what keeps two collections sharing a member (e.g.
   RELIANCE in both "BSE 500" and "BSE SENSEX") from triggering the same
   provider fetch twice.
3. Call the existing `runWeeklyStrongBacktestBackfill` (current-membership)
   unconditionally, and `runWeeklyStrongBacktestHistoricalRebuild` only if
   the collection already had at least one current-membership week before
   this run — the same guard that function already enforces on its own.
4. Classify each member's post-backfill data as sufficient or not via the
   evaluator's own existing `hasSufficientWeeklyStrongHistory` — **not**
   by whether its earliest candle reaches back the full fetch window. A
   company listed 2 years ago can never have `WEEKLY_STRONG_BACKTEST_FETCH_YEARS`
   of history; that constant bounds how far a backfill *attempt* reaches,
   it is never reused as the availability verdict.

**Readiness state** lives directly on `market_collections`
(`preparationStatus`: `pending → syncing_candles → building_backtest →
ready|partial|failed`, plus `preparedAt`/`preparationError`/
`membersWithRequiredHistory`/`membersUnavailable`) — informational/UI-facing
only, never a gate on any read path; a `pending`/`partial` collection's
already-generated data (if any) still reads normally everywhere else in
this doc.

**Staleness protection:** every membership import resets
`preparationStatus` to `pending` and stamps
`marketCollections.latestMembershipVersionId` with the
`market_collection_versions` row it just created (reusing that existing
versioning table's own identity — no parallel version concept). A
preparation run captures that id at start and re-checks it immediately
before its own final status write; if a newer import has superseded it in
the meantime, the run skips its final write entirely rather than marking
a stale membership `ready`. This is the only concurrency protection this
step needs — an old run's *work* isn't wasted-and-blocked, only its
*result* can never win.

**Trigger and job architecture:** `triggerCollectionPreparation` enqueues
`JOB_NAMES.collectionPrepare` on the existing `market-data` BullMQ queue
when `REDIS_URL` is configured (the only path used in production); with no
queue configured, it runs the same function in-process without blocking
the import request **only outside production** (`NODE_ENV !== "production"`,
a dev/test convenience) — in production with no queue, the row is simply
left `pending` and an admin can retry via `POST /api/admin/market-collections/:id/prepare`
once the queue is available, rather than ever running a potentially
10-year backfill detached inside the API process.

## Collection deletion (hard delete)

`deleteMarketCollection`/`bulkDeleteMarketCollections` in
`backend/src/modules/market-collections/market-collection-deletion.service.ts`
back `DELETE /api/admin/market-collections/:id` and
`POST /api/admin/market-collections/bulk-delete`. This is a hard delete —
deleting a collection removes only data it owns:

- `market_collection_members`, `market_collection_versions` (and their
  `market_collection_version_members`), and `weekly_strong_backtest_runs`
  (and their `weekly_strong_backtest_members`) all carry `ON DELETE CASCADE`
  back to `market_collections`, so one `DELETE FROM market_collections`
  removes the whole owned tree in a single atomic statement — no manual
  per-table deletes.
- `instruments` and `candles` are never touched: candles belong to
  instruments, not collections, and another collection sharing the same
  instrument is unaffected.
- `dashboard_metric_snapshots` isn't FK-linked (its `scopeKey` is an
  application-level string, not a foreign key), so the service explicitly
  calls the existing `invalidateCollectionSnapshots(id)` for each deleted
  collection. The in-process cache prefixes used elsewhere in this module
  (`collections:list`, `collectionMembers:`, `collectionRelativeStrength:`,
  `collectionWeeklyStrongStocks:`, `collectionWeeklyStrongBacktest:`) are
  invalidated the same way.
- A queued/delayed `collectionPrepare` BullMQ job for a deleted collection
  is removed best-effort (`removeQueuedCollectionPrepareJobs`); the actual
  safety net is `prepareCollectionData` itself, which now looks the
  collection up directly and no-ops (records a `stale` outcome, no writes,
  no throw) if the row is gone — so even an already-running or unremoved
  job can never fail noisily or write state for a deleted collection.

Bulk delete deduplicates ids server-side, caps a request at 500 ids, and
deletes every matched row in one `DELETE ... WHERE id IN (...)` statement —
already atomic as a single Postgres statement, so no explicit transaction
wrapper is needed. Ids that don't match an existing row are reported back
as `missingIds`/`missingCount` rather than failing the whole request.
Deletion works regardless of `preparationStatus` — there is no gate on it.
