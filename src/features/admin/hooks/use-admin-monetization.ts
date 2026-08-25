"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  getAdminMonetization,
  updateAdminMonetizationPlacement,
  updateAdminMonetizationSettings,
} from "../api/admin-api";

export function useAdminMonetization() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.monetization,
    queryFn: getAdminMonetization,
    enabled: status === "authenticated" && user?.role === "admin",
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
