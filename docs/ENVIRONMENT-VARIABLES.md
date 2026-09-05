# Environment variables

Every variable listed here is read somewhere in the actual codebase — this
list was built by grepping `process.env`/`env.ts`, not from memory. Backend
variables are validated at startup by `backend/src/shared/env.ts` (Zod) —
an invalid or missing required value fails fast with a clear error rather
than starting in a half-configured state.

## Backend (`backend/.env`, validated by `shared/env.ts`)

### Core

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` \| `test` \| `production` |
| `PORT` | No | `4000` | API listen port |
| `WEB_APP_URL` | No | `http://localhost:3000` | Main frontend origin (used in OAuth redirects etc.) |
| `ADMIN_WEB_APP_URL` | No | falls back to `WEB_APP_URL` | Admin frontend origin — where a Google login started from the admin portal (`?portal=admin`) round-trips back to after auth, instead of the main site. Mirrors the frontend's `NEXT_PUBLIC_ADMIN_HOST`; only needed if the admin panel is split onto its own host |
| `API_BASE_URL` | No | `http://localhost:4000` | This API's own base URL |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Comma-separated list of allowed origins. Must include every frontend host that calls this API — e.g. add the admin subdomain host here if `NEXT_PUBLIC_ADMIN_HOST` is set on the frontend |
| `DATABASE_URL` | **Yes** | — | Postgres connection string. Currently a Neon pooler endpoint — see `docs/DATABASE.md` |

### Database connection pool

All optional; defaults are conservative for the current single-API +
single-worker-process deployment (see `docs/DATABASE.md` for the
max-connections calculation before raising `DB_POOL_MAX`).

| Variable | Default | Purpose |
|---|---|---|
| `DB_POOL_MAX` | `10` | Max connections per process |
| `DB_CONNECTION_TIMEOUT_MS` | `5000` | Time to wait for a pool connection before failing |
| `DB_IDLE_TIMEOUT_MS` | `10000` | How long an idle connection stays open before closing |
| `DB_STATEMENT_TIMEOUT_MS` | `30000` | Postgres server-side `statement_timeout` |
| `DB_QUERY_TIMEOUT_MS` | `30000` | `pg` client-side query timeout |

### Redis / jobs

| Variable | Required | Purpose |
|---|---|---|
| `REDIS_URL` | No | If set, enables BullMQ (queued syncs, the repeatable scheduled instrument sync, and the worker process). If unset, admin-triggered syncs run inline in the API process instead, and `worker.ts` exits immediately on start. Redis is used **only** as BullMQ transport in this codebase — not a response cache, session store, or rate limiter |

### Auth / security

| Variable | Required | Purpose |
|---|---|---|
| `ACCESS_TOKEN_SECRET` | **Yes** (min 32 chars) | JWT access token signing |
| `REFRESH_TOKEN_SECRET` | **Yes** (min 32 chars) | Refresh token signing |
| `USER_ACCESS_TOKEN_TTL_SECONDS` | No (default `900` = 15m) | USER portal access token lifetime |
| `USER_REFRESH_TOKEN_TTL_DAYS` | No (default `30`) | USER portal refresh session lifetime |
| `ADMIN_ACCESS_TOKEN_TTL_SECONDS` | No (default `600` = 10m) | ADMIN portal access token lifetime — kept short deliberately |
| `ADMIN_REFRESH_TOKEN_TTL_HOURS` | No (default `4`) | ADMIN portal refresh session lifetime — kept short deliberately; an idle admin console re-prompts for login well before an idle user session would |
| `ENCRYPTION_MASTER_KEY` | **Yes** (min 32 chars) | AES-256-GCM field encryption (provider tokens, AI API keys) |
| `ENCRYPTION_KEY_VERSION` | No (default `v1`) | Key version tag stored alongside encrypted fields, for future key rotation |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Google OAuth login |
| `TURNSTILE_SECRET_KEY` | Required in production auth protection | Cloudflare Turnstile secret key used only by the backend Siteverify call |
| `AUTH_OTP_EMAIL_WEBHOOK_URL` | Required for production registration OTP email | Backend webhook URL for registration OTP delivery |
| `AUTH_OTP_EMAIL_WEBHOOK_TOKEN` | No | Bearer token sent to the OTP email webhook |

### Data providers

