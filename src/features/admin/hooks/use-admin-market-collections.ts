"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  createAdminMarketCollection,
  generateAdminWeeklyStrongBacktest,
  getAdminCollectionVersionMembers,
  getAdminCollectionVersions,
  getAdminMarketCollection,
  getAdminMarketCollectionMembers,
  getAdminMarketCollections,
  getAdminWeeklyStrongBacktestHistoricalStatus,
  getAdminWeeklyStrongBacktestStatus,
  importAdminCollectionCsv,
  previewAdminCollectionImport,
  rebuildAdminWeeklyStrongBacktestHistorical,
  replaceAdminCollectionVersion,
  updateAdminMarketCollection,
} from "../api/admin-api";

// Not started/generating a moving target that shouldn't go stale for long,
// but a real "Ready" result changes rarely - the poll interval below
// handles the "Generating" -> "Ready" transition without a manual refetch.
const BACKTEST_STATUS_STALE_TIME_MS = 30_000;

function useIsAdmin() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  return status === "authenticated" && user?.role === "admin";
}

export function useAdminMarketCollections() {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.marketCollections.admin.list,
    queryFn: getAdminMarketCollections,
    enabled,
  });
}

export function useAdminMarketCollection(id: string | null) {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.marketCollections.admin.detail(id ?? ""),
    queryFn: () => getAdminMarketCollection(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminMarketCollectionMembers(input: {
  id: string | null;
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "symbol" | "name";
  sortDirection?: "asc" | "desc";
}) {
  const enabled = useIsAdmin();
  const page = input.page ?? 1;
  const limit = input.limit ?? 25;

  const query = useQuery({
    queryKey: queryKeys.marketCollections.admin.members({
      id: input.id ?? "",
      page,
      limit,
      q: input.q,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    }),
    queryFn: () =>
      getAdminMarketCollectionMembers({
        id: input.id as string,
        page,
        limit,
        q: input.q,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
      }),
    enabled: enabled && Boolean(input.id),
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    pagination: query.data?.pagination ?? { page, limit, total: 0, totalPages: 1 },
  };
}

export function useCreateAdminMarketCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminMarketCollection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketCollections.admin.list });
    },
  });
}

export function useUpdateAdminMarketCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminMarketCollection,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketCollections.admin.list });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketCollections.admin.detail(variables.id),
      });
    },
  });
}

export function usePreviewAdminCollectionImport() {
  return useMutation({
    mutationFn: previewAdminCollectionImport,
  });
}

export function useImportAdminCollectionCsv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importAdminCollectionCsv,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketCollections.admin.list });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketCollections.admin.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketCollections.admin.versions(variables.id) });
    },
  });
}

export function useAdminWeeklyStrongBacktestStatus(id: string | null) {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.marketCollections.admin.weeklyStrongBacktestStatus(id ?? ""),
    queryFn: () => getAdminWeeklyStrongBacktestStatus(id as string),
    enabled: enabled && Boolean(id),
    staleTime: BACKTEST_STATUS_STALE_TIME_MS,
    // Keeps polling while a backfill is in flight so "Generating" flips to
    // "Ready" on its own without the admin needing to refresh the page.
    refetchInterval: (query) =>
      query.state.data?.status.state === "generating" ? BACKTEST_STATUS_STALE_TIME_MS : false,
  });
}

export function useGenerateAdminWeeklyStrongBacktest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateAdminWeeklyStrongBacktest,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketCollections.admin.weeklyStrongBacktestStatus(variables.id),
      });
    },
  });
}

export function useAdminWeeklyStrongBacktestHistoricalStatus(id: string | null) {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.marketCollections.admin.weeklyStrongBacktestHistoricalStatus(id ?? ""),
    queryFn: () => getAdminWeeklyStrongBacktestHistoricalStatus(id as string),
    enabled: enabled && Boolean(id),
    staleTime: BACKTEST_STATUS_STALE_TIME_MS,
    refetchInterval: (query) =>
      query.state.data?.status.state === "generating" ? BACKTEST_STATUS_STALE_TIME_MS : false,
  });
}

export function useRebuildAdminWeeklyStrongBacktestHistorical() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rebuildAdminWeeklyStrongBacktestHistorical,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketCollections.admin.weeklyStrongBacktestHistoricalStatus(variables.id),
      });
    },
  });
}

export function useAdminCollectionVersions(id: string | null) {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.marketCollections.admin.versions(id ?? ""),
    queryFn: () => getAdminCollectionVersions(id as string),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCollectionVersionMembers(input: { id: string | null; versionId: string | null }) {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.marketCollections.admin.versionMembers({
      id: input.id ?? "",
      versionId: input.versionId ?? "",
    }),
    queryFn: () => getAdminCollectionVersionMembers({ id: input.id as string, versionId: input.versionId as string }),
    enabled: enabled && Boolean(input.id) && Boolean(input.versionId),
  });
}

export function useReplaceAdminCollectionVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replaceAdminCollectionVersion,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketCollections.admin.versions(variables.id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketCollections.admin.versionMembers({ id: variables.id, versionId: variables.versionId }),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketCollections.admin.weeklyStrongBacktestHistoricalStatus(variables.id),
      });
    },
  });
}
