"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useIsAdminReady } from "@/features/auth";
import {
  getAdminMonetization,
  updateAdminMonetizationPlacement,
  updateAdminMonetizationSettings,
} from "../api/admin-api";

export function useAdminMonetization() {
  const isAdminReady = useIsAdminReady();

  return useQuery({
    queryKey: queryKeys.admin.monetization,
    queryFn: getAdminMonetization,
    enabled: isAdminReady,
  });
}

export function useUpdateAdminMonetizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminMonetizationSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.monetization });
    },
  });
}

export function useUpdateAdminMonetizationPlacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminMonetizationPlacement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.monetization });
    },
  });
}
