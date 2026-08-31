@AGENTS.md

# Working in this repo

Before implementing a feature change, read in this order:

1. `docs/ARCHITECTURE.md`
2. `docs/ENGINEERING_RULES.md`
3. `docs/REGRESSION_RULES.md`
4. `docs/DOMAIN_BOUNDARIES.md`
5. The relevant feature document (`docs/ROUTES.md`, `MARKET_DATA.md`,
   `DASHBOARD.md`, `CHARTS.md`, `WATCHLISTS.md`, `ADMIN_PORTAL.md`,
   `PROVIDERS.md`, `BACKTEST.md`, `AUTH_ARCHITECTURE.md`,
   `COMPONENT_REGISTRY.md`, `FEATURE_REGISTRY.md`)

Then:

6. **Inspect the actual code before trusting a doc.** These are
   maintained best-effort, not generated from source. **When
   documentation conflicts with actual code: inspect the code, report the
   conflict, and update the documentation intentionally.** Do not blindly
   follow a stale doc, and do not silently "fix" the doc without noting
   what changed and why.
7. Update the relevant `docs/*.md` when you change an architecture,
   invariant, or route — in the same change, not as a follow-up.
8. Never expose proprietary market-analysis formulas or thresholds (the
   Weekly Strong evaluator in particular) anywhere outside the backend
   implementation and its tests — not in public copy, not in any
   `docs/*.md` file, including the architecture-only ones. See
   `docs/DOMAIN_BOUNDARIES.md`.
9. Prefer reusing existing architecture/components/hooks/services
   (`docs/COMPONENT_REGISTRY.md`, `docs/FEATURE_REGISTRY.md`) over
   creating new ones — check there and in the relevant feature folder
   first.
