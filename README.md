# Stock Harvesting

Stock Harvesting is a UI-first prototype for an India-only stock scanner and charting platform. The current app uses mock data only; real authentication, Zerodha integration, persistence, billing, and production scanner automation are intentionally out of scope for this phase.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style UI primitives
- lightweight-charts

## Routes

- `/login` - mock Google sign-in entry screen
- `/dashboard` - market analytics widgets
- `/stocks` - NSE stock table with search, sort, and pagination UI
- `/scanner` - primary charting and scanner workspace
- `/profile` - mock profile, plan, and usage limits

## Local Development

```bash
npm.cmd run dev
```

Then open `http://localhost:3000`.

On Windows PowerShell, use `npm.cmd` if the local execution policy blocks `npm.ps1`.

## Checks

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

The app uses system font fallbacks instead of `next/font/google` so builds do not require network access to Google Fonts.

## Current Scope

This phase focuses on a polished frontend experience with deterministic mock candles and mock NSE stock data. Keep API keys and broker integrations server-only when backend work begins.
