# Component Registry

Components future developers are likely to reuse — or accidentally
duplicate. Design-system primitives (`src/components/ui/*`: `button`,
`dialog`, `sheet`, `sidebar`, `table`, `toast`, `tooltip`, `select`,
`switch`, `popover`, `avatar`, `badge`, `input`, `progress`,
`scroll-area`, `separator`, `toggle`/`toggle-group`, `brand-logo`,
`dot-grid-background`, `dotted-map`, `theme-whoosh`) are not listed
individually — they're the base layer everything else composes.

## Cross-feature components

| Component | Path | Purpose | Used by | Notes |
|---|---|---|---|---|
| `GlobalStockSearchModal` | `src/features/global-search/components/GlobalStockSearchModal.tsx` | The one canonical stock search dialog (Ctrl/Cmd+K, navbar field, mobile sheet) | Mounted once in root layout; opened from `AppHeader`, landing `Navbar` | Driven by `useSearchModalStore` (ephemeral) |
| `AccountMenu` | `src/features/layout/components/AccountMenu.tsx` | Main-site account dropdown (guest sign-in / authenticated avatar+logout+theme) | `AppHeader`, landing `Navbar` (desktop + mobile) | Props: `{className?, portalClassName?}` |
| `ScannerAccountMenu` | `src/features/scanner/components/ScannerAccountMenu.tsx` | **Intentional near-duplicate** of `AccountMenu`, scoped to Charts | `TopToolbar`, `ScannerWatchlistToggle` | No theme toggle, no Charts/Watchlists links, different default initials ("SH"). Do **not** consolidate without re-reading both — the separation is deliberate per in-file comments |
| `AppHeader` | `src/features/layout/components/AppHeader.tsx` | USER portal navbar (logo, Charts/Dashboard/Watchlists nav, search, `AccountMenu`, mobile drawer) | `AppShell` (used by `/dashboard`, `/watchlists` only — Charts has its own toolbar) | Never branches on role — a USER session can't be admin-role, see [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) |
| `AppShell` / `AppPage` | `src/features/layout/components/AppShell.tsx` / `AppPage.tsx` | USER-portal page chrome: `AuthGuard` + `AppHeader` + `<main>` | `/dashboard`, `/watchlists` pages | Not used by `/charts` (Scanner has its own guard/toolbar) |
| `AdminShell` | `src/features/admin/components/shell/AdminShell.tsx` | ADMIN-portal page chrome: session gate + `AdminSidebar` + `<main>` | Every `admin/*/page.tsx` except `/admin/login` | Uses `useAdminSessionStore`, redirects guests to `/admin/login?next=...` |
| `AdminSidebar` | `src/features/admin/components/shell/AdminSidebar.tsx` | Admin nav (desktop + mobile drawer) | `AdminShell` | Nav items: `src/features/admin/constants/admin-nav.tsx`. Logout button vs. static account block differs by `IS_PRODUCTION_LOCKDOWN` — intentional dev/prod difference, not a bug |
| `ScannerChart` / `ScannerChartStage` | `src/features/scanner/components/ScannerChart.tsx` / `ScannerChartStage.tsx` | The `lightweight-charts` candle chart wrapper + overlay stage (info/scan-band/backtest-stats/drawing overlays, cursor handling, snapshot capture) | Only `ScannerPage.tsx` | Not reused by Dashboard or `StockQuickChartPreview` — those use hand-rolled SVG, see below |
| `StockQuickChartPreview` | `src/features/stocks/components/StockQuickChartPreview.tsx` | Hover-triggered price/sparkline preview card, viewport-aware positioning | `WeeklyStrongStockTable` (Dashboard) | `StocksTable`, its former other consumer, was deleted as dead code (`/stocks` always redirects — see [ROUTES.md](./ROUTES.md)); this component itself is genuinely live and reusable |
| `TopToolbar` | `src/features/scanner/components/TopToolbar.tsx` | Charts toolbar: search, chart-type/timeframe selectors, snapshot menu, `ScannerPriceAlertMenu`, `ScannerAccountMenu`, theme toggle | `ScannerPage` | |
| `ChartToolsBar` | `src/features/scanner/components/ChartToolsBar.tsx` | Drawing-tool palette (rail on desktop, floating sheet on mobile) | `ScannerPage` | Uses `useIsDesktopViewport` |
| `DrawingOverlay` / `DrawingStyleToolbar` | `src/features/scanner/components/*` | Renders/edits active drawings on the chart canvas; floating style picker | `ScannerChartStage` | Persisted drawings live in `scanner_drawings` — see [MARKET_DATA.md](./MARKET_DATA.md) is candle-only; drawings detail is in [CHARTS.md](./CHARTS.md) |
| `ChartSnapshotMenu` | `src/features/scanner/components/ChartSnapshotMenu.tsx` | Download/Copy/Open-tab/Share-image menu — queues a capture request | `TopToolbar` | Client-side canvas capture only, **no server persistence** — see [CHARTS.md](./CHARTS.md) |
| `ShareMenu` | `src/features/scanner/components/ShareMenu.tsx` | Social-share links (`/charts?symbol=...` + caption) | `TopToolbar` | Unrelated to `ChartSnapshotMenu` — no image involved |
| `ScannerWatchlistSidebar` / `ScannerWatchlistWidget` | `src/features/scanner/components/*` | Two **independent** in-Charts watchlist surfaces — a persistent toolbar-toggled sidebar, and a URL-driven (`?watchlist=<id>`) floating widget | `ScannerPage` | Neither shares code with the standalone `/watchlists` page components below, though both read the same `useWatchlists`/`useWatchlist` hooks |
| `WatchlistRow` | `src/features/watchlists/components/WatchlistRow.tsx` | Standalone `/watchlists` page's per-watchlist row (expand, rename/delete menu, inline item list) | `WatchlistsPage` | |
| `WatchlistStockSearchInput` | `src/features/watchlists/components/WatchlistStockSearchInput.tsx` | Exchange picker + debounced symbol search + dedupe | `AddStockDialog`, and reused by `ScannerWatchlistSidebar`/`Widget` for in-Charts add-symbol | The one genuinely shared piece between the standalone page and the in-Charts surfaces |
| `DashboardWidget` | `src/features/dashboard/components/DashboardWidget.tsx` | Diverging horizontal-bar widget renderer (Index/Sector/Industry/Stock cards) — resize/minimize/maximize, cross-filter row click | `DashboardWidgetRow` | See [DASHBOARD.md](./DASHBOARD.md) for what feeds it |
| `WeeklyStrongStockTable` | `src/features/dashboard/components/WeeklyStrongStockTable.tsx` | Detailed qualified-stock table — **independent data source from the top 4 widgets** | `DashboardSegmentContent` | Do not merge its data source with the widgets' — see [DASHBOARD.md](./DASHBOARD.md) |
| `CurrencyProvider` | `src/features/currency/components/CurrencyProvider.tsx` | Per-exchange currency **formatting** context (`formatStockCurrency`) | `(app)` layout only (not landing/login) | **Not** multi-currency conversion — `setCurrency` is a no-op; every value is formatted in its own exchange's native currency, no FX rates involved |
| `ThemeProvider` / `ThemeToggle` | `src/features/theme/components/*` | Site-wide light/dark theme | Root layout / navbars | `THEME_STORAGE_KEY` in `src/features/theme/constants.ts` |
| `PwaProvider` | `src/features/pwa/components/PwaProvider.tsx` | Registers `/sw.js` service worker | Root layout | That's its entire job — actual push-subscription registration lives in `src/features/price-alerts/api/push-client.ts`, not here (naming trap) |

