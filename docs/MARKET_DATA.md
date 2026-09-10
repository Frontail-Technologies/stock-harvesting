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

## Instrument ensure flow

```
requested symbols → batched DB lookup → missing set → targeted provider search OR one full sync → batched re-query → existing fallback creation
```

`ensureInstrumentsForSymbols` (`market-data.instrument-sync.ts`) makes sure
an `instruments` row exists for every requested symbol:

1. One batched `getInstrumentsBySymbol` call finds which requested symbols
   already have a row.
2. If none are missing, it returns immediately — no provider call at all.
3. Otherwise it checks the exchange's `instrument_search`-capable provider
   **once**, then branches: if the provider supports targeted search, it
   searches each missing symbol individually; if not (e.g. Zerodha has no
   per-symbol search for NSE), it runs **one** full `syncProviderInstruments`
   pull for the whole exchange, never one per missing symbol.
4. A second batched lookup re-checks the originally-missing symbols.
5. Whatever's still unresolved goes through the existing fallback-instrument
   creation path, unchanged.

Step 3 is the reason this flow is safe to call with many missing symbols at
once: a provider without search capability is only ever asked for a full
sync a single time per `ensureInstrumentsForSymbols` call, regardless of
how many symbols triggered it.

## 1D freshness path — `getChartCandles`

`backend/src/modules/market-data/market-data.service.ts`. On every chart
read:

