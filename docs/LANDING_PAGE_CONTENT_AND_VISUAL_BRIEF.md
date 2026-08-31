# Stock Harvesting Landing Page Content And Visual Brief

**Terminology correction (governance pass)**: this brief originally used
"Scanner" as the primary product name/CTA throughout. The product's
canonical name is now **Charts** (route `/charts`; see
[CHARTS.md](./CHARTS.md), [REGRESSION_RULES.md](./REGRESSION_RULES.md)
rule 13). Internal code may still say "scanner" in file/component names —
that's fine and intentional — but **all copy in this brief, and on the
actual landing page, should say "Charts."** This pass rewrites the brief's
language; it does not touch the landing page's actual code
(`src/features/landing/*`) — that's a separate implementation task.

This pass also corrects a contradiction in the original brief's own
"Public vs. Internal Messaging" section, which told writers to keep exact
formulas/thresholds "in internal docs." Per
[DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md), **no document** — public
or internal — should restate the Weekly Strong evaluator's exact formula
or thresholds. The backend code and its tests are the only source of
truth for that logic. See the corrected section at the bottom of this
file.

## Goal

Create a Charts-first landing page. The product currently has one strong
feature: a full-screen chart workspace with scan highlights, drawing
tools, screenshots, and multi-exchange data. The landing page should not
pretend the product is a full trading platform yet.

Primary message:

> Stock Harvesting helps traders find stocks showing strong weekly closing
> behavior and review them directly on a clean chart workspace.

Primary CTA:

> Open Charts

Secondary CTA:

> See How It Works

## Recommended Page Structure

Use 7 sections. This is enough to explain the product without making the
page feel empty or overpromised.

1. Hero
2. How It Works (highlight logic, described at a benefit level only)
3. Chart Workspace
4. Review Workflow
5. Screenshot And Sharing
6. Market Coverage
7. FAQ And Final CTA

Avoid generic sections like "Advanced analytics", "Portfolio management",
"Signals marketplace", or "Automated trading" until those features
actually exist.

## Section 1: Hero

Purpose: show Charts immediately. The user should understand this is a
focused chart workspace, not a normal stock list app.

Headline options:

1. `Find stocks showing weekly closing strength`
2. `A cleaner chart workspace for weekly breakout review`
3. `Review high-strength stock setups on one clean chart`

Recommended headline:

> Find stocks showing weekly closing strength

Subheadline:

> Stock Harvesting highlights stocks showing strong weekly closing
> behavior, then lets you review the setup on a full-screen chart.

CTA:

> Open Charts

Secondary CTA:

> How it works

Hero visual: use a real product screenshot as the main visual. Do not use
abstract finance illustrations as the primary hero image.

Best visual:
- Full Charts screenshot in dark mode
- Yellow close-based highlight strips visible
- Backtest stats box visible
- Stock name and OHLC overlay visible
- Drawing toolbar visible
- Center watermark subtle

Hero layout:
- Left: headline, subheadline, CTA
- Right: angled or framed Charts screenshot
- On mobile: headline first, screenshot below

Important: use the actual Charts UI screenshot. This builds trust faster
than decorative art.

## Section 2: How It Works

Purpose: explain the current value without exposing the exact rule.

Section title:

> Built around weekly closing strength

Public section copy:

> Charts focuses on stocks showing strength on weekly closes instead of
> reacting to temporary price spikes. Matching periods are shown directly
> on the chart as yellow strength zones.

**Do not publish the exact formula, threshold, or candle-window details
anywhere — public page or internal doc.** See the corrected messaging
section at the bottom.

Lookback options (verify these are still current against
`src/features/scanner/stores/scanner-ui-store.ts`'s `lookbackMultiplier`
before publishing — do not assume this brief stays accurate as the
product changes):

- `1x`: about 1 year
- `3x`: about 3 years
- `5x`: about 5 years

Supporting cards:

Card 1:

