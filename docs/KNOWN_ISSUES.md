# Known Issues

Only issues confirmed during this repository audit. No speculative TODOs.

---

### (Resolved this pass) Proprietary evaluator logic was duplicated client-side in Charts

**Severity was CRITICAL.** Two frontend files reimplemented the Weekly
Strong evaluator's near-high threshold/window logic from raw candles,
shipped in the production JS bundle:

- `src/features/scanner/lib/near-250-week-high-scan.ts` — computed the
  scan-highlight bands client-side, and (worse) was given **priority over**
  the correct backend-sourced result whenever it produced a value, making
  the existing backend endpoint (`GET /api/scanner/results`, already fully
  wired via `useScannerResults`) effectively dead code in the common case.
- `src/features/scanner/lib/build-backtest-stats-from-candles.ts` — used
  the same threshold to build simulated trades and compute backtest stats
  (hit rate, return, drawdown, profit factor) entirely client-side, as a
  fallback whenever the real backend result (`computeSymbolBreakoutBacktest`,
  which runs the full two-condition evaluator) wasn't yet loaded. This
  fallback was also a known **correctness** gap, not just a leak — the
  backend function's own comment documents that this weekly-only
  simplification "silently dropped the daily confirmation condition,"
  producing different numbers than the real evaluator.

Both were removed. Both had a correct, already-built, already-tested
backend counterpart that the frontend already had hooks for
(`useScannerResults`, `useScannerBacktest`) — the fix was reordering/
simplifying existing wiring to prefer the backend result unconditionally,
not building new backend infrastructure. `ScannerBacktestStatsOverlay`
already handled a `null` stats value by rendering nothing, so no UI
redesign was needed.

Also fixed: the live scanner-results API response
(`calculateCurrentNear250WeekHighResult` in
`backend/src/modules/scanner/scanner.service.ts`) was returning the full
internal `metrics` object (`highestClose250`, `threshold85`,
`currentVsHighestClosePct`, `distanceAboveThresholdPct`, `lookbackWeeks`)
to the client, even though the frontend only ever reads `latestMatched`.
Two of those fields alone make the 0.85 ratio trivially recoverable
(`threshold85 / highestClose250`). Trimmed to `{latestMatched}` only via
a new `toClientScanMetrics` function, covered by
`scanner.service.test.ts`.

**Verified**: backend `tsc`/tests clean, frontend `tsc`/`eslint`/build
clean, live endpoint re-tested against real data (response now returns
exactly `{"latestMatched":false}`), and the production bundle was grepped
for the removed identifiers/ratio and confirmed absent
(`highestClose250`, `threshold85`, `NEAR_HIGH_THRESHOLD`, literal `0.85`
— zero matches in `.next/static/chunks/*.js`).

**Relevant files**: `src/features/scanner/components/ScannerPage.tsx`,
`backend/src/modules/scanner/scanner.service.ts`. See
`docs/REGRESSION_RULES.md` rule 26.

---

### (Resolved this pass) Scanner's live near-high scan disagreed with its own backtest overlay

**Severity was HIGH — a live production correctness bug**, not just a
duplication smell. `scanner/rules/near-250-week-high.ts` (the live scan
behind `GET /api/scanner/results`) ran its own independent, weekly-only
"close within ratio of its rolling high" check. `computeSymbolBreakoutBacktest`
(the backtest overlay on the same Charts page) used the canonical
two-condition evaluator (`weekly-strong-evaluator.ts`), requiring BOTH a
daily and a weekly leg to pass. `market-data.service.ts`'s own comment on
`computeSymbolBreakoutBacktest` already documented that the weekly-only
version "silently dropped the daily confirmation condition, which is why
its numbers didn't match 'our logic'" — but that comment was written when
the backtest path was fixed; the live path was never migrated off the
weekly-only rule at the same time.

