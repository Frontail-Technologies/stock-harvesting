"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useAdminSessionStore } from "@/features/auth";
import { getAdminDataProviders, updateAdminDataProviderSettings } from "../api/admin-api";

export function useAdminDataProviders() {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.dataProviders,
    queryFn: getAdminDataProviders,
    enabled: status === "authenticated" && user?.role === "admin",
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
