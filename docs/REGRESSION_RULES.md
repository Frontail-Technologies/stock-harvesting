# Regression Rules

Hard rules. Every rule below is confirmed against actual current code
(source cited) unless marked `PENDING` (a directive with no violation
found, but not exhaustively provable from a read-only audit). Breaking a
`CONFIRMED` rule is a regression, not a style choice.

1. **`/charts` must not choose a default stock.**
   `CONFIRMED` — `hasStockInUrl = Boolean(symbolParam) && Boolean(exchangeParam)`;
   a URL missing either half renders `ScannerEmptyState`, never a guessed
   stock. `ScannerPage.tsx`.

2. **URL symbol + exchange are authoritative for Charts.**
   `CONFIRMED` — `useScannerUiStore`'s `persist` `partialize` explicitly
   excludes `selectedSymbol`/`selectedExchange`/`selectedStock` from
   localStorage, specifically so a bare `/charts` visit never reopens a
   stale selection.

3. **Exchange selection is feature-scoped, not global.**
   `CONFIRMED` — Charts' exchange comes from the URL only
   (`scanner-ui-store.ts`); Dashboard/segment exchange selection is a
   separate concern (`useMarketStore`, `src/features/market/stores/market-store.ts`).
   Do not introduce a single shared "current exchange" global.

4. **Fresh stored daily candles must not trigger a full historical
   provider backfill.**
   `CONFIRMED` — `getChartCandles` only full-backfills on empty/split-
   discontinuity/missing-older-range; a merely-stale-but-present series
   takes the incremental path only (rule 5). `market-data.service.ts`.
   This is the fix for a real historical regression — see
   [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) if re-litigating this area.

5. **Routine stale daily refresh remains incremental.**
   `CONFIRMED` — `isLatestDailyCandleStale` → `runLatestCandleRefreshOnce`
   → `syncLatestDailyCandlesForSymbols` (a ~14-day window via the
   `latest_daily_candles` capability), never the full-range path.

6. **Realtime failure must not blank stored history.**
   `CONFIRMED` — `useMarketStream` only ever merges/appends to the
   already-rendered candle series; a disconnect stops new ticks but never
   clears what's already displayed. `src/features/market-stream/hooks/use-market-stream.ts`.

7. **1W/1M must not independently fetch years of provider history.**
   `CONFIRMED` — derived in-process from already-fetched daily rows
   (`aggregateWeeklyCandles`/`aggregateMonthlyCandles`,
   `candle-aggregation.ts`), not fetched per-timeframe from a provider. A
   legacy fallback reads pre-stored `1W`/`1M` rows only when a symbol has
   *zero* daily rows — don't widen that fallback into a new provider call.

8. **Dashboard state must not mutate Charts' global stock identity.**
   `PENDING` (architecturally true — Dashboard and Charts use entirely
   separate Zustand stores and neither writes to the other's URL params or
   store; no cross-write found in this audit, but not exhaustively grepped
   for every call site). Keep it that way: Dashboard must never call
   `setSelectedSymbol`/write `?symbol=` on Charts' behalf.

9. **Persisted backtests must not be recomputed during normal page
   render.**
   `CONFIRMED` — `GET /api/weekly-strong-backtest/*` always reads
   `weekly_strong_backtest_runs`/`_members`; generation only happens via
   explicit admin triggers or the piggybacked incremental sync job.

10. **Historical membership calculations must resolve point-in-time
    membership.**
    `CONFIRMED` — `historical_membership` mode always resolves via
    `getCollectionMembershipAt()` against `market_collection_versions`,
    never against current `market_collection_members`.

11. **Do not blend historical/current membership modes.**
    `CONFIRMED` — `membershipMode` is part of the unique key on
    `weekly_strong_backtest_runs`; a run is always exactly one mode.

