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
  getWatchlistRelativeStrength,
  getWatchlists,
  removeWatchlistItem,
  renameWatchlist,
} from "../api/watchlists-api";
import type { WatchlistDetail, WatchlistSummary } from "../types";

const WATCHLISTS_STALE_TIME_MS = 60_000;
// Ranking recomputes live on every request (no persisted snapshot, unlike
// the Segment path) since Watchlist membership can change at any moment -
// short-lived enough to feel current, long enough to collapse rapid
// re-renders/refocuses into one request.
const WATCHLIST_RELATIVE_STRENGTH_STALE_TIME_MS = 60_000;

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

export function useWatchlistRelativeStrength(input: { id: string | null; limit?: number }) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.watchlists.relativeStrength({ id: input.id ?? "", limit: input.limit }),
    queryFn: () => getWatchlistRelativeStrength({ id: input.id as string, limit: input.limit }),
    enabled: authStatus === "authenticated" && Boolean(input.id),
    retry: false,
    staleTime: WATCHLIST_RELATIVE_STRENGTH_STALE_TIME_MS,
    gcTime: 15 * 60_000,
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    metrics: query.data?.metrics ?? [],
    asOfDate: query.data?.asOfDate ?? null,
  };
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

type WatchlistListCache = { watchlists: WatchlistSummary[] };
type WatchlistDetailCache = { watchlist: WatchlistDetail };
type WatchlistMutationContext = {
  previousList?: WatchlistListCache;
  previousDetail?: WatchlistDetailCache;
};

export function useAddWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addWatchlistItem,
    onMutate: async (variables): Promise<WatchlistMutationContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlists.list });
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlists.detail(variables.watchlistId),
      });

      const previousList = queryClient.getQueryData<WatchlistListCache>(queryKeys.watchlists.list);
      const previousDetail = queryClient.getQueryData<WatchlistDetailCache>(
        queryKeys.watchlists.detail(variables.watchlistId)
      );

      queryClient.setQueryData<WatchlistListCache | undefined>(queryKeys.watchlists.list, (current) => {
        if (!current) return current;
        return {
          watchlists: current.watchlists.map((watchlist) =>
            watchlist.id === variables.watchlistId
              ? { ...watchlist, itemCount: watchlist.itemCount + 1 }
              : watchlist
          ),
        };
      });

      queryClient.setQueryData<WatchlistDetailCache | undefined>(
        queryKeys.watchlists.detail(variables.watchlistId),
        (current) => {
          if (!current) return current;
          const alreadyPresent = current.watchlist.items.some(
            (item) => item.exchange === variables.exchange && item.symbol === variables.symbol
          );
          if (alreadyPresent) return current;

          return {
            watchlist: {
              ...current.watchlist,
              items: [
                ...current.watchlist.items,
                {
                  id: `optimistic-${variables.watchlistId}-${variables.exchange}-${variables.symbol}`,
                  exchange: variables.exchange,
                  symbol: variables.symbol,
                  position: current.watchlist.items.length,
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          };
        }
      );

      return { previousList, previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.watchlists.list, context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.watchlists.detail(variables.watchlistId),
          context.previousDetail
        );
      }
    },
    onSettled: (_data, _error, variables) => {
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
    onMutate: async (variables): Promise<WatchlistMutationContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.watchlists.list });
      await queryClient.cancelQueries({
        queryKey: queryKeys.watchlists.detail(variables.watchlistId),
      });

      const previousList = queryClient.getQueryData<WatchlistListCache>(queryKeys.watchlists.list);
      const previousDetail = queryClient.getQueryData<WatchlistDetailCache>(
        queryKeys.watchlists.detail(variables.watchlistId)
      );

      queryClient.setQueryData<WatchlistListCache | undefined>(queryKeys.watchlists.list, (current) => {
        if (!current) return current;
        return {
          watchlists: current.watchlists.map((watchlist) =>
            watchlist.id === variables.watchlistId
              ? { ...watchlist, itemCount: Math.max(0, watchlist.itemCount - 1) }
              : watchlist
          ),
        };
      });

      queryClient.setQueryData<WatchlistDetailCache | undefined>(
        queryKeys.watchlists.detail(variables.watchlistId),
        (current) => {
          if (!current) return current;
          return {
            watchlist: {
              ...current.watchlist,
              items: current.watchlist.items.filter((item) => item.id !== variables.itemId),
            },
          };
        }
      );

      return { previousList, previousDetail };
    },
    onError: (_error, variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.watchlists.list, context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.watchlists.detail(variables.watchlistId),
          context.previousDetail
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.list });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.watchlists.detail(variables.watchlistId),
      });
    },
  });
}
