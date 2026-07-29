"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getExchangeRates, getMarketExchanges } from "../api/market-exchanges-api";

// This barely ever changes (it's ~70 real-world stock exchanges plus NSE) —
// a long staleTime avoids refetching it on every page visit.
const EXCHANGES_STALE_TIME_MS = 24 * 60 * 60_000;
const EXCHANGE_RATES_STALE_TIME_MS = 15 * 60_000;

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

export function useExchangeRates() {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.marketData.exchangeRates,
    queryFn: getExchangeRates,
    enabled: authStatus !== "unknown",
    retry: false,
    staleTime: EXCHANGE_RATES_STALE_TIME_MS,
    gcTime: 30 * 60_000,
  });

  return { ...query, rates: query.data?.rates ?? { USD: 1 } };
}
