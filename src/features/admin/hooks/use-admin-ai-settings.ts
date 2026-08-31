"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useAdminSessionStore } from "@/features/auth";
import {
  deleteAdminAiKey,
  getAdminAiKeyStatus,
  getAdminAiSettings,
  updateAdminAiKey,
  updateAdminAiSettings,
} from "../api/admin-api";

export function useAdminAiSettings() {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.aiSettings,
    queryFn: getAdminAiSettings,
    enabled: status === "authenticated" && user?.role === "admin",
  });
}

export function useUpdateAdminAiSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminAiSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.aiSettings });
    },
  });
}

export function useAdminAiKeyStatus() {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.aiSettingsKey,
    queryFn: getAdminAiKeyStatus,
    enabled: status === "authenticated" && user?.role === "admin",
  });
}

export function useUpdateAdminAiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminAiKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.aiSettingsKey });
    },
  });
}

export function useDeleteAdminAiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminAiKey,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.aiSettingsKey });
    },
  });
}
