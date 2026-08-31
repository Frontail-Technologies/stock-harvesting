# Charts

Product-facing name: **Charts**. Internal code: still largely named
"Scanner" (`src/features/scanner/*`, `ScannerPage`, `scanner-ui-store`).
**This is intentional and retained** — the route/metadata/user-facing copy
was renamed; the internal feature folder was not. Do not "fix" this by
renaming files wholesale; do use "Charts" in any new user-facing copy.

## Canonical route

`/charts` → `src/app/(app)/charts/page.tsx` → `ScannerPage`
(`src/features/scanner/components/ScannerPage.tsx`). Has its own
`AuthGuard` and toolbar — not wrapped in `AppShell`/`AppHeader`. Legacy
`/scanner` 308-redirects here (`next.config.ts`).

## Bare `/charts` behavior

**No default stock is ever picked.** `hasStockInUrl = Boolean(symbolParam) && Boolean(exchangeParam)`
— both `?symbol=` and `?exchange=` must be present, or `ScannerEmptyState`
renders ("Search for a stock to open its chart") instead of a chart. A
URL with only one of the two params is treated identically to having
neither. See [REGRESSION_RULES.md](./REGRESSION_RULES.md).

## URL symbol + exchange authority

The URL is the **only** source of truth for which stock is open —
`useScannerUiStore`'s `persist` middleware explicitly excludes
`selectedSymbol`/`selectedExchange`/`selectedStock` from what's saved to
`localStorage`, specifically so a bare `/charts` visit can never reopen a
stale previously-selected stock.

Sync is bidirectional with loop prevention (`symbolSyncOriginRef`, values
`"url" | "user" | null`):

- **URL → store**: no stock in URL clears the store selection; a URL
  stock differing from the store writes it in.
- **Store → URL**: any in-app selection (search, watchlist click) calls
  `setStockParams()` → `router.replace(...)`, always writing **both**
  params together, never symbol-only, never for an empty selection.

If the URL names a stock not yet in the app's metadata cache (direct
link, external nav, back/forward), a minimal placeholder `Stock` is built
via `buildEmptyStock(exchange)` keyed to the URL's symbol; real
metadata/candles fill in once queries resolve.

## Global Search integration

`StockSearchCombobox.tsx` (in-toolbar) and the global
`GlobalStockSearchModal` (Ctrl/Cmd+K, navbar) both resolve to the same
symbol-selection path, which writes through the store→URL sync above.

## Candle loading / freshness

See [MARKET_DATA.md](./MARKET_DATA.md) for the full `getChartCandles`
freshness/backfill logic (empty/split/missing-range → full backfill;
stale-only → incremental refresh; fresh → no provider call). Charts is the
primary consumer of this path.

## Timeframe derivation

1W/1M are derived **in-process from stored daily rows**
(`deriveChartCandlesFromDailyRows` → `aggregateWeeklyCandles`/
`aggregateMonthlyCandles`, `backend/src/modules/market-data/candle-aggregation.ts`)
— not fetched independently per timeframe from the provider. A legacy
fallback path reads pre-stored `1W`/`1M` rows only if a symbol has zero
daily rows at all (pre-dates the derive-on-read change). See
[REGRESSION_RULES.md](./REGRESSION_RULES.md): 1W/1M must not independently
trigger a years-of-history provider fetch.

## Drawings

Per `(userId, exchange, symbol, timeframe)`, table `scanner_drawings`.
Components: `DrawingOverlay.tsx` (render/edit on canvas),
`DrawingStyleToolbar.tsx` (style picker), `ChartToolsBar.tsx` (tool
palette — rail on desktop, sheet on mobile). Config lives in
`src/features/scanner/tools/*`. Frontend save flow: debounced 900ms
auto-save via `useSaveScannerDrawings`, only when authenticated; hydrated
once via `useScannerWorkspaceDrawings`. API:
`GET/PUT /api/scanner/workspaces/:symbol/:timeframe`,
`PATCH/DELETE /api/scanner/drawings/:id`.

## Alerts

`ScannerPriceAlertMenu` (a **separate top-level feature**,
`src/features/price-alerts/*`, not nested under scanner) is embedded into
`TopToolbar.tsx`. See [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md).

## Watchlist sidebar

Two independent surfaces, both in `src/features/scanner/components/`:
`ScannerWatchlistSidebar.tsx` (persistent, toolbar-toggled, resizable,
state in `scanner-ui-store.ts`) and `ScannerWatchlistWidget.tsx`
(floating, opens only via `?watchlist=<id>` — the deep link from the
standalone Watchlists page's "Open in Charts" action). See
[WATCHLISTS.md](./WATCHLISTS.md).

## Snapshots/share

**Client-side only.** `ChartSnapshotMenu.tsx` queues a capture request;
`ScannerChartStage.tsx`'s `captureStageImage` composites the chart's
canvases + a watermark + brand logo onto an offscreen canvas and produces
a PNG (download via `src/utils/download-blob.ts`, or copy/open-tab/share).
**Nothing is persisted server-side.** `ShareMenu.tsx` is unrelated — it
builds a social-share link back to `/charts?symbol=...&exchange=...`
(`src/features/scanner/lib/share-links.ts`), no image involved. Do not
confuse either with `dashboard_metric_snapshots` (a completely different,
backend-only concept — see [DASHBOARD.md](./DASHBOARD.md)).

## Realtime

`useMarketStream` (`src/features/market-stream/hooks/use-market-stream.ts`)
— raw WebSocket to `/ws/market`, authenticated with the USER-portal access
token. On a `market.candle.update` event matching the open
exchange/symbol/timeframe, it directly mutates the React Query cache for
that candle query: same `time` as the last cached candle → merge
high/low/close/volume in place (updates the in-progress candle); new
`time` → append. **It only ever extends the tail of an already-fetched
series — it never replaces the whole series and never clears history.**

On disconnect, the hook auto-reconnects after 2.5s indefinitely while
mounted. **Note**: `ScannerPage`/`ScannerChart` currently discard the
hook's returned `status`/`lastEvent` — nothing in the UI surfaces a
"disconnected" indicator today; the chart just silently stops receiving
live updates until reconnection succeeds, still showing the last
successfully-fetched candles. This satisfies the regression rule ("realtime
failure must not blank stored history") but is a UX gap worth knowing
about — see [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

## Mobile layout

`useIsDesktopViewport(minWidthPx = 640)` (`src/features/scanner/hooks/`)
is the shared breakpoint hook — used by the watchlist sidebar/widget and
`ChartToolsBar` to swap a desktop inline panel/rail for a `Sheet`
bottom-sheet. No dedicated `*-mobile.tsx` files; handled inline via this
hook + responsive Tailwind classes.

## Internal Scanner-named files, intentionally retained

`ScannerPage.tsx`, `ScannerChart.tsx`, `ScannerChartStage.tsx`,
`scanner-ui-store.ts`, `src/features/scanner/*` generally, backend
`backend/src/modules/scanner/*` (a **different** thing — scan
rules/runs/results, not the Charts page itself). When writing new
user-facing copy, always say "Charts." When navigating the codebase for
the charting workspace, look under `scanner`.
