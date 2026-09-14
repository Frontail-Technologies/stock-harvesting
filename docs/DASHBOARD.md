# Dashboard

`src/app/(app)/dashboard/page.tsx` → `src/features/dashboard/components/DashboardPage.tsx` →
`DashboardSegmentContent.tsx` (the actual per-segment content, reused
directly, no route of its own beyond the unified page).

**This document covers TWO deliberately separate systems that live on the
same page. Do not conflate them:**

| | TOP DASHBOARD METRICS | WEEKLY STRONG (table + backtest) |
|---|---|---|
| What | 4 top widgets: Index / Sector / Industry / Stock | Detailed table below the widgets, plus its own Backtest section |
| Metric | 55-day change % (see below) | A separate, proprietary breakout evaluator — see [BACKTEST.md](./BACKTEST.md) |
| Backend function | `computeAllRelativeStrengthMetrics` (`market-data.service.ts`) | `computeWeeklyStrongStocks` / the evaluator in `weekly-strong-evaluator.ts` |
| Changing one | Never changes the other | Never changes the other |

## Country / segment state

`DashboardPage.tsx` owns country + segment selection (URL-synced query
params, exact param names live in that file — check it directly rather
than assuming). Segment = a `market_collections` row's `code`. Changing
segment remounts `DashboardSegmentContent` (`key={code}`), which resets
all per-segment local state (cross-filter, Backtest's own sector filter)
for free — no manual reset effects needed.

## Collection membership

See [MARKET_DATA.md](./MARKET_DATA.md) is candle-level; membership itself
is `market_collection_members` (current/live) vs
`market_collection_versions` + `market_collection_version_members`
(immutable point-in-time snapshots) — see `backend/src/modules/
market-collections/market-collection-versions.service.ts`. **The 4 top
widgets always use current live membership** (`getActiveMemberInstrumentRows`)
— they are not point-in-time. Point-in-time membership only matters for
Weekly Strong Backtest's `historical_membership` mode (see
[BACKTEST.md](./BACKTEST.md)); do not blend the two membership modes.

## Top 4 widgets — architecture

Single canonical base computation: `computeAllRelativeStrengthMetrics(instrumentRows, exchange)`
(`backend/src/modules/market-data/market-data.service.ts`). Called once per
invalidation cycle by `dashboard-snapshots.service.ts`
(`getOrComputeCollectionRelativeStrengthBase` for the collection-scoped
Sector/Industry/Stock widgets, `getIndexRelativeStrength` for the
Index widget) and persisted to `dashboard_metric_snapshots`
(`scopeType: "collection" | "index_exchange"`, `metricType: "relative_strength"`).
Reads (`getCollectionRelativeStrength`, `getIndexRelativeStrength`) serve
the persisted snapshot; only a cache miss (never generated, or just
invalidated) recomputes inline.

**Current metric (all 4 widgets): 55-day change %** — the same field
name/value the product UI itself labels and displays (not a secret; see
[DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md)). 55 Day Change is
calculated **server-side** from canonical daily trading-session candles
(not calendar days). The canonical implementation is `calculate55DayChange`
in `backend/src/modules/market-data/market-data.service.ts`, unit-verified
against real symbols during the metric's own implementation pass — **the
backend implementation and its tests are the source of truth**, not this
document. Don't re-derive or restate the exact arithmetic here; if you
need it, read the function.

This is the **only** metric feeding all 4 top widgets — no MACD, no
monthly-change blend, no near-multi-year-high pre-filter. (An earlier
version of this pipeline did apply a near-high pre-filter and a partial
MACD/monthly blend; that was removed — see git history if you need the
old shape, but treat the current single-metric behavior as the intended
design, not a regression to "fix" back.)

| Widget | Ranking | Function |
|---|---|---|
| Relative Strength Index | Indices ranked by their own 55-day change % | `getIndexRelativeStrength` |
| Relative Strength Sector | Sectors ranked by **mean** 55-day change % of member stocks | `groupRelativeStrengthMetrics(..., "sector")` |
| Relative Strength Industry | Same, grouped by industry | `groupRelativeStrengthMetrics(..., "industry")` |
| 55 Day Stock Strength (4th widget) | Individual stocks ranked by 55-day change % | Same base metrics array, `pickTopRelativeStrengthRows` |

The 4th widget is titled **"55 Day Stock Strength"** — it was previously
sourced from the Weekly Strong evaluator and titled "Weekly Strong Stock
List"; that coupling was removed on purpose (see next section). Do not
rename it back or re-couple it to the evaluator.

## Cross-filter behavior

`src/features/dashboard/lib/dashboard-cross-filter.ts` — a small local
state machine (`CrossFilterState = {selectedSector, selectedIndustry}`),
owned by `DashboardSegmentContent.tsx`, reset on segment change. Clicking a
Sector/Industry row selects it (click again to clear); selecting an
industry always resolves/carries its own parent sector. The Industry
widget's *visible rows* narrow to the selected sector's industries; the
Sector widget itself never narrows (only highlights). The 4th (Stock)
widget's *rows* narrow to the cross-filter selection and **re-rank by
55-day change % only** — no Weekly Strong evaluation ever runs as part of
this filtering. The Relative Strength **Index** widget is never affected
by the cross-filter (it's a global market reference, not scoped to the
segment).

