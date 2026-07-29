"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserPlan,
  updateAdminUserRole,
} from "../api/admin-api";
import type { AdminUserFilters } from "../types";

export function useAdminUsers(filters: AdminUserFilters) {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: () => getAdminUsers(filters),
    enabled: status === "authenticated" && user?.role === "admin",
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