Title:
> Close-based strength

Copy:
> Charts favors closing strength instead of temporary wick spikes,
> helping reduce noise during chart review.

Card 2:

Title:
> Adjustable history

Copy:
> Switch between 1x, 3x, and 5x lookbacks so younger stocks can still be
> evaluated.

Card 3:

Title:
> Visual confirmation

Copy:
> Matching periods are shown as yellow vertical strips directly behind
> the chart.

Visual: use a zoomed-in chart crop showing yellow vertical strips behind
candles.

## Section 3: Chart Workspace

Purpose: show Charts is not just a table. It is a review workspace.

Section title:

> Review each setup on a full-screen chart

Public section copy:

> Move from symbol search to chart review without changing tools.
> Candles, volume, hover OHLC, strength zones, and range controls stay
> together in one focused workspace.

Feature bullets:

- Full-page candlestick chart
- Yellow highlight zones
- Hover OHLC and volume details
- 1x, 3x, 5x lookback control
- Multi-chart type selector
- Light and dark chart modes

Visual: use a dark and light Charts split image:
- Left half dark mode
- Right half light mode
- Same stock if possible

## Section 4: Review Workflow

Purpose: explain the user's path in 3 steps.

Section title:

> From scan to decision in three steps

Step 1:

Title:
> Search a symbol

Copy:
> Start with a stock symbol and load weekly candles from the selected
> market.

Step 2:

Title:
> Check strength zones

Copy:
> Yellow strips show where Charts detected weekly closing strength.

Step 3:

Title:
> Annotate and save the view

Copy:
> Use drawing tools, backtest stats, and screenshots to prepare a clean
> review.

Visual: use a simple horizontal workflow with three product UI crops:
- Search input
- Highlighted chart area
- Screenshot/share controls

## Section 5: Screenshot And Sharing

Purpose: show that users can export and share a clean chart review
without exposing internal logic.

Section title:

> Save and share a clean chart view

Public section copy:

> Export a chart screenshot with chart details, watermark, backtest
> stats, strength zones, and stock context ready to send.

Feature bullets:

- Screenshot export
- Share-ready chart image
- Brand watermark
- Stock name, timeframe, exchange, and OHLC context
- Backtest stats visible in the chart view

Note: this is a **client-side image export**, not a persisted/shareable
server-side link — see [CHARTS.md](./CHARTS.md) "Snapshots/share" before
promising anything the feature doesn't do (e.g. "share a live link to
this exact view" would be inaccurate; "share this chart image" is
accurate).

Visual: use an exported Charts screenshot focused on the chart, share
output, watermark, and stats panel.

## Section 6: Market Coverage

Purpose: be honest about current data scope.

Section title:

> Market data built for expansion

Public section copy:

> Stock Harvesting is structured around provider-specific adapters, so
> each market can use the best available data source while the chart
> workspace stays consistent.

Current positioning (verify against [PROVIDERS.md](./PROVIDERS.md) before
publishing):

- US data through EODHD
- NSE data through Zerodha Kite where connected
- BSE data through GlobalDataFeeds
- Additional exchanges can be added through provider adapters

Important wording: do not say "real-time all markets" unless live
streaming is stable for that market.

Better wording:

> Live and delayed data support depends on exchange and provider
> availability.

Visual: use a compact market coverage strip:

```text
US | NSE | BSE | More exchanges later
```

## Section 7: FAQ And Final CTA

Purpose: answer objections and then send users to Charts.

FAQ questions:

Question:
> Is Stock Harvesting a trading platform?

Answer:
> No. It is currently a chart review workspace with weekly-strength
> highlighting. It does not place trades.

Question:
> What does the highlighting look for?

Answer:
> It looks for stocks showing strong weekly closing behavior over the
> selected lookback period.

Question:
> Why use close instead of high?

Answer:
> Closing prices are usually cleaner for trend review because they
> reduce the impact of temporary wick spikes.

