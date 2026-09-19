"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useIsAdminReady } from "@/features/auth";
import {
  getAdminMarketDataHealth,
  getAdminMarketDataOperations,
  getAdminMarketDataQueue,
  getAdminMarketDataJobRuns,
  getAdminMarketDataSchedules,
  getAdminMarketDataWorkers,
  getAdminJobs,
} from "../api/admin-api";

const MARKET_DATA_STATUS_REFETCH_MS = 30_000;

function useIsAdmin() {
  return useIsAdminReady();
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

export function useAdminJobs() {
  const enabled = useIsAdmin();

  return useQuery({
    queryKey: queryKeys.admin.jobs,
    queryFn: getAdminJobs,
    enabled,
    refetchInterval: (query) =>
      query.state.data?.jobs.some((job) => job.status === "queued" || job.status === "running")
        ? 2_000
        : MARKET_DATA_STATUS_REFETCH_MS,
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

export function useAdminMarketDataQueue() {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.admin.marketDataQueue,
    queryFn: getAdminMarketDataQueue,
    enabled,
    refetchInterval: 10_000,
  });
}

export function useAdminMarketDataOperations() {
  const enabled = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.admin.marketDataOperations,
    queryFn: getAdminMarketDataOperations,
    enabled,
    refetchInterval: MARKET_DATA_STATUS_REFETCH_MS,
  });
}
