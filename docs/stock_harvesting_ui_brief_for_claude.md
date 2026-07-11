# Stock Harvesting — UI First Development Brief for Claude Pro

## 0. Project Context

We are building **Stock Harvesting**, an India-only stock scanner and charting web platform.

The first priority is **UI implementation**, not backend/API integration.

The project should be built in phases:

1. **Phase 1: UI-only with mock data**
2. **Phase 2: Replace mock candles with Zerodha API via backend**
3. **Phase 3: Add scanner logic, database, signal history, user limits, and production deployment**

Right now, Claude should focus heavily on **building a polished UI**, especially the **custom scanner chart view**.

---

## 1. Main Goal

Create a production-quality frontend for **Stock Harvesting** with these screens:

1. Login page with Google login UI
2. Dashboard page with market analytics graph widgets
3. Stocks table page
4. Scanner chart page — most important
5. Profile / usage limits page

The UI should feel like a real fintech product, not a basic template.

---

## 2. Tech Stack

Use:

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
lightweight-charts
Mock data first
```

Do not use:

```txt
TradingView Advanced Charts
AnyStock / AnyChart
Paid chart libraries
Backend integration in the first UI phase
Zerodha API in the first UI phase
```

---

## 3. Brand Direction

Product name:

```txt
Stock Harvesting
```

Market:

```txt
India Only / NSE
```

Visual style:

```txt
Premium fintech SaaS
Dark navy header
Light dashboard/table pages
Dark scanner chart page
Yellow/gold accent color
Green/red market movement colors
Clean typography
Professional spacing
Rounded cards
Subtle borders and shadows
```

Suggested colors:

```txt
Dark navy: #050A18
Panel dark: #0B1020
Border dark: rgba(255,255,255,0.08)
Gold accent: #F5B800 or #FACC15
Green: #22C55E
Red: #EF4444
Light background: #F8FAFC
Text dark: #0F172A
Muted text: #64748B
```

Create reusable tokens/classes instead of random hardcoded values everywhere.

---

## 4. Global Layout

Create a shared app shell for authenticated pages:

```txt
Header:
- Left: wheat/harvest icon + Stock Harvesting
- Nav: Dashboard, Stocks, Scanner, Signals, Profile
- Active nav item with yellow underline
- Right: India Only / NSE selector
- Notification icon
```

Routes:

```txt
/login
/dashboard
/stocks
/scanner
/profile
```

Optional later:

```txt
/signals
```

For now, `Signals` nav can point to a placeholder or disabled route.

---

# 5. Screen 1 — Login Page

Route:

```txt
/login
```

Purpose:

User signs in with Google.

Layout:

```txt
Full screen layout
Left side: brand message
Right side: login card
```

Content:

```txt
Stock Harvesting
Real-time stock scanning and analytics for India-only markets.

Feature bullets:
- Powerful Scanners
- Actionable Signals
- Built for India, Built for You
```

Login card:

```txt
Welcome back
Sign in to continue to Stock Harvesting

Button:
Continue with Google
```

For UI phase:

```txt
Google button does not need real auth.
On click, it can redirect to /dashboard or show mock logged-in state.
```

Keep the design clean and polished.

---

# 6. Screen 2 — Dashboard Page

Route:

```txt
/dashboard
```

Purpose:

Show a market analytics dashboard like Chartink-style graph widgets.

Page content:

```txt
Title:
Dashboard

Subtitle:
Real-time market analytics and relative strength insights

Top right:
Updated at: 10th Jul, 3:30pm
Refresh button
```

Cards:

1. Relative Strength Index
2. Relative Strength Sector
3. Relative Strength Industry
4. Weekly Strong Stock List
5. Daily Strong Stock
6. Cash Strong Stocks

Each card should include:

```txt
Card title
Timestamp
Info icon
Ranked list 1-10
Horizontal value bars
Values on right side
View all link
```

Use mock data.

Example card item:

```ts
{
  rank: 1,
  label: "CHENNPETRO",
  value: 16.84,
  color: "blue"
}
```

Dashboard should use light theme:

```txt
White cards
Light grey background
Dark navy header
Gold active nav
```

---

# 7. Screen 3 — Stocks Table Page

Route:

```txt
/stocks
```

Purpose:

List Indian NSE stocks in a clean table.

Top content:

```txt
Title:
Stocks

