"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useAdminSessionStore } from "@/features/auth";
import {
  backfillAdminIndexCandles,
  connectAdminDataProvider,
  getAdminDataProviderConnectUrl,
  getAdminDataProviderHealth,
  getAdminDataProviderStatus,
  getAdminDataProviderStatuses,
  syncAdminDataProvider,
  syncAdminMarketDataPrices,
  syncAdminSectorClassification,
} from "../api/admin-api";

// Shared bounded-retry config for the provider-status queries. The status
// endpoints are local/DB-only server-side now, so these load fast; the small
// retry/staleTime just keeps a transient backend blip from parking a card on
// "Checking..." through the default 3-retry backoff.
const PROVIDER_STATUS_QUERY_OPTIONS = {
  enabled: false, // overridden per-hook below
  retry: 1,
  retryDelay: 1_000,
  staleTime: 30_000,
} as const;

export function useAdminDataProviderStatus() {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);

  return useQuery({
    ...PROVIDER_STATUS_QUERY_OPTIONS,
    queryKey: queryKeys.admin.dataProviderStatus,
    queryFn: getAdminDataProviderStatus,
    enabled: status === "authenticated" && user?.role === "admin",
  });
}

export function useAdminDataProviderStatuses() {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);

  return useQuery({
    ...PROVIDER_STATUS_QUERY_OPTIONS,
    queryKey: queryKeys.admin.dataProviderStatuses,
    queryFn: getAdminDataProviderStatuses,
    enabled: status === "authenticated" && user?.role === "admin",
  });
}

// One independent query per provider: a GlobalDataFeeds timeout can't delay
// EODHD's card and vice versa. Runs the bounded external check server-side, so
// it stays a background fetch with a single retry - the local status query is
// what makes the card feel immediate.
export function useAdminDataProviderHealth(provider: string) {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.dataProviderHealth(provider),
    queryFn: () => getAdminDataProviderHealth(provider),
    enabled: status === "authenticated" && user?.role === "admin",
    retry: 1,
    retryDelay: 1_000,
    staleTime: 30_000,
    gcTime: 60_000,
  });
}

export function useCreateAdminDataProviderConnectUrl() {
  return useMutation({
    mutationFn: getAdminDataProviderConnectUrl,
  });
}

export function useConnectAdminDataProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectAdminDataProvider,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dataProviderStatus,
      });
    },
  });
}

export function useSyncAdminDataProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAdminDataProvider,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.admin.dataProviderStatus,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs });
    },
  });
}

export function useSyncAdminMarketDataPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAdminMarketDataPrices,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs });
    },
  });
}

export function useSyncAdminSectorClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAdminSectorClassification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs });
    },
  });
}

export function useBackfillAdminIndexCandles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backfillAdminIndexCandles,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs });
    },
  });
}