The detailed Weekly Strong table below has its **own**, independent
cross-filter application over its own (Weekly-Strong-evaluator-sourced)
data — same `filterWeeklyStrongByCrossFilter` function, generic over any
`{sector, industry}`-shaped item, applied to two different arrays. Sharing
the filter function is fine; sharing the underlying data source is not —
they must stay separate arrays.

## As-of date

Every widget shows the **real** trading day its underlying snapshot was
computed as of (`asOfDate` on the API response, threaded from
`dashboard_metric_snapshots.asOfDate`, computed via
`getLatestExpectedTradingDay` — see [MARKET_DATA.md](./MARKET_DATA.md)),
not a client-rendered "now" timestamp. Each of the 4 widgets shows its
*own* query's `asOfDate` rather than one assumed-shared value — if two
ever genuinely diverge (a rare cross-scope invalidation timing gap),
that's visible on the widgets, not silently hidden.

**This `asOfDate` is deliberately left as a daily marker, not converted to
a Friday.** The 4 top widgets are a **daily** 55-day rolling metric (see
the table at the top of this doc) — "As of {date}" already means exactly
what it says: the latest daily session the ranking was computed from.
Converting it to a week-ending Friday would misrepresent what the metric
actually is. Do not force these onto the canonical `weekEnding` below;
they are a genuinely different cadence, confirmed by reading
`computeAllRelativeStrengthMetrics`'s own "only daily candles are needed"
comment.

The page's own top-of-page timestamp ("Last refreshed {date, time}",
`DashboardPage.tsx`) is a third, unrelated concept again: it's
`dataUpdatedAt` from React Query — a client-side fetch marker, not a
trading-day or week-ending value at all. It answers "when did my browser
last hear from the API," nothing more. Labeled "Last refreshed" rather
than "Updated" specifically to avoid being read as a Harvest-week date.

## Canonical weekly identity

The **Weekly Strong** system (Harvest Results table, In/Out tables,
Backtest — the right-hand column of the table at the top of this doc) is a
genuinely different cadence from the daily `asOfDate` above: it operates
on **completed weekly candles**, so its date identity is a canonical
**week-ending Friday**, not a daily marker. `CollectionWeeklyStrongStocksResponse.weekEnding`
(`getOrComputeWeeklyStrongSnapshot` → `resolveCompletedWeekEndingFromTradingDay`,
`trading-calendar.ts` — see [MARKET_DATA.md](./MARKET_DATA.md)) replaces
the old ambiguous `asOfDate` field on this one response; it is derived
from the already-persisted daily marker at the read boundary, so no new
column or migration was needed, and it can never claim a more recent week
than what the underlying computation actually used.

Same conversion applies to each row's own `inSince` field (Harvest Results
table, "In Since" column) - always a canonical week-ending Friday, never a
raw persisted candle date.

**`inSince` tracks the Scanner signal (the chart's yellow band), not
Weekly Strong's own streak — a deliberate product requirement, not an
oversight.** `resolveScannerInSince` (`market-data.metrics.ts`) reuses the
exact same evaluator chain the Charts page's live per-symbol Scanner
endpoint calls (`calculateCurrentNear250WeekHighResult` →
`deriveScannerWeeklyCloses` → `excludeIncompleteTradingWeek` →
`classifyScannerWeeklySeries` → `calculateNear250WeekHighScan`,
`modules/scanner/*`), fed from the daily rows already fetched for this
row rather than a second per-symbol DB round trip — zero reimplementation
of the Scanner formula, only a different data-fetch entrypoint into the
identical chain. Fixed at the 5x/250-week tier
(`SCANNER_LOOKBACK_WEEKS["5x"]`) since Harvest Results has no
per-collection tier setting (the Charts page's own 1x/3x/5x selector is a
per-view UI choice, not a stored property) and 250 weeks is this system's
own `DEFAULT_SCANNER_LOOKBACK`. The current streak's first passing week is
found by walking `scan.highlightTimes` backward with the same
`isConsecutiveIsoWeek` gap-adjacency check `findCurrentStreakEntryIndexGapAware`
(below) uses, so a real calendar gap in the underlying candle history can't
be silently bridged into a longer streak than the data supports either.
`resolveScannerInSince` also guards a real Scanner-side edge case:
`calculateNear250WeekHighScan`'s own `matched` can fall back to a smaller
lookback tier when the latest segment is short
(`getEffectiveScannerLookbackWeeks`), but its `highlightTimes` always
evaluates every segment at the full requested (250-week) lookback
unreduced — when the latest segment is too short for that, its own
passing weeks never reach `highlightTimes` even though `matched` is true.
Returns `null` in that case rather than reporting an unrelated older
segment's trailing date.

Harvest Results **inclusion** and `returnPct` are unaffected by this — they
still come from Weekly Strong's own evaluator (below); only the `inSince`
date label switched source. `findCurrentStreakEntryIndexGapAware`
(`market-data.metrics.ts`) wraps the evaluator's own
`findCurrentStreakEntryIndex` with the same real calendar-adjacency check
(`isConsecutiveIsoWeek`, `trading-calendar.ts`) so a week structurally
missing from a symbol's series (a candle-history gap, not an explicit
evaluator fail) can never be silently bridged into a longer streak than the
data actually supports — it changes only how far back "continuous" is
allowed to reach, never which weeks the evaluator itself passes or fails.
It still powers `returnPct`'s own entry point.

