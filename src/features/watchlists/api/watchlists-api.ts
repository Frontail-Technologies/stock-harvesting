import { API_ROUTES, apiFetch } from "@/features/api";
import type { WatchlistDetail, WatchlistItem, WatchlistSummary } from "../types";

export function getWatchlists() {
  return apiFetch<{ watchlists: WatchlistSummary[] }>(API_ROUTES.watchlists.root);
}

export function getWatchlist(id: string) {
  return apiFetch<{ watchlist: WatchlistDetail }>(API_ROUTES.watchlists.byId(id));
}

export function createWatchlist(input: { name: string }) {
  return apiFetch<{ watchlist: WatchlistSummary }>(API_ROUTES.watchlists.root, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function renameWatchlist(input: { id: string; name: string }) {
  return apiFetch<{ watchlist: WatchlistSummary }>(API_ROUTES.watchlists.byId(input.id), {
    method: "PATCH",
    body: JSON.stringify({ name: input.name }),
  });
}

export function deleteWatchlist(input: { id: string }) {
  return apiFetch<{ ok: true }>(API_ROUTES.watchlists.byId(input.id), {
    method: "DELETE",
  });
}

export function addWatchlistItem(input: { watchlistId: string; exchange: string; symbol: string }) {
  return apiFetch<{ item: WatchlistItem }>(API_ROUTES.watchlists.items(input.watchlistId), {
    method: "POST",
    body: JSON.stringify({ exchange: input.exchange, symbol: input.symbol }),
  });
}

export function removeWatchlistItem(input: { watchlistId: string; itemId: string }) {
  return apiFetch<{ ok: true }>(API_ROUTES.watchlists.item(input.watchlistId, input.itemId), {
    method: "DELETE",
  });
}