| Variable | Default | Purpose |
|---|---|---|
| `DATA_PROVIDER` | `eodhd` | `eodhd` \| `zerodha` \| `global-datafeeds` — default provider selection |
| `EODHD_API_TOKEN` | — | EODHD vendor API key |
| `EODHD_EXCHANGE_CODE` | `US` | Default EODHD exchange scope |
| `ZERODHA_API_KEY` / `ZERODHA_API_SECRET` | — | Zerodha Kite Connect credentials |
| `ZERODHA_REDIRECT_URL` | — | Kite OAuth callback URL |
| `GLOBAL_DATAFEEDS_ENABLED` | `false` | Enables the GlobalDataFeeds WebSocket feed adapter |
| `GLOBAL_DATAFEEDS_API_KEY` | — | WebSocket feed key (separate product from Fundamentals below) |
| `GLOBAL_DATAFEEDS_WS_URL` | vendor test URL | WebSocket endpoint |
| `GLOBAL_DATAFEEDS_EXCHANGES` | `BSE,BSE_IDX` | Exchanges routed to this provider |
| `GLOBAL_DATAFEEDS_SYMBOL_LIMIT` | `100` | Max symbols subscribed per connection |
| `GLOBAL_DATAFEEDS_FUNDAMENTALS_ENABLED` | `false` | Enables the separate Fundamentals REST product (sector/industry classification) |
| `GLOBAL_DATAFEEDS_FUNDAMENTALS_ACCESS_KEY` | — | Fundamentals product's own key (distinct from the WebSocket key) |
| `GLOBAL_DATAFEEDS_FUNDAMENTALS_BASE_URL` | vendor test URL | Fundamentals API base URL |
| `GLOBAL_DATAFEEDS_FUNDAMENTALS_EXCHANGE` | `BSE` | Query param value — the vendor's account emails call this product "BSE-FD", but the API itself only accepts `BSE` |
| `GEMINI_API_KEY` | — | Fallback/default Gemini key (admin can also set a per-deployment key via the AI settings UI) |
| `GEMINI_EXTRACTION_MODEL` / `GEMINI_CHAT_MODEL` | — | Override the default model per task type |

### Web Push (price alert notifications)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VAPID_PUBLIC_KEY` | No | — | Web Push VAPID public key. Generate a pair with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | No | — | Web Push VAPID private key |
| `VAPID_SUBJECT` | No | `mailto:support@stockharvesting.com` | Contact URI sent with push requests |

Without `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, price alerts still work but can't deliver browser push notifications.

## Backend backup/restore scripts (not validated by `env.ts` — read directly by the shell scripts)

| Variable | Required by | Purpose |
|---|---|---|
| `BACKUP_DIR` | `backup.sh`, `restore-test.sh` | Where backups are written/read (default `./backups`) |
| `BACKUP_RETENTION_DAYS` | `backup.sh` | Delete backups older than N days (default `14`, `0` disables cleanup) |
| `SCRATCH_DATABASE_URL` | `restore-test.sh` | **Required.** Throwaway database for restore testing — must differ from `DATABASE_URL`, checked explicitly |
| `VERIFY_TABLES` | `restore-test.sh` | Space-separated table list to row-count after restore (default: `instruments candles users market_collections sync_jobs`) |

## Frontend (`.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | Backend API origin the frontend calls directly (cross-origin `fetch`, `credentials: "include"`) |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL — used for metadata/OG tags, sitemap/robots generation, and as the fallback origin when reconstructing the admin URL's protocol |
| `NEXT_PUBLIC_ADMIN_HOST` | No | Host (not full URL) that serves the admin panel on its own subdomain, e.g. `admin.example.com`. Unset keeps `/admin` on the main host — see `src/proxy.ts`. When set, the admin host gets its own login (`/login` there → `AdminLoginScreen`, not the main site's login) and every admin URL is prefix-less (`admin.example.com/users`, not `.../admin/users`) — pair with the backend's `ADMIN_WEB_APP_URL` and add the admin origin to `CORS_ORIGIN` |
| `NEXT_PUBLIC_DEV_MOCK_FALLBACK` | No | `"true"` enables mock-data fallbacks in dev when the backend is unavailable |
| `NEXT_PUBLIC_DEBUG_MARKET_STREAM` | No | Verbose console logging for the live market-data WebSocket stream |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Required in production auth protection | Public Cloudflare Turnstile site key for login challenges |

AdSense is no longer environment-configured. Mode (off/preview/live), the
AdSense publisher ID, and each placement's enabled/slot-ID are all runtime
settings, stored in Postgres (`monetization_settings`/`ad_placements`) and
managed from Admin → Monetization → Ads (`/admin/ads`). The frontend reads
them from the public `GET /api/monetization/config` endpoint at runtime —
there is no `NEXT_PUBLIC_ADSENSE_*` env var anymore, so there's exactly one
source of truth and it takes effect without a redeploy. A fresh database
defaults to `mode = off` with every placement disabled, so no ads render
until an admin explicitly configures them.

## Adding a new variable

Backend: add it to the Zod schema in `shared/env.ts` (required vars have no
`.default()`/`.optional()`), then reference it via `env.YOUR_VAR` —
never `process.env.YOUR_VAR` directly outside that one file, so validation
actually runs. Frontend: `NEXT_PUBLIC_` prefix is required for
client-visible values; anything without it is server-only in Next.js.
