# Deployment

## Process topology

Two independent Node processes share the same codebase and the same
`DATABASE_URL`:

| Process | Entry point | npm script | Required to run |
|---|---|---|---|
| API | `backend/src/server.ts` | `npm start` (prod) / `npm run dev` | Always |
| Worker | `backend/src/worker.ts` | `npm run worker` | Only if `REDIS_URL` is set — it exits immediately (code 0) otherwise |

The frontend (`src/`, Next.js) is a separate deployable, calling the API via
`NEXT_PUBLIC_API_BASE_URL`. See `docs/ENVIRONMENT-VARIABLES.md` for the full
variable list for both.

If the admin panel is split onto its own subdomain
(`NEXT_PUBLIC_ADMIN_HOST`), that's routing handled by `src/proxy.ts` inside
the same Next.js deployment — not a separate process.

### Strict portal separation (USER vs ADMIN)

The main site and the admin panel are two independent auth portals with
their own login flow, session cookies (`sh_user_refresh` /
`sh_admin_refresh`), refresh endpoints (`/api/auth/refresh` /
`/api/admin-auth/refresh`), and JWT audience (`stock-harvesting-app` /
`stock-harvesting-admin`) — see `backend/src/modules/auth/`. There is no
SSO between them: logging into one never authenticates the other, even for
the same Google account, even on the same browser. An admin-role account
is rejected outright at `/login` on the main host (no user session is
created), and a non-admin account is rejected outright at `/login` on the
admin host (no admin session is created).

**Local dev setup** — this needs two distinct hostnames so the browser
actually treats them as separate sites (cookie isolation, `localStorage`
isolation):

```bash
# backend/.env
ADMIN_WEB_APP_URL=http://admin.localhost:3000
CORS_ORIGIN=http://localhost:3000,http://admin.localhost:3000

# .env.local (frontend)
NEXT_PUBLIC_ADMIN_HOST=admin.localhost:3000
```

No `/etc/hosts` (or Windows `hosts` file) edit is required — `*.localhost`
already resolves to the loopback address in every modern browser and OS
resolver (RFC 6761), so `http://admin.localhost:3000` just works once the
env vars above are set and `npm run dev` is restarted. Visit
`http://localhost:3000` for the user portal and
`http://admin.localhost:3000` for the admin portal; each keeps its own
cookies/session independently in the same browser.

## Reverse proxy / process manager

**None of the following are checked into this repo**: no `Dockerfile`, no
`docker-compose.yml`, no PM2 `ecosystem.config.js`, no Nginx config, no
`.github/workflows/*` CI. Confirmed by direct audit, not assumed absent.
Whatever reverse-proxy/TLS-termination/process-supervision setup runs in
production is managed outside version control — if you're setting one up,
you need at minimum:

- TLS termination for **two** hostnames (`stockharvesting.com` and
  `admin.stockharvesting.com`) — the auth cookies are `Secure`, so plain
  HTTP will silently fail to authenticate in production.
- A reverse proxy routing both hostnames to the **same** Next.js process
  (this is one app, one build — hostname routing happens inside Next via
  `src/proxy.ts`, not via two separate deployments).
- A reverse proxy (or the Next.js process itself) routing `/api/*` and
  `/ws/market` to the backend API process (`backend/src/server.ts`).
- Process supervision (PM2, systemd, or similar) for the two backend
  processes (API + worker) and the frontend — none is configured in this
  repo today, so a bare `npm start` has no restart-on-crash behavior.

## DNS / admin subdomain requirement

`admin.stockharvesting.com` needs a real DNS record (CNAME or A, matching
whatever the main site's record points at, since it's the same
deployment) pointing at the same target as `stockharvesting.com`. Pair
with `NEXT_PUBLIC_ADMIN_HOST=admin.stockharvesting.com` (frontend) and
`ADMIN_WEB_APP_URL=https://admin.stockharvesting.com` +
`CORS_ORIGIN=https://stockharvesting.com,https://admin.stockharvesting.com`
(backend). See [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) §12 for
local dev, and the "Strict portal separation" section above for why both
origins must be in `CORS_ORIGIN`.

## Build

```bash
# Backend
cd backend
npm install
npm run build        # tsc -> dist/
npm start             # node dist/server.js

# Worker (separate process, same build output)
node dist/worker.js

# Frontend
npm install
npm run build
npm start
```

## Migrations

Migrations are files, not `drizzle-kit push`. Two distinct steps:

```bash
cd backend
npm run db:generate   # diffs schema.ts against drizzle/meta/, writes a new .sql file — never touches the live database
npm run db:migrate    # applies pending migration files to DATABASE_URL — the only command that writes to the schema
```

**Run `db:migrate` as an explicit, deliberate deployment step** — not
automatically on every app boot. Review the generated `.sql` file before
running `db:migrate` against production, especially for anything that isn't
a pure additive `ADD COLUMN`/`CREATE INDEX` (this repo's migration history
so far is entirely additive — no destructive migration has been written,
and that's worth keeping true going forward).

`CREATE INDEX` on a populated table takes a lock that blocks writes for the
duration by default. Both indexes added in this pass
(`sync_jobs_created_at_idx`, `scanner_drawings_user_exchange_symbol_timeframe_idx`)
are on tables small enough that this isn't a practical concern today: check
row counts before running `db:migrate` against production, and use `CREATE
INDEX CONCURRENTLY` by hand instead of the generated migration if a table
has grown large enough that a blocking lock would matter (`drizzle-kit`
doesn't generate `CONCURRENTLY` automatically).

## Backups

Not automated by anything in this repo yet — see `docs/BACKUP-RESTORE.md`
for `scripts/database/backup.sh` and the recommended schedule. Run a backup
before any migration that isn't a pure additive `ADD COLUMN`/`CREATE INDEX`.

## Environment variables

See `docs/ENVIRONMENT-VARIABLES.md` for the full list. `backend/src/shared/env.ts`
validates all of them at process startup via Zod — a missing required
variable or an invalid value fails fast with a clear error instead of
starting in a half-configured state.

## Health check

`GET /api/health` — returns `200` with `{ data: { ok: true, database: {...}
} }` when the database is reachable, `503` with `ok: false` otherwise. Point
your load balancer / process manager's health check at this route, not just
"is the process running" — a previous version of this route always
returned `ok: true` regardless of database state.

## Rollback

This repo has no destructive migrations to roll back today (see
`docs/DATABASE.md` — every existing migration is additive). If a deployment
introduces a bug in application code (not schema), redeploy the previous
build; the database schema is forward-compatible with it since nothing
destructive changed underneath it. If a future migration ever does need a
rollback, write and test the down-migration manually — `drizzle-kit` does
not generate one automatically.
