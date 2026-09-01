"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getMarketExchanges } from "../api/market-exchanges-api";

const EXCHANGES_STALE_TIME_MS = 24 * 60 * 60_000;

export function useMarketExchanges() {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.marketData.exchanges,
    queryFn: getMarketExchanges,
    enabled: authStatus !== "unknown",
    retry: false,
    staleTime: EXCHANGES_STALE_TIME_MS,
    gcTime: 25 * 60 * 60_000,
  });

  return { ...query, exchanges: query.data?.exchanges ?? [] };
}