**One authoritative completed-week series decides both membership and In
Since.** `computeWeeklyStrongStocks` used to gate Harvest Results
inclusion with a separate `evaluateWeeklyStrongLatest` call against
today's freshest daily close, while `inSince` came from
`evaluateWeeklyStrongSeries`'s own last entry — the two could disagree
(today's still-open daily movement passing while the latest COMPLETED
week itself did not), producing a row that appeared "qualified" with
`inSince: null`. Harvest Results is a completed-week dashboard, so
inclusion is now decided from `evaluateWeeklyStrongSeries`'s own last
entry (the latest completed week) directly — the same series `inSince`
walks backward through — making that combination structurally
impossible. `evaluateWeeklyStrongLatest` still exists (its own tests
still cover it) but is no longer called from this path; today's
still-forming daily movement never adds a stock to this dashboard.
Weekly Strong's qualification conditions/thresholds themselves are
unchanged — only which pre-computed series decides "is this the
current signal."

**Weekly Strong's analytical value is always the weekly CLOSE, never the
weekly high.** `MetricCandle` (the shared candle-fetch shape) carries a
full OHLC row including `.high`, but every weekly evaluator path —
`evaluateWeeklyStrongSeries`/`evaluateWeeklyStrongLatest`
(`weekly-strong-evaluator.ts`, operating on `WeeklyStrongCandle =
{time, close}`) and Scanner's own independent rule
(`evaluateScannerWeeklySeries`, `scanner-weekly-rule.ts`, operating on
`ScannerWeeklyCandle = {time, close}`) — only ever consumes `.close`.
`.high` is present on the candle for chart/OHLC display purposes only
and is never read analytically.

`WeeklyStrongMembershipChanges.tsx` ("Stocks In This Week" / "Stocks Out
This Week") compares this same canonical `weekEnding` against the
Backtest's `previousWeekEnding` for the "vs {date}" line — both resolved
through the same shared helper, never a client-side Monday/Friday
computation. See [BACKTEST.md](./BACKTEST.md) "Canonical week-ending
Friday" for how the Backtest's own persisted (Monday-ish) `weekEnding`
column is converted at its own API boundary.

## Persisted snapshots — invalidation

`dashboard_metric_snapshots` rows are versioned via an `evaluatorVersion`
tag (`RELATIVE_STRENGTH_SNAPSHOT_VERSION` in `dashboard-snapshot-store.ts`)
— a stored row whose version doesn't match the current constant is treated
as a miss and recomputed automatically on next read (self-healing after a
formula change, no manual migration needed). Real invalidation triggers:
a confirmed data sync (`refreshAllLatestInstrumentPrices` →
`invalidateDashboardSnapshotsForExchange`, which invalidates both
`collection`- and `index_exchange`-scoped snapshots for that exchange
together) and confirmed collection imports
(`importCollectionCsv` → `invalidateCollectionSnapshots`). **Do not
recompute these on every page render** — the whole point of this store is
one expensive computation per invalidation cycle, not per request.

## Weekly Strong detailed table

`WeeklyStrongStockTable.tsx` — fully independent: its own
`useCollectionWeeklyStrongStocks({code})` fetch, own cross-filter
application, own row rendering. **Never** touch this component while
changing the top 4 widgets; the reverse is also true. See
[BACKTEST.md](./BACKTEST.md) for the evaluator and backtest relationship.

## Backtest relationship

`WeeklyStrongBacktestSection.tsx` is rendered below the table, `key={code}`
remounted per segment (its own period/sector-filter/selected-week state
resets on segment change — a **separate** state system from the top-widget
cross-filter above; they never read from or write to each other). See
[BACKTEST.md](./BACKTEST.md) for the full architecture.

## Stock row → Charts navigation

Every dashboard place that opens the Charts page for a clicked stock —
the top 4 widgets (`DashboardSegmentContent.tsx`), Harvest Results
(`WeeklyStrongStockTable.tsx`), Stocks In/Out
(`WeeklyStrongMembershipChanges.tsx`), and the Backtest week-detail table
(`WeeklyStrongBacktestSection.tsx`) — opens `/charts?symbol=...&exchange=...`
in a **new browser tab** via the shared `openChartInNewTab`
(`src/features/dashboard/lib/open-chart-in-new-tab.ts`,
`window.open(url, "_blank", "noopener,noreferrer")`) rather than
navigating the dashboard tab away. All four previously used
`router.push` (a same-tab SPA navigation); that import/usage was removed
from each component along with it.
