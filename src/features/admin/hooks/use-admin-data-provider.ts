"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  backfillAdminIndexCandles,
  connectAdminDataProvider,
  getAdminDataProviderConnectUrl,
  getAdminDataProviderStatus,
  getAdminDataProviderStatuses,
  syncAdminDataProvider,
  syncAdminMarketDataPrices,
  syncAdminSectorClassification,
} from "../api/admin-api";

export function useAdminDataProviderStatus() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.dataProviderStatus,
    queryFn: getAdminDataProviderStatus,
    enabled: status === "authenticated" && user?.role === "admin",
  });
}

export function useAdminDataProviderStatuses() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.dataProviderStatuses,
    queryFn: getAdminDataProviderStatuses,
    enabled: status === "authenticated" && user?.role === "admin",
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