1. Read stored `1D` rows for `(exchange, symbol)` in the requested range.
2. If **empty**, has a **likely split discontinuity**
   (`hasLikelySplitDiscontinuity`), has a **suspicious history gap**
   (`hasSuspiciousHistoryGap` — two adjacent stored rows more than
   `MAX_EXPECTED_TRADING_GAP_DAYS` apart, comfortably wider than any real
   weekend/holiday cluster; catches a hole left by a symbol rename, since
   `getOrCreateInstrument` has no rename/alias resolution and a period
   synced under an old symbol never lands in the new symbol's row), or is
   **missing older history** than an explicitly requested `from`
   (`shouldBackfillRequestedHistory`) → **full historical backfill**
   (`runChartBackfillOnce` → `backfillDailyCandles`, a full-range provider
   fetch), then re-read.
3. **Else if** the latest stored row is older than
   `getLatestExpectedTradingDay(exchange)` (see below) →
   **`isLatestDailyCandleStale`** is true → **incremental refresh,
   fire-and-forget** (`runLatestCandleRefreshOnce` →
   `syncLatestDailyCandlesForSymbols`, a ~14-day provider window via the
   `latest_daily_candles` capability) — the currently-persisted rows are
   returned **immediately, without awaiting or re-reading**. The refresh
   still runs (self-healing is not removed) and lands for the *next* read of
   that symbol; `runLatestCandleRefreshOnce`'s own in-flight-promise map
   still dedupes concurrent refreshes the same as before, and
   `safeProviderAction` already swallows/logs any failure internally, so
   this can't produce an unhandled rejection. This is deliberately
   asymmetric with step 2: a stale-by-a-day symbol is still fully usable
   from stored data, so the request must not pay for a provider round-trip
   just to serve it; missing/discontinuous history is not usable, so step 2
   stays synchronous.
4. **Else** (fresh) → **no provider call at all**, serve straight from the
   DB.

This is the fix for a real historical regression (see
[REGRESSION_RULES.md](./REGRESSION_RULES.md)): **fresh stored daily data
must never trigger a full historical backfill.** Before this existed, the
read path had no freshness check at all — once a symbol had *any* history
it was served forever, stale or not, until something else happened to
refresh it. Do not reintroduce a "check freshness → full backfill" branch;
staleness must route to the incremental path only.

**Step 3 was synchronous (`await`ed) until a production incident: opening
an already-fully-bootstrapped chart could take ~8.5s TTFB with zero backend
issue other than this — the request was blocking on a real GlobalDataFeeds
round-trip for a single day's candle every time `isLatestDailyCandleStale`
was true, measured at 8.0–8.6s locally against the same 9s
`GLOBAL_DATAFEEDS_HISTORY_REQUEST_TIMEOUT_MS` this provider call uses.
Persisted candles are authoritative; a stale-by-a-day read should never
wait on a provider. Do not re-`await` this call — see the function's own
comment for why.**

## Stock search — zero-local-match provider fallback

`backend/src/modules/market-data/market-data.stocks.ts`, `listStocksUncached`.
When a search query (`q`) matches nothing locally, the code falls back to
`syncProviderInstrumentSearch` (GDF's `fetchInstruments` — the full exchange
instrument list, cached in-process for 30 minutes) to discover a
genuinely-new-but-not-yet-synced symbol. This fallback is **fire-and-forget**
for the same reason as the freshness refresh above: a local miss is the
*common* case for interactive search (typos, partial input, symbols that
don't exist) and must not block the response — an empty result now is
accurate, and a real discovery lands in the background for the *next*
search of the same term. This was also `await`ed until a production
incident: with a cold provider-instrument cache, this call has no bound
short of the GDF client's own default 30s timeout, and was measured hanging
the public search endpoint for 15s+. Do not re-`await` this call, and do
not add a synchronous price-hydration step after it — the next search that
finds the newly-discovered row already goes through the normal
`rowsMissingPrices` hydration path further down this same function.

### In-flight dedup

- `chartBackfillPromises` (keyed `exchange:symbol:from:to`) + a completion
  cooldown (`completedChartBackfillAtByKey`) — collapses concurrent full
  backfills and avoids re-triggering one that *just* finished.
- `latestCandleRefreshPromises` (keyed `exchange:symbol`) — collapses
  concurrent incremental refreshes.

Both are in-process `Map`s (module state) — correct for the current
single-API-process topology (see `docs/DEPLOYMENT.md`); would need a
distributed lock if the API is ever horizontally scaled.

### History-gap retry cooldown

A genuinely long trading suspension (regulatory action, a delisted-then-
relisted instrument) can legitimately exceed `MAX_EXPECTED_TRADING_GAP_DAYS`
too, so `hasSuspiciousHistoryGap` can fire on data the provider has no way
to fill — an accepted false positive, not a correctness bug.
`shouldRetryHistoryGapBackfill`/`markHistoryGapBackfillAttempted`
(`HISTORY_GAP_BACKFILL_RETRY_COOLDOWN_MS`, keyed `exchange:symbol` only —
deliberately not the date-range key the in-flight dedup above uses, since
that key includes "today" and would never actually throttle a
daily-repeating gap) bound the resulting cost to at most one full-history
provider fetch per instrument per day even when the gap can never close.

Constants for both of the above (`MAX_EXPECTED_TRADING_GAP_DAYS`,
`HISTORY_GAP_BACKFILL_RETRY_COOLDOWN_MS`), plus the backfill/refresh
in-flight cooldowns above (`COMPLETED_CHART_BACKFILL_COOLDOWN_MS`,
`FAILED_LATEST_CANDLE_SYNC_COOLDOWN_MS`) and `SUPPORTED_EXCHANGES_CACHE_TTL_MS`,
live in `market-data.constants.ts` — the freshness/retry/cache policy
values for this module, kept separate from the orchestration functions
that read them (still in `market-data.service.ts`/`market-data.candle-sync.ts`,
unchanged this phase).

## Supported exchange discovery — `listSupportedExchanges`

`backend/src/modules/market-data/market-data.service.ts`. NSE and BSE are
only ever advertised (in `GET /api/market-data/exchanges`, which drives
every exchange picker including the global stock search modal) when they
are genuinely usable, not merely "not explicitly disabled":

- **NSE**: `isProviderEnabled(zerodha)` **and** Zerodha actually connected
  (`getProviderStatus(zerodha).connected` — the same canonical
  connection-state check the admin Data Providers page itself uses, not a
  duplicated OAuth check) **and** at least one active `provider = 'zerodha'`
  instrument row exists for `NSE`.
- **BSE**: `isProviderEnabled(global-datafeeds)` **and** at least one
  active `provider = 'global-datafeeds'` instrument row exists for `BSE`.
  No connection check — GlobalDataFeeds is a server-side API-key provider
  (`requiresConnection: false`), not OAuth.
- `BSE_IDX` is intentionally **not** gated by this — it's index data with
  its own, separately-audited population semantics, out of scope here.

`isProviderEnabled` defaults to `true` when an admin has never touched the
provider's settings row — it says nothing about whether the provider was
ever actually connected or synced. Before this existed, `listSupportedExchanges`
advertised NSE whenever Zerodha was merely enabled (the default), even in
an environment where Zerodha was never connected and zero NSE instruments
existed — production offered NSE in every exchange picker while
`/stocks/search?exchange=NSE` silently returned nothing. The global search
modal (`GlobalStockSearchModal.tsx`) defaults its India-exchange filter to
`indiaExchanges[0].code`, and NSE was always listed before BSE, so this
also meant the search modal silently defaulted to a dead exchange in that
environment — fixed here with no frontend change needed, since the
frontend already just defers to whatever this function reports.

Any failure to determine Zerodha's connection state (the `getProviderStatus`
call throws) is treated as "not connected" — ambiguous must never advertise
a possibly-empty exchange. The instrument-existence check
(`hasActiveInstruments`, `market-data.instruments.ts`) is deliberately a
plain existence check, not routed through `buildStockFilters`/`countStockRows`
— those apply search-listing shaping (price > 0 unless `includeUnpriced`,
move filters) that would under-report availability for a freshly-synced,
not-yet-priced instrument.

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
`exchanges` table modeling holidays anywhere). The same limitation applies
to the week-ending helpers below: there is no holiday-aware distinction
between a canonical `weekEnding` (always a Friday) and an actual
`lastTradingDate` — if a market holiday ever fell on a Friday, this
codebase does not model that separately, since no holiday calendar exists
to derive it from.