12. **Public UI must not expose proprietary formulas/thresholds.**
    `DIRECTIVE` — the Weekly Strong evaluator's actual qualification logic
    (`backend/src/modules/market-data/weekly-strong-evaluator.ts`) and any
    backtest qualification thresholds must never appear in product copy,
    marketing pages, or public-facing docs (including files under
    `docs/` other than this one referencing it only by name). The 55-day
    relative-strength formula (top Dashboard widgets) is *not* secret —
    it's a simple, disclosed calculation — but the Weekly Strong
    evaluator's near-multi-year-high thresholds are treated as
    proprietary; see [DASHBOARD.md](./DASHBOARD.md)/[BACKTEST.md](./BACKTEST.md)
    for how this repo's own docs already handle that split. Full trust
    boundary: [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md).

12a. **Proprietary/business decision logic must not exist in the frontend
    bundle.** `DIRECTIVE` — the browser is not a trusted execution
    environment (anything shipped client-side is readable by anyone). This
    is stricter than "don't show it in the UI": the *code* implementing an
    evaluator/scoring/qualification rule must not ship to the client at
    all, not just be hidden behind a toggle. See
    [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md).

12b. **API responses must not expose unnecessary evaluator internals.**
    `DIRECTIVE` — return only the final, UI-safe value a client actually
    renders. Do not return partial scores, per-condition pass/fail flags,
    or other intermediate values "because they're available" — that's
    reverse-engineerable even without the formula being named. See
    [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md) "API response
    minimization."

12c. **Duplicate domain calculations across frontend/backend are
    prohibited.** `DIRECTIVE` — one canonical implementation, backend-side.
    A frontend re-derivation of a backend formula (even a disclosed one
    like 55-day change) is a second source of truth waiting to drift out
    of sync. See [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md),
    [ENGINEERING_RULES.md](./ENGINEERING_RULES.md).

13. **Product terminology is "Charts," not "Scanner."**
    `CONFIRMED` — route, page `<title>`, and all new user-facing copy say
    "Charts"; `next.config.ts` 308-redirects the legacy `/scanner` path.

14. **Internal Scanner identifiers may remain intentionally.**
    `CONFIRMED` — `src/features/scanner/*`, `ScannerPage`,
    `scanner-ui-store`, etc. are deliberately unrenamed. Do not do a
    wholesale rename pass; do use "Charts" in new user-facing text.

15. **Admin must not appear in normal main navigation.**
    `CONFIRMED` — `AppHeader` (USER portal navbar) never branches on
    `role` and has no admin link. A USER-portal session cannot belong to
    an admin-role account in the first place (rule 16).

16. **USER and ADMIN portal authentication must remain isolated.**
    `CONFIRMED, IMPLEMENTED` — not a pending goal; this is the current,
    verified architecture. Separate cookies (`sh_user_refresh`/
    `sh_admin_refresh`), separate refresh endpoints, separate JWT
    audience, separate frontend stores, no SSO. See
    [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md). Do not reintroduce a
    shared session store, a shared refresh endpoint, or a `portal=`
    request parameter that's trusted without server-side validation.

17. **Do not casually use `.stockharvesting.com`-scoped auth cookies.**
    `CONFIRMED` — every auth cookie is host-only (no `Domain=` attribute
    anywhere in `backend/src/modules/security/cookies.ts`). Adding a
    `Domain=.stockharvesting.com` cookie would make it visible to *both*
    portals' shared backend host, defeating the isolation in rule 16 even
    if the cookie *names* stayed different.

18. **Avoid hardcoded colors when theme tokens exist.**
    `DIRECTIVE` — use the existing CSS custom-property tokens
    (`bg-background`, `text-foreground`, `border-border`, etc.) rather
    than literal hex/rgb values, so light/dark mode and future palette
    changes stay centralized.

19. **App UI uses readable sans typography; Landing/Login may use display
    typography.**
    `CONFIRMED` — `.landing-root` (Manrope, editorial) is scoped to
    exactly one place, the landing page's own root div
    (`LandingPage.tsx`); everything else inherits `font-sans` (Geist) via
    the global `html { @apply font-sans }` cascade in `src/app/layout.tsx`.
    Confirmed via a repo-wide grep audit — no other Manrope leak exists.

20. **Commented-out implementations must not be committed.**
    `DIRECTIVE` — git history is the archive. See
    [ENGINEERING_RULES.md](./ENGINEERING_RULES.md).

