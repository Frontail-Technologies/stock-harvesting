# Auth Architecture

Strict two-portal authentication. There is **no SSO** between the USER
portal (`stockharvesting.com`) and the ADMIN portal
(`admin.stockharvesting.com`) — separate login flows, separate cookies,
separate refresh endpoints, separate JWT audience, separate session stores
on the frontend. Logging into one never authenticates the other, even for
the same Google account, even in the same browser.

This document describes the **current, implemented** state. Where
something is a known gap rather than a finished guarantee, it's marked
`CURRENT GAP`.

## 1. Hostname = portal, role = permission

`src/proxy.ts` (Next's renamed `middleware.ts`, see
[ROUTES.md](./ROUTES.md)) decides the portal purely from the request's
`Host` header, compared against `NEXT_PUBLIC_ADMIN_HOST`. Role
(`user`/`admin`, stored on the `users` table) never decides which portal a
request is allowed to *reach* — it only decides, inside the portal you're
already authenticating into, whether that specific login is *accepted*.

## 2. Login — Google OAuth only

There is no password/credentials form anywhere in this codebase — the only
login method is Google OAuth (`backend/src/modules/auth/auth.service.ts`).
Both portals share the **same** OAuth start/callback endpoints
(`GET /api/auth/google/url`, `GET /api/auth/google/callback`) — a short-lived
`sh_oauth_portal` cookie (10 min TTL, set alongside the CSRF `sh_oauth_state`
cookie) carries which portal a login started from, purely to pick the
correct return origin and reason codes. **It is never trusted as proof of
anything** — the actual decision is made after the Google profile resolves.

### The decision: `evaluatePortalAccess`

`backend/src/modules/auth/auth.service.ts` — pure function, unit tested in
`auth-portal-destination.test.ts`:

```
evaluatePortalAccess(role, portal):
  portal === "admin" && role !== "admin"  → rejected: not-admin-on-admin-portal
  portal === "user"  && role === "admin"  → rejected: admin-account-on-user-portal
  else                                    → allowed
```

