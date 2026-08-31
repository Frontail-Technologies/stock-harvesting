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

## Live diagnostics

Backend scripts (run with `tsx`, not part of the normal build):
`npm run provider:test:eodhd`, `npm run provider:test:global-datafeeds`
(`backend/package.json`). Useful for confirming a provider is actually
reachable/configured without going through the full app.
