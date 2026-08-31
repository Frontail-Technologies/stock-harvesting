# Routes

Route inventory as of this audit. Hostname routing is handled entirely by
`src/proxy.ts` — see [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §1 and
below for its exact rewrite/redirect logic.

## PUBLIC (no auth)

| Path | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page |
| `/login` | `src/app/(app)/login/page.tsx` | `LoginScreen`, USER portal login |

## USER PORTAL (main host, `AuthGuard`-gated)

| Path | File | Notes |
|---|---|---|
| `/charts` | `src/app/(app)/charts/page.tsx` | Renders `ScannerPage` — the canonical charting workspace. Has its own `AuthGuard` + toolbar, not wrapped in `AppShell` |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | Live in all environments (the `NODE_ENV=production` redirect that used to gate this was removed — see `docs/KNOWN_ISSUES.md`) |
| `/dashboard/collections/[code]` | `.../dashboard/collections/[code]/page.tsx` | Always `redirect(`/dashboard?segment=${code}`)` — no independent rendering |
| `/watchlists` | `src/app/(app)/watchlists/page.tsx` | `WatchlistsPage`, wrapped in `AppShell` |

### Dead-implementation redirect stubs (route kept as a cheap compat redirect; the feature code behind it was deleted)

| Path | Redirects to | Status |
|---|---|---|
| `/stocks` | `/charts` | `StocksTable`/`StockTableToolbar`/`use-live-stock-prices` deleted (confirmed zero importers). `StockQuickChartPreview` — the one component that lived in the same feature folder — was **kept**; it's actively used by `WeeklyStrongStockTable` on the live Dashboard, not part of this dead route |
| `/profile` | `/charts` | `src/features/profile/*` deleted entirely (confirmed zero importers) |

No evidence either was ever a real, externally-linked page. If reviving
either, it's a real feature-reactivation task starting from nothing, not
a bug fix.

### Legacy redirect

`/scanner` → `/charts` — framework-level, `next.config.ts`'s `redirects()`
(308 permanent, forwards all query params automatically), not a page.
`src/app/(app)/scanner/page.tsx` no longer exists (deleted).

## ADMIN PORTAL (`/admin/**` internally; bare paths on the real admin host)

| Internal path | Admin-host path | File | Notes |
|---|---|---|---|
| `/admin` | `/` | `admin/page.tsx` | If no admin host configured, `redirect("/admin/users")`; on the real admin host, renders `AdminUsersPage` directly |
| `/admin/login` | `/login` | `admin/login/page.tsx` | `AdminLoginScreen` — **not** wrapped in `AdminShell` |
| `/admin/users` | `/users` | `admin/users/page.tsx` | |
| `/admin/ai-settings` | `/ai-settings` | `admin/ai-settings/page.tsx` | |
| `/admin/ads` | `/ads` | `admin/ads/page.tsx` | Renders `AdminMonetizationPage` — route says "ads", component says "monetization" |
| `/admin/data-providers` | `/data-providers` | `admin/data-providers/page.tsx` | |
| `/admin/data-provider` | `/data-provider` | `admin/data-provider/page.tsx` | **Dead** — always `redirect(adminPath("/admin/data-providers"))`, legacy singular→plural |
| `/admin/data-provider/callback` | `/data-provider/callback` | `admin/data-provider/callback/page.tsx` | Zerodha OAuth callback landing |
| `/admin/jobs` | `/jobs` | `admin/jobs/page.tsx` | Redirect stub — always `redirect(adminPath("/admin/users"))`. `AdminJobsPage` component (formerly orphaned) was deleted |
| `/admin/market-collections` | `/market-collections` | `admin/market-collections/page.tsx` | |
| `/admin/market-collections/[id]` | `/market-collections/[id]` | `admin/market-collections/[id]/page.tsx` | |

Every admin page except `/admin/login` is wrapped in `AdminShell`
(session-gate + `AdminSidebar`).

## Hostname-sensitive routing — `src/proxy.ts`

`ADMIN_HOST = getAdminHost()` (`NEXT_PUBLIC_ADMIN_HOST` env var; `null` ⇒
proxy is a no-op, `/admin/**` stays on the main host).

- **Request host === `ADMIN_HOST`**: any path already starting with
  `/admin` passes through unchanged (only hit by a stale bookmark — every
  real admin link already uses the stripped form via `adminPath()`).
  Everything else is **rewritten** (URL bar unchanged) to
  `/admin${pathname === "/" ? "" : pathname}`. So `admin.host/users` serves
  `admin/users/page.tsx` while the browser still shows `admin.host/users`.
- **Request host is the main host** and path starts with `/admin`:
  **308-redirected** (URL bar changes) to `ADMIN_HOST`, with `/admin`
  stripped. `stockharvesting.com/admin/users` → `admin.stockharvesting.com/users`.
- Matcher excludes `_next/static`, `_next/image`, and any path containing a
  dot (static files) — only route-like paths hit the proxy.
- **File location matters**: this file must live at `src/proxy.ts` (this
  project uses a `src/` dir), not the repo root — see
  [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §12 for the regression
  this caused when misplaced.

## BACKEND / API

All mounted in `backend/src/app.ts`. Prefix constants live in
`backend/src/shared/constants/routes.ts` (`API_ROUTES`).

| Prefix | Router | Auth |
|---|---|---|
| `/api/health` | inline | none |
| `/api/auth` | `authRouter` | mixed (see [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)) |
| `/api/admin-auth` | `adminAuthRouter` | mixed, ADMIN portal only |
| `/api/users` | `usersRouter` | `requireAuth` |
| `/api/market-data` | `marketDataRouter` | `requireAuth` |
| `/api/market-collections` | `marketCollectionsRouter` | `requireAuth` |
| `/api/scanner` | `scannerRouter` **and** `drawingsRouter` | `requireAuth` (both share this one prefix) |
| `/api/admin` | `adminRouter` | `requireAdminAuth` + `requireAdmin` |
| `/api/ai` | `aiRouter` | `requireAuth` |
| `/api/price-alerts` | `priceAlertsRouter` | `requireAuth` |
| `/api/push-subscriptions` | `pushSubscriptionsRouter` | mixed (public-key GET is open) |
| `/api/watchlists` | `watchlistsRouter` | `requireAuth` |
| `/api/monetization` | `monetizationRouter` | mixed (public config GET is open) |
| `/api/weekly-strong-backtest` | `weeklyStrongBacktestRouter` | `requireAuth` |
| `/ws/market` | market-stream gateway (not in `app.ts` — attached directly to the HTTP server in `backend/src/server.ts`) | JWT via query param or `Sec-WebSocket-Protocol` |

`/api/scanner` carries **two** routers (scan rules/runs and drawings) —
don't assume every route under that prefix belongs to `scanner.routes.ts`.