Subtitle:
Browse and analyze listed stocks on NSE
```

Actions:

```txt
Customize Columns
Copy
CSV
Excel
Search input
Settings button
```

Table columns:

```txt
Sr.
Stock Name
Symbol
Close (₹)
% Change
Volume
```

Rows:

Use 15-20 Indian stock examples:

```txt
Reliance Industries Ltd — RELIANCE
HDFC Bank Ltd — HDFCBANK
ICICI Bank Ltd — ICICIBANK
Tata Consultancy Services Ltd — TCS
Infosys Ltd — INFY
Hindustan Unilever Ltd — HINDUNILVR
ITC Ltd — ITC
Kotak Mahindra Bank Ltd — KOTAKBANK
Larsen & Toubro Ltd — LT
Bajaj Finance Ltd — BAJFINANCE
Axis Bank Ltd — AXISBANK
Bharti Airtel Ltd — BHARTIARTL
Asian Paints Ltd — ASIANPAINT
Maruti Suzuki India Ltd — MARUTI
Titan Company Ltd — TITAN
UltraTech Cement Ltd — ULTRACEMCO
NTPC Ltd — NTPC
```

Features:

```txt
Search filter
Pagination UI
Rows per page selector
Sortable column icons UI
Green positive % change badges
```

Actual CSV/Excel export can be simple mock functions for now.

---

# 8. Screen 4 — Scanner Chart Page

Route:

```txt
/scanner
```

This is the most important screen.

The goal is to build a **custom Chartink-style scanner chart UI**.

The screen should show only:

```txt
1. Header/nav
2. Large candlestick graph
3. Left vertical tools toolbar
4. Right-side stock search panel
```

Do not show:

```txt
Dashboard cards
Trigger summary panel
Bottom scan result strip
Extra widgets
Unnecessary analytics blocks
```

---

## 8.1 Scanner Page Layout

Layout:

```txt
Full page dark theme

Header height: approx 64px

Below header:
3-column layout

Left:
Vertical tools toolbar — 56px

Center:
Large chart panel — flexible width