**Fix**: `scanner/rules/near-250-week-high.ts` now delegates to
`evaluateWeeklyStrongSeries` (the same canonical evaluator) instead of
computing its own threshold. Both the live scan and the backtest now fetch
their input through one shared function, `getSymbolWeeklyStrongSeriesInput`
(`market-data.service.ts`) — same daily+weekly series, same completed-week
trim, same minimum-history gate — and derive their window sizes through
one shared function, `deriveScannerLookbackBars`
(`weekly-strong-evaluator.ts`). The dead `NEAR_250_WEEK_HIGH_RULE` constant
(the old rule's own duplicate copy of the 0.85 threshold) was removed.

**Verified**: new consistency tests in `near-250-week-high.test.ts` assert
the live-scan wrapper produces exactly the evaluator's own pass/fail
decision bar-for-bar, including a case that a weekly-only rule would have
wrongly called a match (weekly leg passes, daily leg fails). Backend
`tsc`/full test suite clean (171 tests). See
`docs/REGRESSION_RULES.md` rule 27.

**Relevant files**: `backend/src/modules/scanner/rules/near-250-week-high.ts`,
`backend/src/modules/scanner/scanner.service.ts`,
`backend/src/modules/scanner/scanner.constants.ts`,
`backend/src/modules/market-data/market-data.service.ts`,
`backend/src/modules/market-data/weekly-strong-evaluator.ts`.

---

### (Resolved this pass) 55-day change calculation — off-by-one check

**Audit finding**: checked `calculate55DayChange`
(`backend/src/modules/market-data/market-data.service.ts`) specifically
for a 54-vs-55 observation off-by-one bug, since the code compares
`dailyRows[length - 1]` (latest) against
`dailyRows[length - 1 - 54]` (base). **No bug found** — the index
difference of 54 spans exactly 55 elements inclusive (the base close and
the latest close, with 53 closes between them), matching "55 daily
observations including the latest day." The eligibility gate
(`dailyRows.length <= 54` excluded) correctly requires at least 55 stored
rows before this can run. This entry exists so the question doesn't get
re-litigated without cause — if you suspect a regression here, re-check
the actual indices, not this note.

**Documentation-side issue found and fixed**: `docs/DASHBOARD.md`
previously restated the formula inline with the phrase "close[55 sessions
ago]," which — unlike the code's own "54 trading sessions ago" — was
imprecise about which index it meant. Rewritten to point at the backend
implementation as the source of truth instead of restating arithmetic in
prose (see [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md) — this is also
a general policy now, not just a one-off fix).

---

### (Resolved this pass) BullMQ/Redis fallback behavior — previously documented inconsistently

**Issue**: `docs/ARCHITECTURE.md`, `docs/MARKET_DATA.md`, and
`docs/BACKTEST.md` each described the "what happens without `REDIS_URL`"
behavior slightly differently, and one research pass concluded "no inline
fallback exists anywhere," which was incomplete — it had checked
`worker.ts`/the repeatable-schedule path but missed that
`backend/src/modules/admin/admin.service.ts`'s admin-triggered job
functions (`triggerInstrumentSync`, `triggerPriceRefresh`,
`triggerWeeklyStrongBacktestBackfill`,
`triggerWeeklyStrongBacktestHistoricalRebuild`) each have a real,
working inline-execution branch when `getMarketDataQueue()` returns
`null`.