## Canonical weekly identity — `weekEnding` (Friday)

Also in `trading-calendar.ts`, alongside `getLatestExpectedTradingDay`.
These exist so that **every** feature with a weekly concept (Dashboard
Harvest Results, Weekly Stock In/Out, Backtest) derives the same week
label the same way, instead of each computing its own Monday/Friday
conversion:

- **`getIsoWeekRange(dateStr)`** — the Monday-Sunday (UTC) bounds of the
  ISO week containing `dateStr`. Used to match a stored date that could
  fall on any weekday against the week it belongs to (see "Why weekly
  candles aren't Friday-keyed" below) — internal query-matching machinery,
  never itself shown to a user.
- **`getWeekEndingFriday(dateStr)`** — the canonical, product-facing label
  for `dateStr`'s ISO week: that week's Friday. A pure relabel — does not
  imply the week is complete (see `isCompletedTradingWeek` above for that).
- **`resolveCompletedWeekEndingFromTradingDay(latestExpectedTradingDay)`** —
  given an already-computed `getLatestExpectedTradingDay` result, returns
  the Friday of the **latest fully completed** week, consistent with
  `isCompletedTradingWeek`'s conservative rule (a week isn't "complete"
  until evaluation has moved into the following ISO week — see above). Pure
  and stateless: safe to apply to an **already-persisted** daily marker at
  read time without ever claiming a more recent week than what the
  original computation used (it reproduces exactly what a fresh
  `resolveLatestCompletedWeekEnding` call would have returned at the time
  that marker was written).
- **`resolveLatestCompletedWeekEnding(exchange, at = new Date())`** —
  convenience wrapper: `resolveCompletedWeekEndingFromTradingDay(getLatestExpectedTradingDay(exchange, at))`.

### Why weekly candles aren't Friday-keyed