Called from `completeGoogleLogin(code, portal)` **before** any session is
created. On rejection: **no refresh-token row, no access token, no cookie**
— the login is redirected back to that portal's own `/login` with an
`?auth=<reason>` query param. The frontend (`LoginScreen.tsx` /
`AdminLoginScreen.tsx`) reads that param via `useSearchParams()` and shows
a message ("This account uses the Admin Portal." / "You do not have access
to the Admin Portal.") — it never re-derives the rejection from session
state, because there is no session to derive it from.

## 3. Cookies

| | USER portal | ADMIN portal |
|---|---|---|
| Refresh cookie name | `sh_user_refresh` | `sh_admin_refresh` |
| Set/cleared by | `backend/src/modules/auth/auth.routes.ts` | `backend/src/modules/auth/admin-auth.routes.ts` |
| Attributes | `httpOnly; Secure; SameSite=None; Path=/` — **no `Domain=`** | same |

**Both portal frontends call the same API origin**
(`NEXT_PUBLIC_API_BASE_URL`/`API_BASE_URL` — one backend, not one per
portal). This matters: cookie isolation between the two portals does
**not** come from the two frontend hostnames being different sites — a
browser attaches a cookie based on the cookie's own domain/path/SameSite
rules, not on which frontend page happened to initiate the request, so a
request from `admin.stockharvesting.com` and a request from
`stockharvesting.com` would both be eligible to carry *any* cookie the API
origin has ever set, if that cookie's name and attributes allowed it.

The actual isolation mechanism is entirely name- and endpoint-based:

1. **Two distinct cookie names** (`sh_user_refresh` / `sh_admin_refresh`)
   — the API never sets both from one login.
2. **Each refresh/logout endpoint reads only its own name** — `/api/auth/*`
   never reads `sh_admin_refresh`; `/api/admin-auth/*` never reads
   `sh_user_refresh` (`auth.routes.ts` vs. `admin-auth.routes.ts`).
3. **Server-side portal metadata on the DB row** (§4) — even if a token
   value were somehow presented to the wrong endpoint, the stored
   `portal` column on `refresh_tokens` would reject it.

Both cookies are also genuinely **host-only** — no `Domain=` attribute
anywhere in `backend/src/modules/security/cookies.ts` — which only means
they're scoped to the API's own single origin (never sent to
`stockharvesting.com`/`admin.stockharvesting.com` themselves, and never
promoted to a shared parent domain). Host-only-ness is not what separates
the *two portals* from each other, since both portals' cookies share that
one API origin regardless — see points 1-3 above for what actually does
that job. `SameSite=None` is required simply because both frontend origins
are cross-site from the API's own origin.

Two other short-lived cookies exist, shared by both portals and never
security-sensitive on their own: `sh_oauth_state` (CSRF), `sh_oauth_portal`
(return-destination hint only, see §2).

## 4. Refresh token lifecycle

`refreshTokens` table (`backend/src/db/schema/auth.ts`) carries a
`portal: "user" | "admin"` column (migration `0015_perpetual_wallflower.sql`).
`rotateRefreshToken(rawToken, expectedPortal)` rejects (identically to "not
found") any row whose stored `portal` doesn't match the endpoint that
presented it — a `sh_admin_refresh` token can never rotate through
`/api/auth/refresh`, and vice versa. This is checked server-side against
the DB row, never against which cookie name the client happened to send.

Reuse/theft detection (revoke the whole token family on a reused token) is
unchanged from before the portal split and applies independently per
portal.

## 5. Access token / JWT

Custom HMAC-signed token (`backend/src/modules/security/tokens.ts`), not a
library JWT, but same shape: header.payload.signature, base64url. Payload:
`{sub, email, role, plan, portal, aud, iat, exp}`.

`aud` claim: `stock-harvesting-app` (user) / `stock-harvesting-admin`
(admin) — `TOKEN_AUDIENCE` in `backend/src/shared/constants/security.ts`.
`verifyAccessToken(token, expectedAudience)` takes `expectedAudience` as a
**required** parameter (no default) — every call site must be deliberate
about which portal it expects.

| | TTL | Env var (default) |
|---|---|---|
| USER access token | 15 min | `USER_ACCESS_TOKEN_TTL_SECONDS` (900) |
| USER refresh session | 30 days | `USER_REFRESH_TOKEN_TTL_DAYS` (30) |
| ADMIN access token | 10 min | `ADMIN_ACCESS_TOKEN_TTL_SECONDS` (600) |
| ADMIN refresh session | **4 hours** | `ADMIN_REFRESH_TOKEN_TTL_HOURS` (4) |

Admin sessions are deliberately much shorter-lived than user sessions.

## 6. Route guards (backend)

`backend/src/modules/auth/auth.middleware.ts`:

- `requireAuth` — verifies `aud === stock-harvesting-app`. Used by every
  main-app route (`market-data`, `market-collections`, `watchlists`,
  `price-alerts`, `scanner`, `drawings`, `push-subscriptions`,
  `weekly-strong-backtest`, `ai`).
- `requireAdminAuth` — verifies `aud === stock-harvesting-admin`.
- `requireAdmin` — checks `role === "admin"` on `req.user` (populated by
  whichever of the above ran first).
- Admin routes chain **both**: `adminRouter.use(requireAdminAuth,
  requireAdmin)` (`backend/src/modules/admin/admin.routes.ts`) — portal
  audience alone is not sufficient, role alone is not sufficient.

## 7. Frontend session state

Two entirely separate Zustand stores, never shared:

| | USER | ADMIN |
|---|---|---|
| Store | `src/features/auth/stores/session-store.ts` (`useSessionStore`) | `src/features/auth/stores/admin-session-store.ts` (`useAdminSessionStore`) |
| localStorage key | `stock-harvesting-session-snapshot` | `stock-harvesting-admin-session-snapshot` |
| In-memory access token | `src/features/api/lib/token-store.ts` | `src/features/api/lib/admin-token-store.ts` |
| Fetch wrapper | `apiFetch` (`src/features/api/lib/api-client.ts`) | `adminApiFetch` (`src/features/api/lib/admin-api-client.ts`) |
| Refresh endpoint called | `POST /api/auth/refresh` | `POST /api/admin-auth/refresh` |
| Bootstrap component | `AuthBootstrap` (mounted in root `src/app/layout.tsx`, **skips itself** when `pathname.startsWith("/admin")`) | `AdminAuthBootstrap` (mounted only in `src/app/(app)/admin/layout.tsx`) |

The localStorage snapshot in each store is an **optimistic UI hint only**
(never the access token, never proof of authorization) — every protected
call still goes through a real access token minted by a real refresh
against the backend session.

Note: origin isolation (the two frontend hostnames are different sites)
genuinely keeps **`localStorage`** apart — that store is scoped to the
frontend origin that wrote it, so `useSessionStore`'s and
`useAdminSessionStore`'s snapshots can never leak into each other's
`localStorage` regardless of anything else. **This does not extend to the
API refresh cookies** — those are scoped to the shared backend origin, not
either frontend origin, and their isolation comes entirely from cookie
naming + endpoint separation (§3), not from the frontends being different
sites. Don't conflate the two mechanisms. The separate frontend store
files/names are still worth having independent of either isolation
guarantee: they mean there is no single "current session" object either
portal's code could accidentally read from the wrong context, which
matters most in local dev where both portals can run on `localhost`
variants in the same browser profile.

## 8. Route guards (frontend)

- `AuthGuard` (`src/features/auth/components/AuthGuard.tsx`) wraps
  `AppShell` — redirects to `/login?next=...` when `status !== "authenticated"`.
  Also treats a stray `role === "admin"` USER session as unauthenticated
  (defense in depth; shouldn't be reachable given §2).
- `AdminShell` (`src/features/admin/components/shell/AdminShell.tsx`) —
  redirects to `/admin/login?next=...` when guest; shows
  `AdminForbiddenState` if authenticated but `role !== "admin"`.

## 9. Logout

Portal-specific, symmetric with login: `POST /api/auth/logout` /
`POST /api/admin-auth/logout`, each revoking only its own refresh token row
(scoped by `portal` in the `WHERE` clause) and clearing only its own
cookie. Logging out of one portal cannot affect the other's session —
structurally true because they're different cookies on different DB rows.

## 10. Cross-portal `next` safety

Both login screens only accept a same-portal, path-relative `next`
(`startsWith("/")`, not `startsWith("//")`, not pointing at `/login` or, on
the main site, `/admin`). No open redirects; no way to make the USER login
hand off to an ADMIN-origin `next` or vice versa.

## 11. Legacy `/admin` path on the main host

`stockharvesting.com/admin/*` still 308-redirects to
`admin.stockharvesting.com/*` (`src/proxy.ts`) — **navigation only, no
`Set-Cookie` header on that response**. Visiting it does not authenticate
you on the admin host; you land on `/admin/login` there if you have no
admin session.

## 12. Local development

```bash
# backend/.env
ADMIN_WEB_APP_URL=http://admin.localhost:3000
CORS_ORIGIN=http://localhost:3000,http://admin.localhost:3000

# .env.local (frontend)
NEXT_PUBLIC_ADMIN_HOST=admin.localhost:3000
```

`*.localhost` resolves to loopback in every modern browser (RFC 6761) — no
hosts-file edit needed. See `docs/DEPLOYMENT.md` for the full setup note.

**Known trap**: `src/proxy.ts` must live at `src/proxy.ts`, not the repo
root — Next.js's file-convention resolves proxy/middleware relative to
wherever `app/` lives (`src/app/` in this project). A root-level
`proxy.ts` silently never runs (no build error, no rewrite, hostname
routing just does nothing) — this was found and fixed during the
admin-portal-separation work; re-check this first if hostname routing ever
appears broken again.

## CURRENT GAP

None currently known for the mechanism described above — verified live
(CORS, cookie attributes, cross-portal token/refresh rejection at both the
DB and HTTP layer, hostname routing) during the auth-portal-separation
work. If you find one, record it in `docs/KNOWN_ISSUES.md`, not here.
