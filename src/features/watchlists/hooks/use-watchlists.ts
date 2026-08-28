"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  addWatchlistItem,
  createWatchlist,
  deleteWatchlist,
  getWatchlist,
  getWatchlists,
  removeWatchlistItem,
  renameWatchlist,
} from "../api/watchlists-api";
import type { WatchlistSummary } from "../types";

const WATCHLISTS_STALE_TIME_MS = 60_000;

export function useWatchlists() {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.watchlists.list,
    queryFn: getWatchlists,
    enabled: authStatus === "authenticated",
    staleTime: WATCHLISTS_STALE_TIME_MS,
    gcTime: 15 * 60_000,
  });

  return { ...query, watchlists: query.data?.watchlists ?? [] };
}

export function useWatchlist(id: string | null) {
  const authStatus = useSessionStore((state) => state.status);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.watchlists.detail(id ?? ""),
    queryFn: () => getWatchlist(id as string),
    enabled: authStatus === "authenticated" && Boolean(id),
    staleTime: WATCHLISTS_STALE_TIME_MS,
    gcTime: 15 * 60_000,
  });

  const watchlist = query.data?.watchlist ?? null;

  // The detail response's own `items` array is the one place a genuinely
  // complete, up-to-date item count exists - once it's loaded, it's the
  // single source of truth for this watchlist's count, and this syncs it
  // into the list query's cached summary row too so `itemCount` there
  // can't visibly disagree (stale list fetch, a missed invalidation,
  // anything) with what the detail view itself is showing. One-directional
  // (detail -> list) and a no-op once the two already agree, so it never
  // fights the list query's own refetches.
  useEffect(() => {
    if (!watchlist) return;
    queryClient.setQueryData<{ watchlists: WatchlistSummary[] } | undefined>(
      queryKeys.watchlists.list,
      (current) => {
        if (!current) return current;
        const index = current.watchlists.findIndex((item) => item.id === watchlist.id);
        if (index === -1) return current;
        if (current.watchlists[index].itemCount === watchlist.items.length) return current;

        const nextWatchlists = [...current.watchlists];
        nextWatchlists[index] = {
          ...nextWatchlists[index],
          itemCount: watchlist.items.length,
        };
        return { watchlists: nextWatchlists };
      }
    );
  }, [queryClient, watchlist]);

  return { ...query, watchlist };
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWatchlist,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.list });
    },
  });
}

export function useRenameWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameWatchlist,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.list });
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.detail(variables.id) });
    },
  });
}

export function useDeleteWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWatchlist,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.list });
      queryClient.removeQueries({ queryKey: queryKeys.watchlists.detail(variables.id) });
    },
  });
}

export function useAddWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addWatchlistItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.list });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlists.detail(variables.watchlistId),
      });
    },
  });
}

export function useRemoveWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeWatchlistItem,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.list });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlists.detail(variables.watchlistId),
      });
    },
  });
}
