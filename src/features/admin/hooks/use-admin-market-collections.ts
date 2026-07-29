"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  createAdminMarketCollection,
  getAdminMarketCollection,
  getAdminMarketCollectionMembers,
  getAdminMarketCollections,
  importAdminCollectionCsv,
  previewAdminCollectionImport,
  updateAdminMarketCollection,
} from "../api/admin-api";

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
    },
  });
}
