# Watchlists

Two coexisting surfaces: the standalone `/watchlists` page, and two
independent in-Charts panels (sidebar + URL-driven widget). They share
data (hooks/API) but not UI code — see
[COMPONENT_REGISTRY.md](./COMPONENT_REGISTRY.md).

## CRUD

**Backend** (`backend/src/modules/watchlists/*`, mounted at
`/api/watchlists`, all behind `requireAuth`):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | List current user's watchlists (with `itemCount`) |
| `POST` | `/` | Create watchlist |
| `GET` | `/:id` | Get one watchlist with items |
| `PATCH` | `/:id` | Rename |
| `DELETE` | `/:id` | Delete |
| `POST` | `/:id/items` | Add stock item |
| `DELETE` | `/:id/items/:itemId` | Remove stock item |

**Ownership**: every mutating/read-detail call goes through
`getOwnedWatchlist(id, userId)` (`watchlists.service.ts`), which throws
`notFound` if the row doesn't exist or `forbidden` if
`watchlist.userId !== userId`. `userId` always comes from
`getAuthUserId(req)` — never trusted from the request body. Duplicate-item
detection is a pure function (`findDuplicateWatchlistItem`) backed by a DB
unique constraint on `(watchlistId, exchange, symbol)` as the real
race-safe backstop.

**Schema** (`backend/src/db/schema/watchlists.ts`):

- `watchlists`: `id`, `userId` (FK, cascade), `name`, timestamps. Indexed
  on `userId`.
- `watchlist_items`: `id`, `watchlistId` (FK, cascade), `exchange`,
  `symbol`, `position`, `createdAt`. Unique on `(watchlistId, exchange, symbol)`.

## List/detail UI (`/watchlists`)

`src/features/watchlists/*`:

- `WatchlistsPage.tsx` — list page, empty state, per-row expand.
- `WatchlistRow.tsx` — one row: name, item count, updated date, "Open in
  Charts" link, rename/delete menu, expandable inline item list with
  per-item remove.
- `CreateWatchlistDialog.tsx` / `RenameWatchlistDialog.tsx` /
  `DeleteWatchlistDialog.tsx` / `AddStockDialog.tsx` — the four CRUD
  dialogs.
- `WatchlistStockSearchInput.tsx` — exchange picker + debounced search +
  dedupe (also reused by both in-Charts surfaces — the one genuinely
  shared UI piece between the standalone page and Charts).
- `hooks/use-watchlists.ts` — `useWatchlists`, `useWatchlist`,
  `useCreateWatchlist`, `useRenameWatchlist`, `useDeleteWatchlist`,
  `useAddWatchlistItem`, `useRemoveWatchlistItem` (React Query).

## Right-docked Charts panel

Two **independent** implementations under
`src/features/scanner/components/`:

1. **`ScannerWatchlistSidebar.tsx`** — persistent, toolbar-toggled
   (`ScannerWatchlistToggle.tsx`), resizable-by-drag with collapse-below-
   threshold, minimized rail state, watchlist picker + inline create +
   inline add-symbol search, link back to `/watchlists`. State lives in
   `scanner-ui-store.ts` (`isWatchlistPanelOpen`, `activeWatchlistId`,
   width, minimized) — **persists** across navigation/reload.
2. **`ScannerWatchlistWidget.tsx`** — floating panel, opens **only** via
   the `?watchlist=<id>` URL param set by `WatchlistRow`'s "Open in
   Charts" link. Local open/close state only, not persisted.

Both render desktop inline vs. mobile `Sheet` via `useIsDesktopViewport`,
and both go through `watchlistItemToStock()`
(`src/features/watchlists/lib/watchlist-item-to-stock.ts`) to map an item
into the shape Charts' stock-selection expects.

## Stock routing

Clicking a watchlist item selects that stock the same way any other
selection does — writes `?symbol=&exchange=` via the store→URL sync (see
[CHARTS.md](./CHARTS.md)). "Open in Charts" from the standalone page sets
only `?watchlist=<id>`; the user then picks a specific stock from within
the opened widget.

## Empty/populated states

`WatchlistsPage.tsx` has an explicit empty state (no watchlists yet);
`WatchlistRow.tsx`'s expanded view has its own empty state for a
watchlist with zero items, prompting "+ Add Stock".
