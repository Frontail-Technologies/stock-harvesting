"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useIsAdminReady } from "@/features/auth";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserPlan,
  updateAdminUserRole,
} from "../api/admin-api";
import type { AdminUserFilters } from "../types";

export function useAdminUsers(filters: AdminUserFilters) {
  const isAdminReady = useIsAdminReady();

  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: () => getAdminUsers(filters),
    enabled: isAdminReady,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersRoot });
    },
  });
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminUserRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersRoot });
    },
  });
}

export function useUpdateAdminUserPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminUserPlan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersRoot });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.usersRoot });
    },
  });
}
