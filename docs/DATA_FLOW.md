# Data Flow

Key flows, visualized. Each references the doc with full detail. See
[DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md) for the full frontend/
backend trust boundary — the short version, relevant to every flow below:

**Client-side filtering/sorting is allowed only over values the backend
already computed.**

| | Example |
|---|---|
| **SAFE** (frontend) | Sort an already-returned array of 55-day-change rows by value |
| **SAFE** (frontend) | Filter an already-returned stock list by sector/industry (Dashboard cross-filter) |
| **SAFE** (frontend) | Hide/show a chart overlay category, toggle a drawing's visibility |
| **NOT SAFE** (backend only) | Calculate Weekly Strong qualification |
| **NOT SAFE** (backend only) | Reproduce any evaluator condition |
| **NOT SAFE** (backend only) | Apply a proprietary threshold |
| **NOT SAFE** (backend only) | Derive a proprietary score |
| **NOT SAFE** (backend only) | Recreate a backtest decision |

The distinguishing question: does this operation just rearrange/hide rows
the backend already fully decided, or does it *decide* something the
backend hasn't already decided? The former is a UI concern; the latter is
a domain calculation and belongs server-side, full stop, regardless of how
small it looks in a component.

## Stock search → chart

```
User types in GlobalStockSearchModal / StockSearchCombobox
  → GET /api/market-data/stocks/search
  → user picks a result
  → setStockParams() → router.replace("/charts?symbol=X&exchange=Y")
  → ScannerPage's URL→store sync writes useScannerUiStore
  → useCandles() query fires (keyed on exchange:symbol:timeframe)
  → backend getChartCandles(symbol, exchange, timeframe):
        empty/split/missing-range?  → full provider backfill
        stale only?                 → incremental refresh (~14d window)
        fresh?                      → no provider call
  → 1D rows read from `candles` table
  → 1W/1M derived in-process (aggregateWeeklyCandles/aggregateMonthlyCandles)
  → ScannerChartStage renders via lightweight-charts
  → useMarketStream (WS) extends the tail of the same React Query cache
    entry as new ticks arrive (never replaces the series)
```
See [CHARTS.md](./CHARTS.md), [MARKET_DATA.md](./MARKET_DATA.md).

## Dashboard load

```
DashboardPage: country → segment (URL-synced, market_collections.code)
  → DashboardSegmentContent (key={code}, remounts per segment)
  → 4 parallel queries:
      - useIndexRelativeStrength         (scope: index_exchange)
      - useCollectionRelativeStrength    (scope: collection, ungrouped)
      - useCollectionRelativeStrength    (scope: collection, groupBy=sector)
      - useCollectionRelativeStrength    (scope: collection, groupBy=industry)
  → each reads dashboard_metric_snapshots (persisted)
      cache miss / version mismatch → computeAllRelativeStrengthMetrics()
        (55-day change %, current live membership) → persist → serve
  → 4 top widgets render (DashboardWidget)
  → cross-filter (sector/industry click) re-ranks the Stock widget's
    already-fetched rows client-side — no new backend call
  → SEPARATELY: WeeklyStrongStockTable fetches its own
    useCollectionWeeklyStrongStocks (the evaluator, not the 55-day metric)
  → SEPARATELY: WeeklyStrongBacktestSection fetches persisted
    weekly_strong_backtest_runs/_members (never computed live)
```
See [DASHBOARD.md](./DASHBOARD.md), [BACKTEST.md](./BACKTEST.md).

## Backtest generation → display

```
Admin → Market Collections → [collection] → "Generate" / "Rebuild Historical"
  → POST /api/admin/market-collections/:id/weekly-strong-backtest/generate|rebuild-historical
  → BullMQ job (or direct service call) →
      runWeeklyStrongBacktestBackfill / runWeeklyStrongBacktestHistoricalRebuild
  → resolves membership:
      current_membership    → market_collection_members (live)
      historical_membership → market_collection_version_members
                               (point-in-time, via getCollectionMembershipAt)
  → evaluator runs → weekly_strong_backtest_runs + _members persisted

Also, every ~30min (piggybacked on instrument-sync job):
  syncWeeklyStrongBacktestIncremental(exchange) — idempotent, only acts
  when a new week has actually closed

Read side (always persisted, never live-recomputed):
  GET /api/weekly-strong-backtest/:code           → stacked chart
  GET /api/weekly-strong-backtest/:code/:weekEnding → week detail
  → WeeklyStrongBacktestSection renders
```
See [BACKTEST.md](./BACKTEST.md).

## Auth — USER hostname

```
stockharvesting.com/login
  → "Continue with Google" → GET /api/auth/google/url (portal cookie unset)
  → Google OAuth round-trip
  → GET /api/auth/google/callback
  → completeGoogleLogin(code, "user")
      evaluatePortalAccess("user", role):
        role === "admin" → REJECTED, no session, redirect ?auth=admin-account-on-user-portal
        else             → createSession → sh_user_refresh cookie set
  → redirect to /charts (or safe ?next=)
  → AuthBootstrap (root layout) → POST /api/auth/refresh → access token in
    memory (token-store.ts) + useSessionStore
```

## Auth — ADMIN hostname

```
admin.stockharvesting.com/login
  → GET /api/auth/google/url?portal=admin (sets sh_oauth_portal=admin)
  → Google OAuth round-trip
  → GET /api/auth/google/callback
  → completeGoogleLogin(code, "admin")
      evaluatePortalAccess("admin", role):
        role !== "admin" → REJECTED, no session, redirect ?auth=not-admin-on-admin-portal
        else              → createSession → sh_admin_refresh cookie set
  → redirect to admin root (or safe ?next=)
  → AdminAuthBootstrap (admin/layout.tsx only) → POST /api/admin-auth/refresh
    → access token in memory (admin-token-store.ts) + useAdminSessionStore
```
Full detail, TTLs, and cookie attributes: [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md).
