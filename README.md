# Stock Harvesting

Stock Harvesting is a UI-first prototype for an India-only stock scanner and charting platform. The current app uses mock data only; real authentication, Zerodha integration, persistence, billing, and production scanner automation are intentionally out of scope for this phase.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn-style UI primitives
- lightweight-charts
- Express backend under `backend/`
- Drizzle ORM + PostgreSQL
- Redis + BullMQ for backend jobs

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

Backend:

```bash
cd backend
npm.cmd install
copy .env.example .env
npm.cmd run db:migrate
npm.cmd run dev
```

The frontend uses `NEXT_PUBLIC_API_BASE_URL` and defaults to `http://localhost:4000`.

## Checks

```bash
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Backend checks:

```bash
cd backend
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd audit --omit=dev
```

The app uses system font fallbacks instead of `next/font/google` so builds do not require network access to Google Fonts.

## Current Scope

The frontend remains usable with mock fallbacks while backend integration comes online. Keep broker credentials, OAuth secrets, refresh tokens, and provider tokens server-only.
