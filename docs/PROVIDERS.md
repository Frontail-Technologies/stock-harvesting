# Providers

`backend/src/modules/data-provider/*` — an adapter abstraction over three
market-data vendors. No secrets/API keys below — see
`docs/ENVIRONMENT-VARIABLES.md` for variable names only.

## Adapters

| Adapter | Path | Markets | Role |
|---|---|---|---|
| **EODHD** | `adapters/eodhd-data-provider.adapter.ts` | ~70 exchanges globally | Default/fallback provider — historical + latest daily candles, instrument sync. Lowest priority (see below), used wherever nothing more specific applies |
| **Zerodha (Kite)** | `adapters/zerodha-data-provider.adapter.ts` | `NSE`, `NSE_IDX` | OAuth-connected (`requiresConnection: true`); also has a market-stream (WebSocket) realtime provider |
| **GlobalDataFeeds** | `adapters/global-datafeeds/*` | `BSE`, `BSE_IDX` | REST + WebSocket (`GLOBAL_DATAFEEDS_WS_URL`); separate "Fundamentals" REST product (`global-datafeeds-fundamentals/*`) for sector/industry classification, its own access key/base URL, independent of the WS feed |

## Resolver / priority

Two-step resolution:

1. **`getDataProviderAdapterForExchange`** (`data-provider.registry.ts`) —
   a hardcoded 1:1 exchange→provider map: `NSE`/`NSE_IDX` → Zerodha,
   `BSE`/`BSE_IDX` → GlobalDataFeeds, everything else → EODHD.
   `adapterSupportsCapability()` gates by `ProviderCapability`
   (`instrument_sync`, `historical_daily_candles`, `latest_daily_candles`,
   `instrument_search`, `instrument_token`, `exchange_list`, `realtime_ws`).
2. **`resolveEligibleProviders({exchange, capability})`**
   (`data-provider.service.ts`) — the real decision point. Checks, per
   candidate: DB-stored `enabled` flag and `priority`
   (`data_provider_settings` table, via `data-provider-settings.service.ts`),
   plus a 15s-cached "ready to use" check (`isConfigured()`, and for
   Zerodha specifically, live OAuth connection status).
   `getEligibleProviderAdapter()` returns the first enabled+ready
   candidate sorted ascending by `priority` (lower = higher priority).

**Seed priorities** (`DATA_PROVIDER_SETTINGS_SEEDS`,
`backend/src/shared/constants/domain.ts`): Zerodha `1`, GlobalDataFeeds
`1`, EODHD `100` — EODHD is the intentional lowest-priority fallback.
Admins can change `enabled`/`priority` per provider via
Admin → Data Providers (`/admin/data-providers`).

## Environment variables (names only — see `docs/ENVIRONMENT-VARIABLES.md`)

| Provider | Key vars |
|---|---|
| Default selection | `DATA_PROVIDER` |
| EODHD | `EODHD_API_TOKEN`, `EODHD_EXCHANGE_CODE` |
| Zerodha | `ZERODHA_API_KEY`, `ZERODHA_API_SECRET`, `ZERODHA_REDIRECT_URL` |
| GlobalDataFeeds (WS feed) | `GLOBAL_DATAFEEDS_ENABLED`, `GLOBAL_DATAFEEDS_API_KEY`, `GLOBAL_DATAFEEDS_WS_URL`, `GLOBAL_DATAFEEDS_EXCHANGES`, `GLOBAL_DATAFEEDS_SYMBOL_LIMIT` |
| GlobalDataFeeds Fundamentals | `GLOBAL_DATAFEEDS_FUNDAMENTALS_ENABLED`, `GLOBAL_DATAFEEDS_FUNDAMENTALS_ACCESS_KEY`, `GLOBAL_DATAFEEDS_FUNDAMENTALS_BASE_URL`, `GLOBAL_DATAFEEDS_FUNDAMENTALS_EXCHANGE` (note: vendor account emails call this product "BSE-FD", but the API itself only accepts `BSE` as the value) |

## Failure / fallback behavior

- **`GetHistory` intermittent timeout (GlobalDataFeeds)**: a documented,
  known vendor flakiness — see the constant's own comment,
  `GLOBAL_DATAFEEDS_HISTORY_REQUEST_TIMEOUT_MS` (9s, scoped only to
  `GetHistory`/`fetchDailyCandles` — not the 30s default used by every
  other GlobalDataFeeds request type). A worst-case bad attempt now costs
  ~9-10s instead of ~30s+ before its retry kicks in.