**Resolution**: verified directly against `admin.service.ts` and
`queues.ts`. The accurate picture (now reflected consistently across all
three docs, see `docs/ARCHITECTURE.md`'s per-operation table): admin-
triggered, request-scoped actions either always run inline or have a
working inline fallback; only the automatic, schedule-driven paths (the
repeatable instrument-sync job and the Weekly Strong incremental sync
piggybacked on it) have no fallback and simply don't run without
`REDIS_URL` + a running `worker.ts` process.

**Relevant files**: `backend/src/modules/admin/admin.service.ts`,
`backend/src/modules/jobs/queues.ts`, `backend/src/worker.ts`.

---

### (Resolved this pass) Dashboard was disabled in production, live in development

**Was**: `/dashboard` unconditionally `redirect("/charts")` when
`NODE_ENV=production` (`IS_PRODUCTION_LOCKDOWN`). Anyone testing Dashboard
changes locally would see it working; the same build in production
silently hid it.

**Resolution**: the gate was a plain `NODE_ENV` check with no auth/security
logic of its own (`AppShell`'s `AuthGuard` already enforces real
authentication independently, unaffected by this change) and was
self-described as "legacy" in its own comment. Dashboard's underlying
features (55-day metric, snapshots, cross-filter, Weekly Strong table,
Backtest) were already confirmed working. Removed the gate from
`src/app/(app)/dashboard/page.tsx` only — `IS_PRODUCTION_LOCKDOWN` itself
is still used (unrelated purpose: a dev-vs-prod UI difference in
`AdminSidebar.tsx`'s logout button) and was left alone. Verified with a
real production build + `next start`: `/dashboard` now returns `200` in
production instead of redirecting.

**Relevant files**: `src/app/(app)/dashboard/page.tsx`.

---

### (Resolved this pass) `/stocks`, `/profile`, `/admin/jobs` orphaned implementations removed

**Was**: three routes redirected unconditionally with orphaned feature
code behind them (see the entry this replaces, below, for the original
finding).

**Resolution**: re-verified repo-wide (imports, nav links, tests,
sitemap, share-links) before deleting anything. Found one nuance the
original finding missed: `StockQuickChartPreview` (inside
`src/features/stocks/`) is **not** dead — it's actively used by
`WeeklyStrongStockTable.tsx` on the live Dashboard. Deleted only the
genuinely-unreferenced code:

- `src/features/profile/` — entire directory (4 components, hooks, lib,
  types; confirmed zero importers anywhere outside itself).
- `src/features/stocks/components/StocksTable.tsx`,
  `StockTableToolbar.tsx`, `StocksTableSkeleton.tsx`,
  `hooks/use-live-stock-prices.ts` — confirmed zero importers outside
  themselves. `StockQuickChartPreview.tsx` kept (see above); the barrel
  `index.ts` now exports only that.
- `src/features/admin/components/jobs/AdminJobsPage.tsx`,
  `src/features/admin/hooks/use-admin-jobs.ts`, plus the now-unused
  `getAdminJobs` API function and `AdminSyncJob`/`AdminJobsResponse`
  types. Left `queryKeys.admin.jobs` and its 4 (now-no-op but harmless)
  invalidation call sites in `use-admin-data-provider.ts` alone — an
  unrelated, currently-working file, not worth touching for a no-op
  cleanup.

**Routes themselves were NOT deleted** — `/stocks`, `/profile` (→
`/charts`) and `/admin/jobs` (→ `/admin/users`) still redirect, matching
this codebase's own existing pattern for `/admin/data-provider` (singular
→ plural). No evidence any of the three were ever real, externally-linked
pages, but the redirect stubs are cheap enough to keep as a safety net.

**Relevant files**: see `git log` for this pass; full list also in this
doc's own audit trail.

---

### Realtime disconnect has no UI indicator

**Impact**: `useMarketStream` returns `{status, lastEvent}`, but
`ScannerPage`/`ScannerChart` discard `status` at the call site. On a
WebSocket disconnect, the chart keeps showing the last successfully-
fetched candles (correct — see
[REGRESSION_RULES.md](./REGRESSION_RULES.md) #6) but gives the user no
signal that live updates have stopped. A stale-looking "live" chart during
an outage could be mistaken for genuinely live data.

**Relevant files**: `src/features/market-stream/hooks/use-market-stream.ts`,
`src/features/scanner/components/ScannerPage.tsx` (or wherever the hook
is actually called).

**Suggested next step**: surface `status` in the toolbar (a small
connected/reconnecting indicator) — low-risk, additive UI change.

---

### No exchange holiday calendar

**Impact**: `getLatestExpectedTradingDay` (`trading-calendar.ts`) is
timezone/weekday-aware but models **no market holidays**. A holiday will
be treated as a normal trading day, so a chart can read "stale" the day
after a holiday when the provider genuinely has nothing new yet — the
incremental refresh path just finds no new data (safe, not a data-
correctness bug — see [MARKET_DATA.md](./MARKET_DATA.md)), but it's a
perceived-freshness/UX gap and does mean any "as-of date" surfaced to
users can be nominally wrong around holidays.

**Relevant files**: `backend/src/modules/market-data/trading-calendar.ts`
(the file's own header comment already documents this gap).

**Suggested next step**: would need a real per-exchange holiday calendar
(likely a new table or a vendored static list) before this is worth
fixing — not a quick patch. Low priority given the actual failure mode is
"one extra harmless incremental refresh attempt," not corrupted data.

---

### Naming inconsistencies worth knowing about (no functional impact)

- `/admin/ads` route renders `AdminMonetizationPage` — route says "ads,"
  component says "monetization."
- The backend module `push-subscriptions` has no matching
  `src/features/push-subscriptions` frontend folder — the actual
  push-subscription registration code lives inside
  `src/features/price-alerts/api/push-client.ts` instead.
- `/admin/data-provider` (singular, legacy) redirects to
  `/admin/data-providers` (plural, current) — dead page, harmless.

None of these need action on their own; they're listed so a future search
for "the ads page" or "the push-subscriptions feature" doesn't stall on a
name that doesn't match what's actually there.
