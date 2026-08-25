"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getAdminDataProviders, updateAdminDataProviderSettings } from "../api/admin-api";

export function useAdminDataProviders() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

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
