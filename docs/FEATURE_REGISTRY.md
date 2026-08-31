# Feature Registry

Status + location of every major feature. "Status" is `live`, `disabled in
production`, or `dead/orphaned` (route exists but always redirects and no
other code imports its components).

## Charts (product name; internal folders still say "scanner")

- **Status**: live, primary USER-portal surface.
- **Frontend**: `src/features/scanner/*` (~35 components), route
  `/charts` (`src/app/(app)/charts/page.tsx`).
- **Backend**: `backend/src/modules/market-data/*` (candles),
  `backend/src/modules/scanner/*` (scan rules/runs/results),
  `backend/src/modules/drawings/*`, `backend/src/modules/price-alerts/*`,
  `backend/src/modules/market-stream/*` (realtime).
- **Main hooks**: URL↔store sync in `ScannerPage.tsx`,
  `useScannerUiStore`, `useMarketStream`.
- **Main APIs**: `/api/market-data/*`, `/api/scanner/*` (scans + drawings),
  `/api/price-alerts/*`, `/ws/market`.
- **Depends on**: Global Search (symbol selection), Watchlists (in-chart
  panel), PWA/Push (alert notifications).
- **Detail**: [CHARTS.md](./CHARTS.md).

## Dashboard

- **Status**: live in development, **redirects to `/charts` in
  production** (`IS_PRODUCTION_LOCKDOWN`). See
  [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).
- **Frontend**: `src/features/dashboard/*`, route `/dashboard`.
- **Backend**: `backend/src/modules/market-data/*`
  (`computeAllRelativeStrengthMetrics`, dashboard-snapshot store),
  `backend/src/modules/market-collections/*`,
  `backend/src/modules/weekly-strong-backtest/*`.
- **Main hooks**: `useCollectionRelativeStrength`, `useIndexRelativeStrength`,
  `useCollectionWeeklyStrongStocks`, `useWeeklyStrongBacktestStacked`.
- **Main APIs**: `/api/market-collections/:code/relative-strength`,
  `/api/market-data/index-relative-strength`,
  `/api/weekly-strong-backtest/*`.
- **Depends on**: Market Collections (membership), Backtest (its own
  section within the page).
- **Detail**: [DASHBOARD.md](./DASHBOARD.md).

## Watchlists

- **Status**: live.
- **Frontend**: `src/features/watchlists/*` (standalone `/watchlists`
  page) **plus** two independent in-Charts surfaces under
  `src/features/scanner/components/` (`ScannerWatchlistSidebar`,
  `ScannerWatchlistWidget`).
- **Backend**: `backend/src/modules/watchlists/*`.
- **Main hooks**: `src/features/watchlists/hooks/use-watchlists.ts`.
- **Main APIs**: `/api/watchlists/*`.
- **Depends on**: Global stock search (add-symbol input).
- **Detail**: [WATCHLISTS.md](./WATCHLISTS.md).

## Global Search

- **Status**: live.
- **Frontend**: `src/features/global-search/*` — one modal, mounted once
  in root layout, opened via navbar field / mobile sheet / Ctrl-Cmd-K.
- **Backend**: `/api/market-data/stocks/search` (via `market-data`
  module).
- **Main hooks/state**: `useSearchModalStore`, `useGlobalStockSearch`,
  `useStockDestination`.
- **Depends on**: nothing feature-specific; consumed by Charts,
  Watchlists, landing/app navbars.

## Auth

- **Status**: live — strict two-portal architecture (recently completed).
- **Frontend**: `src/features/auth/*`.
- **Backend**: `backend/src/modules/auth/*`, `backend/src/modules/security/*`.
- **Main APIs**: `/api/auth/*`, `/api/admin-auth/*`.
- **Detail**: [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) (read this
  one in full before touching any auth code — it's dense but everything
  matters).

## Admin

- **Status**: live.
- **Frontend**: `src/features/admin/*`, routes under `/admin/**`.
- **Backend**: `backend/src/modules/admin/*` (plus it reaches into
  market-collections, data-provider, ai, monetization services).
- **Main APIs**: `/api/admin/*`.
- **Detail**: [ADMIN_PORTAL.md](./ADMIN_PORTAL.md).

## Market Data