- **Credential/connection failure** (e.g. Zerodha OAuth expired): that
  provider drops out of `resolveEligibleProviders`'s candidate list;
  whatever's next by priority for that exchange (if any) takes over. If no
  candidate is eligible, the calling code (`getEligibleProviderAdapter`
  returning `null`) is responsible for handling "no provider available" —
  check the specific call site, this is not a single global fallback.
- **Realtime WS disconnect**: see [CHARTS.md](./CHARTS.md) — the frontend
  `useMarketStream` hook auto-reconnects after 2.5s indefinitely; already-
  rendered chart data is never cleared on disconnect.
- **Admin "Data Providers" page — local status vs. external health are two
  separate request paths, by design:**
  - **Local status** — `GET /api/admin/data-provider/statuses` →
    `getAllProviderLocalStatuses` → `getProviderStatus`. Env- and DB-derived
    only, **zero external provider calls**, so it resolves in a few ms.
    Returns per provider: `providerConfigured` (`adapter.isConfigured()`),
    `enabled`, `priority`, `requiresConnection`, `connected` / `status`
    (DB-derived for OAuth Zerodha via its stored connection row + token
    expiry; mirrors `providerConfigured` for non-OAuth providers, which
    have no connection concept), `lastSyncedAt`, `errorMessage` (stored
    connection error). The singular `GET /api/admin/data-provider/status`
    is the same, scoped to Zerodha. Frontend: `useAdminDataProviderStatus`
    / `useAdminDataProviderStatuses`, `retry: 1`, `AbortSignal.timeout` 8s.
  - **External health** — `GET /api/admin/data-provider/health/:provider` →
    `getProviderHealth` → `checkConnectionWithTimeout(adapter)`. This is the
    only path that runs `adapter.checkConnection()` (GDF WS `GetInstruments`
    ping, EODHD sample-candle fetch), bounded by
    `PROVIDER_HEALTH_CHECK_TIMEOUT_MS` (6s) with a swallowed rejection, so a
    slow/dead provider resolves to `status: "error"`, never hangs. One
    endpoint **per provider** so a GlobalDataFeeds timeout can't delay
    EODHD's card and vice versa. Frontend: `useAdminDataProviderHealth(provider)`,
    one independent React Query per card, `retry: 1`, `AbortSignal.timeout` 12s.
  - The page renders "Provider config" from the local query only ("Checking…"
    while it is pending, "Unable to check" only if that request itself
    fails), and a separate "Health" row + connection badge from the health
    query ("Checking…" → Healthy / Error / Unknown). A slow external health
    check never puts "Provider config" into "Checking…".

## BSE instrument persistence universe

`toGlobalDatafeedsInstrument` (`adapters/global-datafeeds/global-datafeeds.mapper.ts`)
maps every row `GetInstruments`/`Exchange=BSE` returns into the `instruments`
table. For `exchange === "BSE"` specifically, a row is persisted whenever it
passes `isBseEquityIdentity` — **identity only**: an ISIN starting `INE`
(the real ISO 6166 prefix for an Indian equity security). This is the
**reference/security universe** — it is not a chart-readiness filter and
does not gate on `QuotationLot`, 52-week high/low, trading `Series`, or
`IsCommonExchange` (SME-board and recently-listed BSE constituents
legitimately have `QuotationLot > 1`, no 52-week range yet, a series
outside the historically-assumed set, **and** `IsCommonExchange: false` —
confirmed directly against a live `GetInstruments` response: real,
INE-ISIN SME-board securities like `ABRIL`/`ACCORDTS`/`ANL`/`ADMACH` all
carry `IsCommonExchange: false`, so gating on it would have continued
silently dropping exactly the securities this fix exists for). A stricter
filter here silently dropped real, importable BSE securities, e.g. SME IPO
collection constituents. `exchange === "BSE_IDX"` is unaffected — this
identity gate never applies to it.

Persisting an instrument does **not** imply it has candle/quote data.
Whether a symbol is usable for a specific market-data feature is decided at
that feature's own boundary, and every consumer that matters already
degrades gracefully on missing/insufficient history rather than assuming
every persisted row is chartable: `computeAllRelativeStrengthMetrics` and
`computeWeeklyStrongStocks` (`market-data.metrics.ts`) both skip an
instrument with no or too-short candle history; `getChartCandles`
(`market-data.service.ts`) resolves a symbol with no history to an
empty/no-data response, not an error. No separate eligibility gate exists
between persistence and these — if one is ever genuinely needed for a new
feature, add it at that feature's own fetch boundary, not back into the
persistence mapper.

## Live diagnostics

Backend scripts (run with `tsx`, not part of the normal build):
`npm run provider:test:eodhd`, `npm run provider:test:global-datafeeds`
(`backend/package.json`). Useful for confirming a provider is actually
reachable/configured without going through the full app.