Right:
Search stocks panel — 300px to 340px
```

Suggested CSS structure:

```txt
min-h-screen
bg-[#050A18]
text-white
```

Main layout:

```txt
grid grid-cols-[56px_1fr_320px]
gap-3
p-4
```

---

## 8.2 Scanner Header

Inside scanner page, above chart:

```txt
INFY
Infosys Limited
1W
NSE

Timeframe buttons:
1D
1W active
1M

Controls:
Indicators
Templates
Alerts
Reset
```

Also show OHLC values:

```txt
O 1,893.60
H 1,927.90
L 1,874.85
C 1,918.45
+24.85 (+1.31%)
```

Show volume values:

```txt
Volume 20
12.48M
18.72M
```

---

## 8.3 Candlestick Chart

Use:

```txt
lightweight-charts
```

Create component:

```txt
components/scanner/ScannerChart.tsx
```

Chart requirements:

```txt
Dark background
Candlestick series
Volume histogram
Right price scale
Bottom time scale
Crosshair
Grid lines
Current price line
Responsive resize using ResizeObserver
Destroy chart instance on unmount
```

Use mock candles first.

Candle type:

```ts
export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
```

Create mock candles:

```txt
lib/mock-candles.ts
```

Generate around 160 weekly candles with realistic movement.

Do not make random charts every render. Use stable deterministic mock data.

---

## 8.4 Left Tools Toolbar

Create component:

```txt
components/scanner/ChartToolsBar.tsx
```

Show vertical icon buttons:

```txt
Crosshair
Trendline
Horizontal line
Measure
Rectangle
Text
Brush
Zoom
Magnet
Lock
Eye
Delete
```

For UI phase:

```txt
Only Crosshair active state should work.
Delete can clear demo overlay selection if needed.
Other tools are UI-only.
```

Button style:

```txt
40px height
centered icon
subtle border
hover background
active yellow accent
tooltip/title attribute
```

Avoid making full drawing tools in this phase.

---

## 8.5 Scan Zone Overlay

Create component:

```txt
components/scanner/ScanZoneOverlay.tsx
```

This is critical.

The chart should show yellow highlighted scanner zones like Chartink-style scale zones.

Each zone should show:

```txt
Transparent yellow rectangle
Yellow border
Dashed vertical measurement line
Dashed horizontal measurement line
Label box with:
Scale
120.50 (10.04%)
10 bars, 70d
```

Use sample zones:

```ts
export type ScanZone = {
  id: string;
  startTime: string;
  endTime: string;
  lowPrice: number;
  highPrice: number;
  label: string;
  percent: string;
  bars: string;
};
```

Example:

```ts
const scanZones: ScanZone[] = [
  {
    id: "zone-1",
    startTime: "2021-10-01",
    endTime: "2022-01-15",
    lowPrice: 980,
    highPrice: 1220,
    label: "Scale",
    percent: "120.50 (10.04%)",
    bars: "10 bars, 70d"
  }
];
```

Important implementation:

Use the chart API:

```ts
chart.timeScale().timeToCoordinate(zone.startTime)
chart.timeScale().timeToCoordinate(zone.endTime)
candleSeries.priceToCoordinate(zone.highPrice)
candleSeries.priceToCoordinate(zone.lowPrice)
```

Overlay must recalculate positions on:

```txt
Chart resize
Window resize
Timeframe change
Visible range change
Zoom
Scroll
```

Use absolute positioned SVG or div overlay above the chart.

---

## 8.6 Right Search Panel

Create component:

```txt
components/scanner/StockSearchPanel.tsx
```

Panel content:

```txt
Title:
Search Stocks

Search input:
Search by name or symbol...

Popular Searches:
INFY
RELIANCE
TCS
HDFCBANK
ICICIBANK

Recent Searches:
INFY — Infosys Limited — NSE — 1,918.45
RELIANCE — Reliance Industries Ltd. — NSE — 2,950.75
TCS — Tata Consultancy Services — NSE — 3,642.20
HDFCBANK — HDFC Bank Limited — NSE — 1,678.90
ICICIBANK — ICICI Bank Limited — NSE — 1,124.35

Bottom:
View all symbols →
```

Behavior:

```txt
Use local mock stock array
Typing filters stocks by symbol/name
Clicking stock updates selected stock in chart header
For now chart candle data can remain same
```

---

# 9. Screen 5 — Profile / Usage Limits Page

Route:

```txt
/profile
```

Purpose:

Show user plan, limits, and usage.

Content:

```txt
Profile
Manage your account, usage and plan details
```

Profile card:

```txt
Avatar initials
Name: Rahul Sharma
Email: rahul.sharma@example.com
Plan: Pro Plan
Renews on 24 May 2025
```

Usage cards:

```txt
Daily Scan Limit: 200 scans per day
Scans Used Today: 68 / 200
Saved Signals: 128
Active Alerts: 12
API / Data Access: Enabled
```

Plan card:

```txt
Your Plan
Pro Plan

Features:
- 200 scans per day
- Advanced scanners
- Real-time signals
- Priority support
- API access

Button:
Upgrade Plan
Manage Billing
```

Account settings:

```txt
Personal Information
Change Password
Notification Preferences
Connected Accounts
Log Out
```

---

# 10. Component Structure

Create this structure:

```txt
src/
  app/
    login/
      page.tsx
    dashboard/
      page.tsx
    stocks/
      page.tsx
    scanner/
      page.tsx
    profile/
      page.tsx

  components/
    layout/
      AppHeader.tsx
      AppShell.tsx

    auth/
      LoginScreen.tsx

    dashboard/
      DashboardWidget.tsx
      DashboardGrid.tsx

    stocks/
      StocksTable.tsx
      StockTableToolbar.tsx

    scanner/
      ScannerPage.tsx
      ScannerChart.tsx
      ScannerChartHeader.tsx
      ChartToolsBar.tsx
      ScanZoneOverlay.tsx
      StockSearchPanel.tsx
      TimeframeSelector.tsx

    profile/
      ProfileOverview.tsx
      UsageOverview.tsx
      PlanCard.tsx
      AccountSettings.tsx

  lib/
    mock-candles.ts
    mock-stocks.ts
    mock-dashboard.ts
    formatters.ts

  types/
    market.ts
    user.ts
```

---

# 11. Mock Data

Create clean mock files.

## `types/market.ts`

```ts
export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Stock = {
  symbol: string;
  name: string;
  exchange: "NSE";
  close: number;
  changePct: number;
  volume: number;
};

export type ScanZone = {
  id: string;
  startTime: string;
  endTime: string;
  lowPrice: number;
  highPrice: number;
  label: string;
  percent: string;
  bars: string;
};
```

---

# 12. UI Quality Requirements

The UI must be:

```txt
Production-quality
Consistent
Responsive for desktop
Readable at 1366px width
Clean and modular
No random colors
No messy inline styles
No giant single component
```

Important:

```txt
The scanner chart screen should be the most polished screen.
```

---

# 13. Do Not Do Yet

Do not implement these in the first UI phase:

```txt
Real Google auth
Real Zerodha API
Database
Prisma
Backend routes
Full scanner automation
Saved drawings
Editable trendlines
Fibonacci tools
Alerts engine
Payment/subscription engine
Admin panel
```

Those come later.

---

# 14. Acceptance Criteria

The UI phase is complete when:

```txt
/login looks polished
/dashboard shows 6 analytics graph widgets
/stocks shows table with search/export UI/pagination
/scanner shows large dark chart with left tools and right search panel
/scanner has yellow scan zones correctly placed on chart
/scanner chart resizes correctly
/profile shows usage limits and plan details
All pages share same brand header
No TypeScript errors
npm run build passes
```

---

# 15. First Claude Task

Start by implementing only:

```txt
1. Project layout/header
2. /scanner page
3. ScannerChart with mock candles
4. ChartToolsBar
5. StockSearchPanel
6. ScanZoneOverlay
```

Do not build the other pages until the scanner page looks correct.

The scanner page is the core of the product.

---

# 16. First Prompt to Use in Claude

Use this prompt:

```txt
Build the UI-first version of Stock Harvesting.

Start with only the /scanner page because the custom chart view is the most important feature.

Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and lightweight-charts.

Create:
- AppHeader
- ScannerPage
- ScannerChart
- ScannerChartHeader
- ChartToolsBar
- StockSearchPanel
- ScanZoneOverlay
- mock candle data
- mock stock data
- market types

The scanner page should show:
- dark navy fintech UI
- top header with Stock Harvesting logo/nav
- large candlestick chart
- volume bars
- OHLC row
- timeframe buttons 1D, 1W, 1M
- controls: Indicators, Templates, Alerts, Reset
- left vertical chart tools
- right-side stock search panel
- yellow scan zone overlays with labels

Use mock data only. Do not integrate Zerodha yet. Do not implement backend yet.

Make the chart responsive with ResizeObserver. Recalculate scan zone overlay positions on resize, zoom, scroll, and visible range change.

Keep code modular and production-ready.
```

---

# 17. Later Integration Plan

After UI is approved:

## Step 1

Create local API route:

```txt
/api/market/candles?symbol=INFY&interval=week
```

## Step 2

Return mock candles through the API route.

## Step 3

Replace mock route with Zerodha Kite Connect backend integration.

## Step 4

Keep Zerodha credentials server-only.

Flow:

```txt
Frontend scanner chart
↓
Next.js API route
↓
Zerodha Kite Connect
↓
Normalized candles
↓
Chart UI
```

Never expose Zerodha API keys to the browser.