- **Status**: live — the data backbone under Charts/Dashboard/Stocks.
- **Backend**: `backend/src/modules/market-data/*`,
  `backend/src/modules/data-provider/*`.
- **Frontend**: `src/features/market-data/*` (stocks/candles/exchange-rate
  queries + paint cache), `src/features/market/*` (exchange selector).
- **Main APIs**: `/api/market-data/*`.
- **Detail**: [MARKET_DATA.md](./MARKET_DATA.md), [PROVIDERS.md](./PROVIDERS.md).

## Price Alerts

- **Status**: live.
- **Frontend**: `src/features/price-alerts/*` (a top-level feature, not
  nested under Scanner, despite being surfaced only inside Charts'
  toolbar via `ScannerPriceAlertMenu`).
- **Backend**: `backend/src/modules/price-alerts/*`,
  `backend/src/modules/push-subscriptions/*` (alert-triggered push
  notifications).
- **Main APIs**: `/api/price-alerts/*`, `/api/push-subscriptions/*`.
- **Depends on**: PWA/Push for delivery.

## Drawings

- **Status**: live.
- **Frontend**: no standalone feature folder — lives inside
  `src/features/scanner/{tools,components}` (`DrawingOverlay.tsx`,
  `DrawingStyleToolbar.tsx`, `ChartToolsBar.tsx`, `tools/drawing-*.ts`).
- **Backend**: `backend/src/modules/drawings/*`, table `scanner_drawings`.
- **Main APIs**: `/api/scanner/workspaces/:symbol/:timeframe`,
  `/api/scanner/drawings/:id`.
- **Detail**: [CHARTS.md](./CHARTS.md).

## Snapshots/Share

- **Status**: live, but **not what the name might suggest** — this is
  client-side chart-image capture (canvas → PNG, download/copy/share),
  not a persisted server-side shareable snapshot. There is a separate,
  unrelated backend concept also called "snapshot"
  (`dashboard_metric_snapshots` — persisted computed *metrics*, see
  [DASHBOARD.md](./DASHBOARD.md)) — do not confuse the two.
- **Frontend**: `ChartSnapshotMenu.tsx` (menu) +
  `ScannerChartStage.tsx`'s `captureStageImage` (actual capture),
  `src/utils/download-blob.ts`. `ShareMenu.tsx` is a separate,
  image-free social-link-share feature (`src/features/scanner/lib/share-links.ts`).
- **Backend**: none — entirely client-side.

## Backtest

- **Status**: live.
- **Frontend**: `src/features/weekly-strong-backtest/*` +
  `src/features/dashboard/components/WeeklyStrongBacktestSection.tsx`
  (the actual chart/detail UI, embedded in Dashboard).
- **Backend**: `backend/src/modules/weekly-strong-backtest/*`.
- **Main APIs**: `/api/weekly-strong-backtest/:code`,
  `/api/weekly-strong-backtest/:code/:weekEnding`, plus admin
  generate/rebuild endpoints under `/api/admin/market-collections/:id/weekly-strong-backtest/*`.
- **Detail**: [BACKTEST.md](./BACKTEST.md).

## PWA/Push

- **Status**: live.
- **Frontend**: `src/features/pwa/*` (service-worker registration only —
  `PwaProvider`, `PwaInstallButton`). Actual push-subscription
  registration (`ensureBrowserPushSubscription`) lives in
  `src/features/price-alerts/api/push-client.ts` — **there is no
  `src/features/push-subscriptions` frontend folder**, despite the
  backend module being named that.
- **Backend**: `backend/src/modules/push-subscriptions/*` (uses the
  `web-push` package, VAPID keys via env).
- **Main APIs**: `/api/push-subscriptions/*`.

## Dead/orphaned (route exists, feature does not)

| Route | Feature folder | Component(s) |
|---|---|---|
| `/stocks` | `src/features/stocks/*` | `StocksTable`, `StockQuickChartPreview`, `StockTableToolbar` |
| `/profile` | `src/features/profile/*` | `ProfileOverview`, `ProfilePageContent`, `PlanCard`, `UsageOverview` |

Both routes unconditionally redirect to `/charts`; nothing else in `src`
imports these components. Treat reviving either as a real feature task.
