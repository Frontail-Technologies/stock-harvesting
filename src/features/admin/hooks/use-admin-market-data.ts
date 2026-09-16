"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useAdminSessionStore } from "@/features/auth";
import {
  getAdminMarketDataHealth,
  getAdminMarketDataJobRuns,
  getAdminMarketDataSchedules,
  getAdminMarketDataWorkers,
} from "../api/admin-api";

const MARKET_DATA_STATUS_REFETCH_MS = 30_000;

function useIsAdmin() {
  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);
  return status === "authenticated" && user?.role === "admin";
}

export function useAdminMarketDataWorkers() {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.admin.marketDataWorkers,
    queryFn: getAdminMarketDataWorkers,
    enabled,
    refetchInterval: MARKET_DATA_STATUS_REFETCH_MS,
  });
}

export function useAdminMarketDataHealth() {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.admin.marketDataHealth,
    queryFn: getAdminMarketDataHealth,
    enabled,
    refetchInterval: MARKET_DATA_STATUS_REFETCH_MS,
  });
}

export function useAdminMarketDataJobRuns() {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.admin.marketDataJobRuns,
    queryFn: getAdminMarketDataJobRuns,
    enabled,
    refetchInterval: MARKET_DATA_STATUS_REFETCH_MS,
  });
}

export function useAdminMarketDataSchedules() {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.admin.marketDataSchedules,
    queryFn: getAdminMarketDataSchedules,
    enabled,
    refetchInterval: MARKET_DATA_STATUS_REFETCH_MS,
  });
}
