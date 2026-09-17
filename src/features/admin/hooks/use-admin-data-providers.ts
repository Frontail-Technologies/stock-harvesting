"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useIsAdminReady } from "@/features/auth";
import { getAdminDataProviders, updateAdminDataProviderSettings } from "../api/admin-api";

export function useAdminDataProviders() {
  const isAdminReady = useIsAdminReady();

  return useQuery({
    queryKey: queryKeys.admin.dataProviders,
    queryFn: getAdminDataProviders,
    enabled: isAdminReady,
  });
}

export function useUpdateAdminDataProviderSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminDataProviderSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dataProviders });
    },
  });
}
