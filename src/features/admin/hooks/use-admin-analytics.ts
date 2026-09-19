"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useIsAdminReady } from "@/features/auth";
import { getAdminAnalytics } from "../api/admin-api";
import type { AdminAnalyticsPeriod } from "../types";

export function useAdminAnalytics(period: AdminAnalyticsPeriod) {
  const isAdminReady = useIsAdminReady();

  return useQuery({
    queryKey: queryKeys.admin.analytics(period),
    queryFn: () => getAdminAnalytics(period),
    enabled: isAdminReady,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
