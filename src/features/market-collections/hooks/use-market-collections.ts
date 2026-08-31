"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  getCollectionMembers,
  getCollectionRelativeStrength,
  getCollectionWeeklyStrongStocks,
  getMarketCollections,
} from "../api/market-collections-api";
import type { CollectionMembersInput } from "../types";

const COLLECTIONS_STALE_TIME_MS = 5 * 60_000;
const COLLECTION_MEMBERS_STALE_TIME_MS = 60_000;
// Phase D.9 perf audit: these two backed "current" Weekly Strong/RS -
// genuinely expensive live per-request computations over years of candle
// history (measured: ~0.8-1.5s cold; see the Phase D.9 report). They were
// staleTime: 60_000 AND refetchOnMount: "always" - the "always" override
// forced a live refetch on every mount regardless of staleTime, so
// navigating away and back within the same minute still paid the full
// cost. The backend now caches these results in-process for
// COLLECTION_CACHE_TTL_MS (20 min, see market-collections.service.ts) and
// invalidates that cache proactively when the underlying candle sync
// actually runs (see refreshAllLatestInstrumentPrices) or an admin
// imports new membership - so a client-side staleTime shorter than that
// backend window still gets a fast, warm response even on a "stale"
// refetch. 5 minutes here means a background refresh happens periodically
// without the "always, even seconds later" behavior that was thrashing
// the backend.
const COLLECTION_RS_STALE_TIME_MS = 5 * 60_000;
const COLLECTION_WEEKLY_STRONG_STALE_TIME_MS = 5 * 60_000;

export function useMarketCollections(input: { exchange?: string } = {}) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.marketCollections.list(input),
    queryFn: () => getMarketCollections(input),
    enabled: authStatus !== "unknown",
    retry: false,
    staleTime: COLLECTIONS_STALE_TIME_MS,
    gcTime: 15 * 60_000,
    // Country/segment switches change this query's key (exchange/country
    // filters) - keeping the previous list visible avoids the whole
    // selector row flashing empty while the new filter's request is in
    // flight (Phase D.9 #11).
    placeholderData: (previousData) => previousData,
  });

  return { ...query, collections: query.data?.collections ?? [] };
}

export function useCollectionMembers(input: CollectionMembersInput) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.marketCollections.members({
      code: input.code,
      page: input.page ?? 1,
      limit: input.limit ?? 50,
      q: input.q,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    }),
    queryFn: () => getCollectionMembers(input),
    enabled: authStatus !== "unknown" && Boolean(input.code),
    retry: false,
    staleTime: COLLECTION_MEMBERS_STALE_TIME_MS,
    gcTime: 15 * 60_000,
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination ?? {
      page: input.page ?? 1,
      limit: input.limit ?? 50,
      total: 0,
      totalPages: 1,
    },
  };
}

export function useCollectionRelativeStrength(input: {
  code: string;
  limit?: number;
  groupBy?: "sector" | "industry";
}) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.marketCollections.relativeStrength(input),
    queryFn: () => getCollectionRelativeStrength(input),
    enabled: authStatus !== "unknown" && Boolean(input.code),
    retry: false,
    staleTime: COLLECTION_RS_STALE_TIME_MS,
    gcTime: 15 * 60_000,
    // An admin import now invalidates the BACKEND's own cache immediately
    // (importCollectionCsv already calls invalidateCacheByPrefix for this
    // exact key), so the next request - even a "still fresh" one from this
    // client's perspective - would get the new data anyway once staleTime
    // naturally elapses; forcing every single mount to bypass staleTime
    // entirely (the old `refetchOnMount: "always"`) cost far more than it
    // bought. Keeps previous data visible while a background refresh runs
    // (Phase D.9 #11), instead of the widgets grid flashing back to a
    // skeleton.
    placeholderData: (previousData) => previousData,
  });

  return { ...query, metrics: query.data?.metrics ?? [], asOfDate: query.data?.asOfDate ?? null };
}

export function useCollectionWeeklyStrongStocks(input: { code: string }) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.marketCollections.weeklyStrongStocks(input),
    queryFn: () => getCollectionWeeklyStrongStocks(input),
    enabled: authStatus !== "unknown" && Boolean(input.code),
    retry: false,
    staleTime: COLLECTION_WEEKLY_STRONG_STALE_TIME_MS,
    gcTime: 15 * 60_000,
    placeholderData: (previousData) => previousData,
  });

  return { ...query, items: query.data?.items ?? [] };
}

// Note: the old useCollectionWeeklyStrongStocksBacktest (count-only, live-
// computed on every Dashboard page load) has been removed - see
// @/features/weekly-strong-backtest's useWeeklyStrongBacktestStacked for
// the persisted replacement (Phase C2).