Question:
> Can I change the lookback period?

Answer:
> Yes. Charts supports 1x, 3x, and 5x lookbacks.

Question:
> Does it work on mobile?

Answer:
> Charts is designed to stay usable on smaller screens with compact
> controls and dropdowns.

Final CTA title:

> Start with Charts

Final CTA copy:

> Search a stock, inspect the highlighted weekly strength zones, and save
> a clean chart review.

CTA:

> Open Charts

## Visual Asset Plan

### Must-Have Visuals

1. Hero Charts screenshot
2. Close-based highlight crop
3. Drawing toolbar crop
4. Screenshot/share output example
5. Mobile Charts crop

### Optional Visuals

1. Dark/light Charts comparison
2. Mobile Charts view
3. "How it works" summary card (benefit-level only — no formula/threshold
   text or imagery)
4. Market coverage strip

### Visual Style

Use the existing product theme:

- Primary accent: harvest gold/yellow
- Dark chart background
- Light mode chart background
- Clean grid lines
- Green/red candles
- Pale yellow highlight strips
- Rounded controls, but not oversized
- Product screenshots over illustrations

Avoid:

- Generic stock photos
- Crypto-only imagery
- Overly futuristic dashboards
- Purple/blue gradient-heavy visuals
- Fake features not available in the app

## Screenshot Checklist

When taking product screenshots for the landing page:

1. Use a stock with visible yellow highlight zones.
2. Use a clean zoom level where candles are readable.
3. Show the stock name, timeframe, exchange, OHLC, and volume.
4. Keep the backtest stats box visible in at least one screenshot.
5. Avoid hover crosshair blocking important text.
6. Use both dark and light screenshots if possible.
7. Export at high resolution.
8. Remove browser chrome unless the reference specifically needs it.
9. Keep the logo watermark visible but subtle.
10. Do not show debug logs, issue badges, or local-only UI overlays.

## Image Generation Prompts

Use these prompts only for decorative or supporting visuals. For the
hero, use real product screenshots.

### Prompt 1: Abstract Charts Background

```text
Create a premium SaaS landing page background for a stock charting product called Stock Harvesting. Use a dark trading chart workspace aesthetic with subtle grid lines, faint candlestick silhouettes, soft harvest-gold highlights, and clean financial UI depth. No text, no logos, no people, no fake app screens. Low contrast, suitable behind landing page content. Wide 16:9 composition.
```

### Prompt 2: Close-Based Highlight Visual

```text
Create a clean financial chart close-up showing green and red candlesticks on a dark grid. Add subtle pale yellow vertical highlight strips behind selected weekly candles, with small gaps between candle columns. The highlights should feel like scan result zones, not drawing rectangles. No text, no logo, no UI controls. Professional trading app style, dark theme.
```

### Prompt 3: Light Mode Chart Background

```text
Create a minimalist light-theme stock chart background with thin gray grid lines, green and red candlesticks, pale yellow highlight strips, and subtle volume bars at the bottom. No labels, no text, no brand names. Clean SaaS product visual, high readability, white background.
```

### Prompt 4: Screenshot Share Visual

```text
Create a clean product visual showing an exported stock chart image on a neutral landing page background. The chart should include candlesticks, pale yellow strength zones, a small backtest stats panel, and a subtle Stock Harvesting-style watermark. No readable formulas, no extra modal UI, no fake trading claims.
```

### Prompt 5: Mobile Charts Visual

```text
Create a mobile trading chart screen mockup with a compact header, stock search input, vertical drawing toolbar, candlestick chart, pale yellow highlight strips, and bottom range selector. Use dark theme, green and red candles, harvest yellow accent. No readable text, no fake brand names.
```

## Prompt For ChatGPT To Generate Landing Copy

Use this when asking ChatGPT for copy improvements:

```text
I am building a landing page for Stock Harvesting, a stock charting and chart review app. Currently the main feature is a full-screen chart workspace called Charts. Charts highlights stocks showing strong weekly closing behavior using an internal method that is not disclosed publicly.

Users can choose 1x, 3x, or 5x lookback. Charts includes candlestick charts, yellow strength zones, OHLC hover details, drawing tools, screenshot/share export, dark/light mode, and market selection.

Write concise landing page copy for a serious trader audience. Do not overpromise trading profits. Do not mention automated trading. Do not describe or imply any specific formula, threshold, or condition behind the highlighting. Keep the tone practical and premium. Sections needed:
1. Hero
2. How it works (benefit-level only, no methodology)
3. Chart workspace
4. Review workflow
5. Screenshot and sharing
6. Market coverage
7. FAQ and final CTA

Use the brand name Stock Harvesting and the product name Charts. Primary CTA: Open Charts.
```

## Prompt For ChatGPT To Review Screenshots

Use this when you send screenshots to ChatGPT:

```text
Review these Stock Harvesting Charts screenshots for landing page use. Tell me which screenshot should be hero, which should be feature crops, and what UI issues should be fixed before using them publicly.

Evaluate:
- chart readability
- yellow highlight visibility
- logo/watermark placement
- OHLC text clarity
- backtest stats visibility
- dark/light theme consistency
- mobile suitability
- whether the screenshot communicates value in under 5 seconds

Give direct recommendations and suggest crop ratios for desktop and mobile sections.
```

## References To Share

Send these reference types before final landing implementation:

1. One landing page whose layout you like.
2. One charting product page whose tone you like.
3. Current Charts dark screenshot.
4. Current Charts light screenshot.
5. Mobile Charts screenshot.
6. Screenshot/share exported image.
7. Logo files for light and dark backgrounds.

If you only send three references, send:

1. Best current Charts screenshot
2. A landing page layout reference
3. A visual style reference

## Implementation Notes

This section describes the landing page's section structure **as of the
original brief** — verify against the actual current
`src/features/landing/*` components before treating it as current (this
pass did not audit landing code itself).

Recommended cleanup direction (unchanged from the original brief's
intent, terminology corrected):

- Keep the "How It Works" section benefit-focused, never formula-focused.
- Keep a chart-tools section, annotation focused.
- Keep a workflow section, simplified to three steps.
- Keep a coverage strip, claims conservative.
- Downplay any collections-focused section until collections are
  important for users.
- Use real screenshots inside the hero and Charts sections, and the
  screenshot/share section.

## Final Landing Page Message

The page should communicate one thing clearly:

> Stock Harvesting is a focused chart workspace for finding and
> reviewing stocks with strong weekly closing behavior.

## Public Vs Internal Messaging (corrected)

**The original version of this section instructed writers to keep exact
formulas and thresholds "in internal docs." That instruction is wrong and
has been corrected — see [DOMAIN_BOUNDARIES.md](./DOMAIN_BOUNDARIES.md).**

Public landing page:

- Say "weekly closing strength."
- Say "strength zones."
- Say "an internal method" (not "proprietary formula," not any wording
  that invites reverse-engineering by being specific about what's hidden).
- Say "1x, 3x, and 5x lookbacks" (a disclosed UI control, not the
  evaluator's own logic).
- Do not show formulas.
- Do not mention exact thresholds.
- Do not explain entry/exit mechanics in detail.

**Internal docs (including `docs/BACKTEST.md`, `docs/DASHBOARD.md`, admin
help text, code comments)**:

- Also do **not** restate the exact formula, threshold values, or
  candle-window rules. Architecture-level description only (what tables
  exist, what modes exist, which file owns the logic) — never the logic
  itself.
- The actual formula lives in exactly one place: the backend
  implementation (`backend/src/modules/market-data/weekly-strong-evaluator.ts`)
  and its tests. That is the only source of truth, for both public and
  internal audiences. Documentation — of any kind — is not the place to
  keep a second copy.
