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
