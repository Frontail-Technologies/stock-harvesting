# Admin Portal

See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) for the full auth
model — this doc covers routing/navigation/deployment specifics only.

## Hostname

`admin.stockharvesting.com` (production), `admin.localhost:3000` (local
dev — no hosts-file edit needed, `*.localhost` resolves to loopback
natively). Configured via `NEXT_PUBLIC_ADMIN_HOST` (frontend) and
`ADMIN_WEB_APP_URL` (backend, for OAuth return + `CORS_ORIGIN`).

## Clean browser routes / internal rewrites

`src/proxy.ts` rewrites every non-`/admin`-prefixed path on the admin host
into the internal `/admin/**` route tree (URL bar stays clean —
`admin.host/users` shows exactly that, backed by
`src/app/(app)/admin/users/page.tsx`). Full mechanism:
[ROUTES.md](./ROUTES.md) "Hostname-sensitive routing". `adminPath()`
(`src/utils/seo.ts`) converts an internal `/admin/...` path to the clean
visible form — every admin `Link`/redirect must use it.

## Pages

| Clean path | File | Notes |
|---|---|---|
| `/` | `admin/page.tsx` | Dashboard landing (renders `AdminUsersPage`) on the real admin host; redirects to `/admin/users` when no admin host configured |
| `/login` | `admin/login/page.tsx` | `AdminLoginScreen` — not wrapped in `AdminShell` |
| `/users` | `admin/users/page.tsx` | |
| `/ai-settings` | `admin/ai-settings/page.tsx` | |
| `/ads` | `admin/ads/page.tsx` | Renders `AdminMonetizationPage` |
| `/data-providers` | `admin/data-providers/page.tsx` | |
| `/data-provider` | `admin/data-provider/page.tsx` | Dead — redirects to `/data-providers` (legacy) |
| `/data-provider/callback` | `admin/data-provider/callback/page.tsx` | Zerodha OAuth callback |
| `/jobs` | `admin/jobs/page.tsx` | Dead — redirects to `/users`; `AdminJobsPage` component is orphaned |
| `/market-collections` | `admin/market-collections/page.tsx` | |
| `/market-collections/[id]` | `admin/market-collections/[id]/page.tsx` | Collection detail: members, versions, import, weekly-strong-backtest status |

## Permission guards

- **Backend**: `adminRouter.use(requireAdminAuth, requireAdmin)` — both
  ADMIN-portal token audience *and* `role === "admin"` required, every
  request. See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §6.
- **Frontend**: `AdminShell` — redirects guests to `/admin/login?next=...`,
  shows `AdminForbiddenState` if authenticated but not admin-role.

## Admin login

Google OAuth only (no password form), same start/callback endpoints as
the user portal, portal-tagged via a short-lived cookie. A non-admin
account attempting admin login is rejected **before any session is
created** — see [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §2.

## Navigation

`ADMIN_NAV_ITEMS` (`src/features/admin/constants/admin-nav.tsx`): Users,
AI Settings, Data Providers, Market Collections, Ads, and a disabled
"Branding" entry (no route exists for it yet). "Jobs" has **no** nav
entry despite `AdminJobsPage.tsx` existing — reachable only by direct URL
today, and that URL redirects away (see Pages table).

## Relationship with the main app

Fully isolated auth (no SSO — see
[AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md)). No "Admin" link appears
anywhere in the main USER-portal navigation (`AppHeader` deliberately
never branches on role). The only cross-portal navigation is the legacy
`stockharvesting.com/admin/*` → `admin.stockharvesting.com/*` 308 redirect
(navigation only, no session transfer), and "Visit Stock Harvesting" links
from the admin shell/sidebar pointing at the public site root (not an
authenticated destination).

## Deployment / DNS requirements

Two real DNS records are required in production: `stockharvesting.com`
and `admin.stockharvesting.com`, both pointing at wherever the one Next.js
deployment is served from (this is **one app, one build**, routed by
`Host` header — not two separate deployments). Both need TLS certificates
(the auth cookies are `Secure`, so plain HTTP won't work in production).
See `docs/DEPLOYMENT.md` for the full env-var pairing
(`NEXT_PUBLIC_ADMIN_HOST` / `ADMIN_WEB_APP_URL` / `CORS_ORIGIN`) and note
that **no Nginx/PM2/Docker config is checked into this repo** — reverse
proxy and TLS termination for the two hostnames is managed outside version
control.
