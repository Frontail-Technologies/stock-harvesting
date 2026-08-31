# Architecture

Practical map of the codebase. Read this first, then the feature-specific
doc for whatever you're touching. See [REGRESSION_RULES.md](./REGRESSION_RULES.md)
for hard invariants — this doc is descriptive, that one is prescriptive.

## Frontend

Next.js 16 App Router, TypeScript, at repo root (`src/`). **This is not the
Next.js you know** — read `node_modules/next/dist/docs/` before assuming a
convention (the `middleware.ts` → `src/proxy.ts` rename is one real
example that has already caused a regression — see
[AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §12).

- **Two portals, one Next.js build**: USER (`stockharvesting.com`) and
  ADMIN (`admin.stockharvesting.com`) are both served by this one app,
  routed by hostname via `src/proxy.ts`. See [ROUTES.md](./ROUTES.md).
- **Feature-folder structure**: `src/features/<name>/{components,hooks,api,lib,stores,types.ts,index.ts}`.
  22 feature directories — see [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md)
  for the full roster and status of each.
- **Design-system primitives**: `src/components/ui/*` (shadcn-derived:
  button, dialog, sheet, sidebar, table, toast, etc.) — feature components
  compose these, they don't reinvent them.
- **Charting library**: `lightweight-charts` (TradingView's open-source
  library), wrapped by `src/features/scanner/components/ScannerChartStage.tsx`
  / `ScannerChart.tsx`. This is the **only** charting surface — Dashboard's
  bar charts and the sparkline in `StockQuickChartPreview` are hand-rolled
  SVG, not `lightweight-charts`.
- **Internal "Scanner" naming**: the product-facing name is **Charts**
  (`/charts`), but the feature folder, store, and most internal
  identifiers still say `scanner`/`Scanner`. This is intentional and
  retained — see [CHARTS.md](./CHARTS.md).

## Backend

Express 5 + Drizzle ORM + Postgres (Neon), TypeScript, at `backend/`.

- **Entrypoint**: `backend/src/server.ts` — raw `http.createServer` wrapping
  the Express app (`createApp()` in `backend/src/app.ts`), plus the
  market-stream WebSocket gateway attached to the same HTTP server's
  `upgrade` event (not a separate port), plus scheduling the repeatable
  BullMQ sync job on boot.
- **Modules**: `backend/src/modules/<name>/{*.routes.ts, *.service.ts, *.schemas.ts}`
  — one module per domain concern. Full roster in
  [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md). Route mount list is in
  [ROUTES.md](./ROUTES.md)'s "BACKEND / API" table — that list is verbatim
  from `backend/src/app.ts`, trust it over memory.
- **Shared**: `backend/src/shared/{env.ts, errors/, middleware/, constants/, http.ts, logger.ts, cache.ts, normalize.ts, validate.ts}`.
  `constants/` is a directory barrel-exported via `constants/index.ts`
  (`domain.ts`, `http.ts`, `jobs.ts`, `routes.ts`, `security.ts`).
- **Second process**: `backend/src/worker.ts` — a standalone BullMQ worker,
  only runs if `REDIS_URL` is set (exits immediately otherwise). See
  "BullMQ / background jobs" below.

## Database

Postgres via Neon (serverless pooler), Drizzle ORM. Full reference:
**`docs/DATABASE.md`** (schema conventions, indexes, connection pool math,
transactions, idempotency — don't duplicate that here). Table roster with
FK relationships is summarized per-feature in
[FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) and the relevant feature doc
(MARKET_DATA/DASHBOARD/BACKTEST/WATCHLISTS/ADMIN_PORTAL). Migrations:
file-based (`drizzle-kit generate`/`migrate`), 16 files as of this audit,
entirely additive except three non-destructive `ALTER COLUMN ... SET
DEFAULT`/`SET NOT NULL` statements — no `DROP TABLE`/`DROP COLUMN`
anywhere in the history. Keep it that way (see
[REGRESSION_RULES.md](./REGRESSION_RULES.md)).

## React Query

- One shared `QueryClient` for the whole app (both portals), created in
  `src/features/api/lib/query-client.ts`, provided via
  `src/features/api/components/QueryProvider.tsx`, mounted once in the
  root `src/app/layout.tsx`.
- Defaults: `staleTime: 30_000`, `gcTime: 5 * 60_000`,
  `refetchOnWindowFocus: false`, retry skips 4xx entirely and caps at 2
  retries otherwise.
- **Query keys**: single object, `src/features/api/lib/query-keys.ts` —
  groups: `auth` (with separate `currentUser`/`adminCurrentUser` — never
  shared between portals), `profile`, `marketData`, `marketCollections`
  (nested `admin` sub-group), `weeklyStrongBacktest`, `scanner`, `admin`,
  `watchlists`, `priceAlerts`.
- **Two separate fetch wrappers**: `apiFetch` (USER portal,
  `src/features/api/lib/api-client.ts`) and `adminApiFetch` (ADMIN portal,
  `src/features/api/lib/admin-api-client.ts`) — never cross-import these.
  See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §7.

## Zustand stores

| Store | Path | Persisted? |
|---|---|---|
| `useSessionStore` | `src/features/auth/stores/session-store.ts` | Yes (`status`/`user`/`verifiedAt` only, never the token) |
| `useAdminSessionStore` | `src/features/auth/stores/admin-session-store.ts` | Yes, separate key, same shape |
| `useDashboardUiStore` | `src/features/dashboard/stores/dashboard-ui-store.ts` | Yes (panel widths/minimized/maximized) |
| `useScannerUiStore` | `src/features/scanner/stores/scanner-ui-store.ts` | Yes — **except** `selectedSymbol`/`selectedExchange`/`selectedStock`, deliberately excluded (stock identity is URL-only, never a stale persisted selection) |
| `useMarketStore` | `src/features/market/stores/market-store.ts` | Yes (`selectedExchange`) |
| `useMarketDataCacheStore` | `src/features/market-data/stores/market-data-cache-store.ts` | Yes (stale-while-revalidate paint cache, not a React Query replacement) |
| `useSearchModalStore` | `src/features/global-search/stores/search-modal-store.ts` | No |
| `useLivePriceStore` | `src/features/market-stream/stores/live-price-store.ts` | No |
| `useToastStore` | `src/components/ui/toast.tsx` | No |

Plus two plain in-memory (non-Zustand) access-token modules, deliberately
isolated per portal: `src/features/api/lib/token-store.ts` and
`admin-token-store.ts`.

## State categorization

| Kind | Where | Examples |
|---|---|---|
| **URL state** | Next.js `useSearchParams`/route params | `/charts?symbol=&exchange=` (authoritative, no default — see [CHARTS.md](./CHARTS.md)), `/dashboard?segment=`, `?next=` on both login screens, `?watchlist=<id>` |
| **Server state** | React Query | Candles, stocks, watchlists, alerts, dashboard metrics, admin data — anything fetched from `/api/*` |
| **Persisted local UI state** | Zustand + `persist` (localStorage) | Panel widths, theme, chart type/timeframe prefs, market-data paint cache, session snapshots (see auth exception above) |
| **Auth/session state** | `useSessionStore` / `useAdminSessionStore` + in-memory token stores | See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) — never conflate the two portals' stores |

## Auth bootstrap

Two independent bootstraps, never both active for one page load:
`AuthBootstrap` (root layout, skips itself on `/admin` paths) and
`AdminAuthBootstrap` (`src/app/(app)/admin/layout.tsx` only). Full detail:
[AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md).

## Provider architecture

`backend/src/modules/data-provider/*` — an adapter abstraction over three
vendors (EODHD, Zerodha, GlobalDataFeeds), resolved per-exchange with a
DB-configurable enabled/priority mechanism. Full detail:
[PROVIDERS.md](./PROVIDERS.md).

## BullMQ / background jobs

Single queue (`market-data`, `backend/src/modules/jobs/queues.ts`),
active only when `REDIS_URL` is set. `backend/src/worker.ts` exits
immediately (code 0) at startup without `REDIS_URL` — no queue is ever
consumed without it.

Behavior differs by operation — verified directly against
`backend/src/modules/admin/admin.service.ts` and `queues.ts`, not
inferred:

| Operation | `REDIS_URL` unset | `REDIS_URL` set |
|---|---|---|
| Scheduled repeatable instrument sync (every 30 min/exchange, `scheduleRepeatableMarketDataSync`) | **Does not run at all** — `getMarketDataQueue()` returns `null`, the scheduling function no-ops | Runs via BullMQ, consumed by `worker.ts` |
| Admin-triggered instrument sync (`triggerInstrumentSync`) | Runs **inline**, synchronously, in the API request | Enqueued, processed by `worker.ts` |
| Admin-triggered price refresh (`triggerPriceRefresh`) | Runs **inline** | Enqueued |
| Admin-triggered Weekly Strong Backtest backfill/historical-rebuild | Runs **inline** | Enqueued |
| Admin-triggered sector-classification sync, index-candle backfill, single-symbol candle backfill | **Always inline**, regardless of `REDIS_URL` — these were never wired through the queue at all (no registered worker handler for them) | Always inline |
| `syncWeeklyStrongBacktestIncremental` (piggybacked inside the worker's `instrument-sync` job handler, ~every 30 min/exchange) | **Does not run** — it only ever fires from within a queued job that itself doesn't exist without Redis | Runs after each scheduled instrument-sync job |

In short: every **admin-triggered, request-scoped** action either always
runs inline or has a working inline fallback. Only the **automatic,
schedule-driven** paths (the repeatable sync and the backtest incremental
sync riding on it) have no fallback and simply don't happen without Redis
+ a running worker process. See [MARKET_DATA.md](./MARKET_DATA.md) and
[BACKTEST.md](./BACKTEST.md) for how this affects each feature
specifically.

## Major feature boundaries

See [FEATURE_REGISTRY.md](./FEATURE_REGISTRY.md) for the full table. The
two most important boundaries to internalize before making a change:

1. **Top Dashboard widgets vs. Weekly Strong evaluator** — two separate
   ranking systems that happen to render on the same page. See
   [DASHBOARD.md](./DASHBOARD.md).
2. **Current vs. point-in-time collection membership** — `market_collection_members`
   (live) vs. `market_collection_versions`/`market_collection_version_members`
   (immutable snapshots, used only for historical backtest accuracy). See
   [BACKTEST.md](./BACKTEST.md).

## Important shared utilities

| Path | Purpose |
|---|---|
| `backend/src/shared/env.ts` | Zod-validated env schema — the only place `process.env` should be read |
| `backend/src/shared/errors/` | `AppError`, `ERROR_CODES`, `errorHandler`, `notFound` |
| `backend/src/shared/middleware/index.ts` | Barrel: `asyncHandler`, `validate`, and the auth guards (`requireAuth`, `requireAdminAuth`, `requireAdmin`, `requireRole`) |
| `backend/src/shared/cache.ts` | `getOrSetCache`/`invalidateCacheByPrefix` — small in-process cache, not Redis |
| `src/utils/seo.ts` | `getSiteUrl`, `getAdminHost`, `getAdminOrigin`, `adminPath` — every admin-host-aware link goes through `adminPath()` |
| `src/utils/production-lockdown.ts` | `IS_PRODUCTION_LOCKDOWN` — gates Dashboard/Stocks/Profile in production. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) |
| `src/utils/download-blob.ts` | Client-side blob download helper (used by chart snapshot export) |
