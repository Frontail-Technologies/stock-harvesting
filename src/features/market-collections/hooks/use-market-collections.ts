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

