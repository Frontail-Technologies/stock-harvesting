# Observability (Prometheus metrics)

Metrics only — this doc does not cover Grafana dashboards (not built yet)
or structured logging (see each feature doc's own "structured logs" notes;
logs and metrics are deliberately kept separate: logs answer "what
happened," metrics answer "how often/how long/how many").

## Endpoints

| Process | Route | Port | Enabled by |
|---|---|---|---|
| API (`server.ts`) | `GET /metrics` | `PORT` (same as the API itself) | `METRICS_ENABLED=true` |
| Worker (`worker.ts`) | `GET /metrics` | `WORKER_METRICS_PORT` (its own private listener — the worker has no other HTTP server) | `METRICS_ENABLED=true` **and** `WORKER_METRICS_PORT` set |

Both processes maintain their **own** Prometheus `Registry` instance
(`backend/src/shared/metrics/metrics.registry.ts`) — metrics are
process-local, never aggregated in-process across API and worker.
Production Prometheus should scrape **both** endpoints separately if the
worker is actually running (it's optional — see `docs/DEPLOYMENT.md`
process topology).

## Metrics endpoint security

`GET /metrics` is for Prometheus scraping, not browser/admin-user access —
it has no `requireAuth`/`requireAdmin` (Prometheus can't do a login flow).

**Preferred production control**: network-level restriction — Prometheus
reaches this route over a private network / VPC, or Nginx allowlists the
scraper's source IP and blocks everyone else. This is the primary control.

**Fallback control**: `METRICS_TOKEN`, if set, is required as
`Authorization: Bearer <token>` on every request to `/metrics` (both the
API and worker endpoints). This exists for deployments that haven't set up
network-level restriction yet — it is a fallback, not a replacement for it.

The worker's private listener additionally binds to `127.0.0.1` only, never
a public interface.

## Naming convention

Every metric is prefixed `stock_harvesting_` (`METRICS_PREFIX`,
`metrics.registry.ts`). Node/process default metrics from `prom-client`'s
`collectDefaultMetrics` keep this same prefix but their own standard
suffixes (`_process_cpu_seconds_total`, `_nodejs_heap_size_bytes`, event
loop lag, GC, etc.) — never renamed.

## Low-cardinality label policy — hard rule

**Never** used as a label anywhere in this codebase: `symbol`,
`instrumentId`, `collectionId`, `userId`, `email`, a raw request path/URL,
an error message, provider response text, or a BullMQ job id. Every label
is one of a small, finite, pre-known set. HTTP routes are labelled by the
**matched route template** (`req.route.path`, prefixed with `req.baseUrl`
for nested routers — e.g. `/api/admin/market-collections/:id/prepare`,
never the raw resolved path), and anything that never matched a route (a
404) is labelled `route="unmatched"` as one fixed value rather than
leaking the attempted path.

## Available metric groups

- **HTTP** (`http-metrics.middleware.ts`): `..._http_requests_total{method,route,status_class}`,
  `..._http_request_duration_seconds{method,route}`. `/metrics` itself is excluded from these.
- **Node/process defaults**: CPU, memory, heap, event loop, GC, uptime — via `collectDefaultMetrics`.
- **Collection preparation** (`market-collection-preparation.service.ts`):
  `..._collection_preparations_total{outcome}` (`ready|partial|failed|stale`
  — `stale` is the membership-version staleness guard preventing an old job
  from publishing final readiness, see `docs/BACKTEST.md`),
  `..._collection_preparation_duration_seconds{outcome}`,
  `..._collection_preparation_members_total{result}` (`with_required_history|unavailable`).
- **Collection status gauge** (`market-collections.metrics.ts`):
  `..._collections_by_preparation_status{status}` — current DB state (one
  grouped `GROUP BY` query, refreshed via `prom-client`'s `Gauge.collect()`
  hook at scrape time, never a query-per-status and never a background poll).
- **Candle backfill / refresh** (`market-data.candle-sync.ts`):
  `..._candle_backfills_total{exchange,outcome}` (`success|failed|deduplicated`
  — `deduplicated` fires when the existing in-flight-promise/cooldown
  mechanism in `runChartBackfillOnce` already avoided duplicate provider work),
  `..._candle_backfill_duration_seconds{exchange,outcome}`,
  `..._candles_upserted_total{exchange,operation}` (`historical_backfill|latest_refresh`,
  real counts from the existing `insertedDaily`/`insertedWeekly`/`insertedMonthly` return values),
  `..._latest_candle_refresh_runs_total{exchange,outcome}`,
  `..._latest_candle_refresh_duration_seconds{exchange,outcome}`,
  `..._latest_candle_refresh_symbols_total{exchange,outcome}`.
- **Backtest generation** (`weekly-strong-backtest.generation.ts`):
  `..._backtest_runs_total{type,outcome}` (`type`: `current_backfill|historical_rebuild|incremental`),
  `..._backtest_duration_seconds{type,outcome}`, `..._backtest_weeks_total{type}`.
  Entry-point instrumentation only — the evaluator/generation internals are untouched and unwrapped.
- **BullMQ** (`worker.ts` centrally via `runTrackedJob`, plus `jobs/queues.ts`):
  `..._bullmq_jobs{queue,state}` (current queue depth via `Queue.getJobCounts()`,
  refreshed at scrape time), `..._bullmq_job_runs_total{queue,job_type,outcome}`,
  `..._bullmq_job_duration_seconds{queue,job_type,outcome}`. `job_type` is always one of the finite `JOB_NAMES` values.
- **Database (application-level only)** (`metrics.ts`): `..._db_connections{state}`
  (`total|idle|waiting`) — the same `pg` `Pool` fields `GET /api/health` already reports, not a new pool instrumentation.

## Deferred this phase

- **Provider request metrics** (`stock_harvesting_provider_requests_total`/
  `_provider_request_duration_seconds`) — audited and **not implemented**.
  The existing central provider boundary, `safeProviderAction`
  (`market-data.candle-sync.ts`), receives a hand-written `action` string
  per call site but no normalized `provider` identifier; the boundary that
  *does* have a clean, already-adopted `providerKey` (`recordProviderSuccess`/
  `recordProviderFailure`, `data-provider-settings.service.ts`) has no
  `operation` label available. Neither boundary cleanly exposes both labels
  the spec requires without scattering instrumentation through every
  adapter — deferred rather than guessed at.

## Postgres/Timescale exporter boundary

Server-side database metrics — cache hit ratio, hypertable chunk count,
locks, disk usage, DB-side CPU — are **not** reimplemented inside this
Node application and never will be; querying Timescale catalog tables on
every scrape would itself be unwanted load. Those belong to
`postgres_exporter` / TimescaleDB's own metrics views, scraped by
Prometheus independently of this application. `..._db_connections` above
is the one exception, and it's application-level pool state, not a
database-server metric.

## Grafana integration boundary

This phase is metrics-only — no Grafana dashboards are built here.
Grafana (when set up) points at: this application's `/metrics` (API and,
optionally, worker), `postgres_exporter`/Timescale metrics for the
database, and node_exporter or equivalent for host-level OS metrics if
needed. Nothing in this repo assumes or depends on Grafana existing.