21. **Dead routes/components should be removed after the product decision
    is final** — not left redirecting/orphaned indefinitely "in case."
    `CONFIRMED` findings this audit: `/stocks`, `/profile`, `/admin/jobs`,
    `/admin/data-provider` (singular) are all dead redirect-only routes
    with orphaned components today — see
    [KNOWN_ISSUES.md](./KNOWN_ISSUES.md). This rule doesn't require
    deleting them immediately; it requires that leaving them dead be a
    deliberate decision, not an accident nobody revisits.

22. **Code comments are not architecture authority.** `DIRECTIVE` — a
    comment claiming "this duplication is intentional" or "this is safe
    because X" is a claim, not proof. Verify actual current behavior
    before relying on it, especially before consolidating or preserving a
    duplicate implementation. See
    [ENGINEERING_RULES.md](./ENGINEERING_RULES.md),
    [COMPONENT_REGISTRY.md](./COMPONENT_REGISTRY.md).

23. **Dashboard top metrics and Weekly Strong qualification are separate
    systems.** `CONFIRMED` — different backend functions
    (`computeAllRelativeStrengthMetrics` vs. the Weekly Strong evaluator),
    different data sources, never coupled since the 55-day-metric
    simplification. See [DASHBOARD.md](./DASHBOARD.md). Do not source the
    top 4 widgets from the evaluator, and do not source the detailed
    table/Backtest from the 55-day metric.

## Additional confirmed traps (not in the original list, found this audit)

24. **`src/proxy.ts` must live at `src/proxy.ts`, not the repo root.**
    A root-level `proxy.ts` silently never runs (no build error — Next.js
    resolves proxy/middleware relative to wherever `app/` lives). This
    already caused hostname-based portal routing to be completely
    non-functional for a period; re-check this first if hostname routing
    ever appears broken.

25. **Dashboard is live in production.** `CONFIRMED, CHANGED` — the
    `IS_PRODUCTION_LOCKDOWN` gate that used to redirect `/dashboard` →
    `/charts` in production was removed (see
    [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)); verified with a real
    `next build` + `next start`. `IS_PRODUCTION_LOCKDOWN` itself still
    exists and is still used for one unrelated thing
    (`AdminSidebar.tsx`'s dev-vs-prod logout-button UI) — don't assume
    every reference to it is about route-gating. `/stocks` and `/profile`
    were never gated by this flag at all (they redirect unconditionally,
    in every environment) — their dead implementation code was removed
    separately, the redirect stubs were kept. Do not reintroduce an
    environment-based gate on Dashboard.

26. **Charts scan-highlight bands and backtest stats must be backend-
    sourced only — never derived client-side from raw candles.**
    `CONFIRMED, FIXED` — a real instance of this existed
    (`near-250-week-high-scan.ts`, `build-backtest-stats-from-candles.ts`,
    both deleted) and was worse than a passive leak: the client-side
    result was preferred over the correct backend one whenever it
    produced a value. `ScannerPage.tsx` now consumes
    `useScannerResults`/`useScannerBacktest` unconditionally, with no
    client-side fallback computation. If either component ever needs a
    "instant feedback before the network round-trip" affordance again,
    that must be a loading state, not a raw-candle recomputation. See
    [KNOWN_ISSUES.md](./KNOWN_ISSUES.md), [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md).

27. **Scanner's live near-high scan and its backtest overlay must answer
    the same qualification question with the same implementation.**
    `CONFIRMED, FIXED` — even after rule 26's client-side fix, the
    *backend's own* live path (`scanner/rules/near-250-week-high.ts`) still
    ran an independent weekly-only simplification while the backtest path
    (`computeSymbolBreakoutBacktest`) used the canonical two-condition
    evaluator — the two could disagree on which weeks qualify, on the same
    page, for the same symbol. Both now share one fetch/gate step
    (`getSymbolWeeklyStrongSeriesInput`, `market-data.service.ts`) and one
    evaluator call (`evaluateWeeklyStrongSeries`) with the same window-size
    formula (`deriveScannerLookbackBars`, `weekly-strong-evaluator.ts`). See
    [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) and
    `near-250-week-high.test.ts`'s consistency tests.
