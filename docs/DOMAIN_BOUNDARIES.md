# Domain Boundaries

**The browser is not a trusted execution environment.** This is a
security/product rule, not a style preference — anything shipped in the
frontend bundle is readable by anyone who opens dev tools, regardless of
minification. Treat "is this visible in the bundle" as equivalent to "is
this public."

## What the frontend MAY do

- Render server-produced values and results.
- Format values (currency, dates, percentages).
- Sort already-produced display values (e.g. sort a returned list of
  55-day-change rows by value — the values themselves came from the
  backend).
- Filter already-produced rows for UI interaction (e.g. the Dashboard
  cross-filter narrowing an already-fetched array by sector/industry — see
  [DASHBOARD.md](./DASHBOARD.md)).
- Manage local UI state (panel width, selected tab, dialog open/closed).
- Manage chart interaction state (drawings in progress, hover crosshair,
  zoom/pan).

## What the frontend MUST NOT contain

- Proprietary qualification rules.
- Evaluator conditions (e.g. the Weekly Strong evaluator's actual
  breakout logic — see [BACKTEST.md](./BACKTEST.md)).
- Hidden thresholds.
- Proprietary lookback constants.
- Scoring methodology.
- Entry/exit methodology.
- Backtest decision logic.
- Reverse-engineerable intermediate evaluator diagnostics (partial scores,
  individual condition pass/fail flags, or anything else that would let
  someone reconstruct the qualification rule from the API response shape
  even without the formula being named outright).

## One canonical implementation

Canonical proprietary/domain calculations live on the **backend only**.
If the frontend needs a derived value, the backend computes it and
returns the final, UI-safe result.

**Do not implement:**

```
backend formula
  +
frontend copy of the same formula
```

This is not a "keep them in sync" problem to manage — it's two sources of
truth that will eventually disagree with each other or with the real
data. One canonical implementation, backend-side, full stop. See
[ENGINEERING_RULES.md](./ENGINEERING_RULES.md) — "do not duplicate the
same domain calculation in frontend and backend."

## API response minimization

**Do not return proprietary intermediate values merely because they are
available on the backend.** Every field in an API response is effectively
public (see the browser trust boundary above). Before adding a field to a
response, ask: does the client actually need this to render the UI? If
the answer is "no, but it might be useful for debugging" — log it
server-side instead, don't return it.

This already happened correctly once in this codebase: the top Dashboard
widgets' relative-strength response used to carry `monthlyPct`/
`weeklyMacdPct`/`weeklyMacdHistogramPct` fields that nothing in the
frontend ever read — they were removed when the ranking metric was
simplified to a single disclosed value (55-day change %, which the
product UI already labels and displays directly — not proprietary; see
[DASHBOARD.md](./DASHBOARD.md)). The Weekly Strong evaluator's own
internals are a different matter and must never follow that same "return
it because it's there" pattern — its qualification response should carry
only what the table/backtest UI actually renders (pass/fail membership,
display fields), never partial scores or condition-level diagnostics.

## Where this applies today

| System | Formula/threshold location | Frontend gets |
|---|---|---|
| 55-day change % (top 4 Dashboard widgets) | `market-data.service.ts`, disclosed — see [DASHBOARD.md](./DASHBOARD.md) | The final percentage, already ranked/grouped |
| Weekly Strong evaluator (detailed table + Backtest) | `weekly-strong-evaluator.ts`, **proprietary** — see [BACKTEST.md](./BACKTEST.md) | Pass/fail membership + display fields only, never the internal conditions |
| Provider/candle freshness logic | `market-data.service.ts` — see [MARKET_DATA.md](./MARKET_DATA.md) | Final candle rows only |

Not every backend calculation is secret (the 55-day metric isn't) — but
every calculation that produces UI values, secret or not, still belongs
on the backend, for the "one canonical implementation" reason above, not
only the confidentiality reason.