## Existing separate implementations — verify before touching

Two pairs below carry in-file comments claiming their separation is
intentional. **A code comment is not architecture authority** — see
[ENGINEERING_RULES.md](./ENGINEERING_RULES.md). Separate implementations
may remain separate only when the *current, actual* behavior genuinely
requires it. Before consolidating **or** preserving either pair, read both
implementations and confirm they still differ in a way that matters —
don't take the comment's word for it, and don't delete the comment's claim
without checking either:

- `AccountMenu` (`src/features/layout/components/AccountMenu.tsx`) vs.
  `ScannerAccountMenu` (`src/features/scanner/components/ScannerAccountMenu.tsx`)
  — as of this audit, genuinely different feature sets (theme toggle,
  Charts/Watchlists links, default avatar fallback all differ). Re-verify
  this the next time either file changes.
- `ScannerWatchlistSidebar`/`ScannerWatchlistWidget` vs. the standalone
  `/watchlists` page components — as of this audit, two different
  surfaces (in-chart panel vs. full page) sharing data hooks but not UI
  code. Re-verify the same way.

## Before adding a new shared component

Check this table first, and check
[FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) for whether a similar concept
already exists in a feature you didn't think to check (e.g. a second
"price preview card" belongs next to `StockQuickChartPreview`, not as a
new one-off).
