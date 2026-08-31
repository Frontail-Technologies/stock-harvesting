# Market Data

The candle storage/freshness/provider layer. Pairs with
[PROVIDERS.md](./PROVIDERS.md) (adapter roster) and
[docs/DATABASE.md](../docs/DATABASE.md) (schema/index details). Core file:
`backend/src/modules/market-data/market-data.service.ts` (large — this doc
points at named functions rather than line numbers, which drift).

## Canonical candle storage

- Table: `candles` (`backend/src/db/schema/market-data.ts`). Uniqueness key:
  `(exchange, symbol, timeframe, time)` — **string-keyed**, not
  `instrument_id`-keyed, even though `instrument_id` exists on every row.
  Every read/write path agrees on this string key by convention.
- `timeframe` is a real Postgres enum: `1D` / `1W` / `1M`. **No intraday
  timeframe exists anywhere in this codebase.**
- `time` is a plain `date` (no time-of-day/timezone) — correct only because
  nothing intraday is stored.
- Only `1D` candles are ever fetched from a provider or persisted for `1W`/
  `1M` in the legacy sense — see "1W/1M derivation" below; the modern chart
  read path derives weekly/monthly **in-process** from stored daily rows,
  it does not read separately-stored `1W`/`1M` rows except as a legacy
  fallback (see `getChartCandles`, the `legacyRows` branch, for symbols
  that predate the derive-on-read change).

## Symbol/exchange identity

`instruments` table identity is **`(exchange, symbol)`** — symbol is never
assumed globally unique across exchanges (e.g. `TCS` exists independently
under both `NSE` and `BSE`). A second, independent unique constraint,
`(provider, instrument_token)`, tracks vendor identity. Every service
function that takes a symbol also takes (or defaults) an `exchange`.
`normalizeSymbol()` (`market-data.service.ts`) is applied to every incoming
symbol before any DB read/write.

## 1D freshness path — `getChartCandles`

`backend/src/modules/market-data/market-data.service.ts`. On every chart
read:

1. Read stored `1D` rows for `(exchange, symbol)` in the requested range.
2. If **empty**, has a **likely split discontinuity**
   (`hasLikelySplitDiscontinuity`), or is **missing older history** than an
   explicitly requested `from` (`shouldBackfillRequestedHistory`) →
   **full historical backfill** (`runChartBackfillOnce` →
   `backfillDailyCandles`, a full-range provider fetch), then re-read.
3. **Else if** the latest stored row is older than
   `getLatestExpectedTradingDay(exchange)` (see below) →
   **`isLatestDailyCandleStale`** is true → **incremental refresh only**
   (`runLatestCandleRefreshOnce` → `syncLatestDailyCandlesForSymbols`, a
   ~14-day provider window via the `latest_daily_candles` capability), then
   re-read.
4. **Else** (fresh) → **no provider call at all**, serve straight from the
   DB.

This is the fix for a real historical regression (see
[REGRESSION_RULES.md](./REGRESSION_RULES.md)): **fresh stored daily data
must never trigger a full historical backfill.** Before this existed, the
read path had no freshness check at all — once a symbol had *any* history
it was served forever, stale or not, until something else happened to
refresh it. Do not reintroduce a "check freshness → full backfill" branch;
staleness must route to the incremental path only.

### In-flight dedup

- `chartBackfillPromises` (keyed `exchange:symbol:from:to`) + a completion
  cooldown (`completedChartBackfillAtByKey`) — collapses concurrent full
  backfills and avoids re-triggering one that *just* finished.
- `latestCandleRefreshPromises` (keyed `exchange:symbol`) — collapses
  concurrent incremental refreshes.

Both are in-process `Map`s (module state) — correct for the current
single-API-process topology (see `docs/DEPLOYMENT.md`); would need a
distributed lock if the API is ever horizontally scaled.

## "Latest expected trading day"

`backend/src/modules/market-data/trading-calendar.ts` —
`getLatestExpectedTradingDay(exchange, at = new Date())`:

- Timezone-aware per exchange (`Asia/Kolkata` for `NSE`/`BSE`-prefixed
  exchanges, `America/New_York` fallback for everything else — **not** a
  real per-market timezone table, just enough to stop treating every
  exchange as UTC-midnight).
- Skips weekends.
- "Today" only counts once that exchange's market-close time has passed;
  otherwise the previous trading day is still the latest complete one.

**Known limitation (deliberate, documented in the file's own header):**
**no holiday calendar** — a market holiday (Diwali, Thanksgiving, etc.)
will be treated as a normal trading day, so a chart can appear "stale
according to the calendar" one day past a holiday when the provider simply
has nothing new. This does not cause a full backfill (staleness only ever
triggers the incremental path, which is cheap and safe even when it finds
nothing new) — it's a UX/perceived-freshness gap, not a data-corruption
risk. See `docs/DATABASE.md`'s note on the same gap (there is no
`exchanges` table modeling holidays anywhere).

## Provider fallback/resolution

`getEligibleProviderAdapter({ exchange, capability })`
(`backend/src/modules/data-provider/*`) picks a provider adapter by
exchange + required capability (e.g. `latest_daily_candles`,
`instrument_sync`). See [PROVIDERS.md](./PROVIDERS.md) for the adapter
roster and priority mechanism.

## Realtime

A WebSocket stream (`backend/src/modules/market-stream/*`,
`ws://.../ws/market`) exists for live quote updates while Charts is open —
see [CHARTS.md](./CHARTS.md) for the frontend side. This is a **separate
concern from candle storage**: realtime quotes update the chart's
in-memory latest price/candle display, they are not what keeps stored
daily candles fresh (that's entirely the `getChartCandles` path above,
which runs on every chart *load*, independent of whether a realtime
connection is live).

## Scheduled synchronization

`backend/src/modules/jobs/queues.ts` schedules one repeatable BullMQ job
per exchange (`instrument-sync`, every 30 minutes — which also refreshes
latest prices), consumed by the separate `backend/src/worker.ts` process.
**This scheduled path requires `REDIS_URL`** — with it unset, the
scheduling call no-ops and no automatic sync ever runs. Admin-triggered
syncs (Admin → Data Providers → "Sync Instruments"/"Sync Prices") are a
*different* code path with its own inline fallback: they run inline in
the API request when `REDIS_URL` is unset, and get enqueued for the
worker when it's set. See [ARCHITECTURE.md](./ARCHITECTURE.md) "BullMQ /
background jobs" for the full per-operation table — the two paths behave
differently and shouldn't be assumed identical.

## What this doc deliberately does NOT cover

Any per-stock analytical scoring (55-day relative strength, the Weekly
Strong breakout evaluator, backtest qualification) — those are documented
in [DASHBOARD.md](./DASHBOARD.md) and [BACKTEST.md](./BACKTEST.md), kept
separate from this file on purpose since they're a different layer built
on top of the candle data described here, and this file is meant to stay
safe to point a public-facing contributor at.
