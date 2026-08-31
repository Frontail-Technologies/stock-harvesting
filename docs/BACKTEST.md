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

## Generation / rebuild

`backend/src/modules/weekly-strong-backtest/weekly-strong-backtest.service.ts`:

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

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/weekly-strong-backtest/:code` | Stacked-by-week chart data — **always reads persisted runs**, never runs the evaluator live |
| `GET` | `/api/weekly-strong-backtest/:code/:weekEnding` | Week detail (member list) |
| `GET` | `/api/admin/market-collections/:id/weekly-strong-backtest/status` | Admin status |
| `GET` | `/api/admin/market-collections/:id/weekly-strong-backtest/historical-status` | Admin historical status |
| `POST` | `/api/admin/market-collections/:id/weekly-strong-backtest/generate` | Trigger backfill |
| `POST` | `/api/admin/market-collections/:id/weekly-strong-backtest/rebuild-historical` | Trigger historical rebuild |

## Frontend

- `src/features/weekly-strong-backtest/*` — `api/`, `hooks/use-weekly-strong-backtest.ts`
  (`useWeeklyStrongBacktestStacked`, `useWeeklyStrongBacktestWeekDetail`,
  1-hour `staleTime` — data only changes on weekly generation or an admin
  rebuild), `types.ts`.
- `src/features/dashboard/components/WeeklyStrongBacktestSection.tsx` —
  the actual chart/detail UI, embedded in the Dashboard page,
  `key={code}` remounted per segment. Its own period/sector-filter/
  selected-week state is a **separate** state system from the Dashboard's
  top-widget cross-filter — see [DASHBOARD.md](./DASHBOARD.md).

## Invariant

**Persisted backtests must not be recomputed during normal page render.**
Every read path above serves stored `weekly_strong_backtest_runs`/
`_members` rows; generation only happens via the explicit admin triggers
or the piggybacked incremental sync job, never as a side effect of a GET
request.