`aggregateWeeklyCandles` (candle-aggregation) stores a weekly candle's
`time` as the **first actual trading day of its ISO week** — normally
Monday, but it shifts if Monday wasn't a trading day for that symbol. This
is a deliberate aggregation convention, not a bug, and it is **not**
changed by the helpers above. Anything that needs a user-facing week
label converts that stored value through `getWeekEndingFriday` at the read
boundary instead — see [BACKTEST.md](./BACKTEST.md) for where this
matters for `weekly_strong_backtest_runs.weekEnding`.

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

### Stream subscription instrument resolution

```
subscribe(symbols) → resolveInstrumentsForSymbols(symbols) → provider token/identifier mapping → subscribe
```

Both realtime providers that need a DB-side instrument lookup — Kite
(`providers/kite-market-stream.provider.ts`, NSE only) and GlobalDataFeeds
(`providers/global-datafeeds-market-stream.provider.ts`, BSE + BSE_IDX) —
resolve their whole batch of subscribed symbols through one shared call,
`resolveInstrumentsForSymbols` (`market-data.instruments.ts`): one query
per distinct exchange in the batch, not one query per symbol. It groups
the requested `(exchange, symbol)` pairs by exchange, runs the existing
single-exchange batch lookup (`getInstrumentsBySymbol`) once per group,
and returns a `Map` keyed `exchange:symbol` — the same key shape
`market-stream.utils.ts`'s `streamSymbolKey` already uses. In practice
this is one query for Kite (always NSE) and at most two for GlobalDataFeeds
(BSE and/or BSE_IDX in the same batch).

Provider responsibility stays provider-specific: Kite maps a resolved row
to its numeric `instrumentToken` and skips (logs once, doesn't fail the
batch) a symbol with no usable token; GlobalDataFeeds maps to its own
`instrumentIdentifier` string and falls back to the raw symbol when no row
resolves, matching each provider's existing behavior from before this
change.

## Collection preparation's candle coverage check

`findSymbolsNeedingHistoryBackfill` (`market-data.candles.ts`) is a bulk,
grouped-by-symbol variant of `readCandleHistoryRange`'s "earliest stored
candle" read, used only by collection preparation
(see [BACKTEST.md](./BACKTEST.md) "Collection data preparation") to decide
which of a collection's members are worth attempting a backfill for. It
answers "is a backfill attempt worth making," never "is this instrument's
history complete" — that verdict is the evaluator's own
`hasSufficientWeeklyStrongHistory`, not a calendar-age check.

Its query is an unbounded `min(time)` GROUP BY (no time filter — that's
semantically required: the `earliest > requiredFromDate` check needs the
true earliest, not a windowed one), so it scans every hypertable chunk a
symbol has data in. It runs in sequential batches of
`CANDLE_COVERAGE_SYMBOL_BATCH_SIZE` symbols and **fails closed** — any
batch error propagates, it is never read as "no symbol has history"
(indistinguishable from "every symbol needs backfill"). The larger
`readMetricCandles` history read (behind `readDailyAndWeeklyMetricCandles`
→ `computeWeeklyStrongBacktestMembers` / RS metrics) batches at
`CANDLE_READ_SYMBOL_BATCH_SIZE` and adds a `time <= today` upper bound so
the planner isn't left with an open-ended range. Both changes came from a
production incident where a ~250-symbol collection ("BSE 250 MICROCAP")
hit the 30s DB statement timeout on both queries; batching bounds each
query's cost, and the merged rows plus their `(symbol, time)` order are
identical to the pre-batch single query.

**`refreshAllLatestInstrumentPrices`'s universe is deliberately unchanged**
by collection preparation — it still refreshes every active instrument per
exchange, not a collection-member subset. `price-alerts.service.ts` and the
general `/stocks` browse/search (`listStocks`) both depend on freshness for
the *full* active universe, not just collection members; narrowing this
job's scope would silently regress those two features. It already runs
before `syncWeeklyStrongBacktestIncremental` inside the same scheduled
`instrumentSync` job, so collection members are already fresh by the time
that incremental step runs — no separate "collection instruments only"
refresh was needed or added.

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
