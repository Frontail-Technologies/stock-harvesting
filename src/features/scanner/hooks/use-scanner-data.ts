"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getStocks, useCandles, useStockSearch } from "@/features/market-data";
import type { Stock } from "@/types/market";
import type { DrawingElement, ScannerLookbackMultiplier, Timeframe } from "../types";
import {
  getScannerBacktest,
  getScannerResults,
  getWorkspaceDrawings,
  saveWorkspaceDrawings,
} from "../api/scanner-api";
import { fromBackendDrawingRows } from "../lib/drawing-api-mappers";
import { mapScannerResultsToScanBands } from "../lib/scanner-result-mappers";

export function useScannerStockSearch(
  query: string,
  enabled = true,
  exchange?: string
) {
  return useStockSearch(query, 12, { enabled, minLength: 2, exchange });
}

export function useScannerStockRecommendations(exchange: string, enabled = true) {
  const authStatus = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: ["scanner", "stock-recommendations", exchange] as const,
    queryFn: async (): Promise<Stock[]> => {
      const response = await getStocks({
        exchange,
        limit: 12,
        sortBy: "volume",
        sortDirection: "desc",
        includeUnpriced: true,
      });

      return response.stocks.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        close: stock.close ?? 0,
        changePct: stock.changePct ?? null,
        volume: stock.volume ?? 0,
        open: stock.open,
        hasMarketData: stock.close !== undefined,
      }));
    },
    enabled: authStatus === "authenticated" && enabled && Boolean(exchange),
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });
}

export function useScannerCandles(
  symbol: string,
  timeframe: Timeframe,
  exchange?: string
) {
  return useCandles({ symbol, timeframe, exchange });
}

export function useScannerResults(
  symbol: string,
  timeframe: Timeframe,
  enabled = true,
  exchange?: string,
  lookback?: ScannerLookbackMultiplier
) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.scanner.results({ symbol, timeframe, limit: 50, exchange, lookback }),
    queryFn: async () => {
      const response = await getScannerResults({
        symbol,
        timeframe,
        limit: 50,
        exchange,
        lookback,
      });
      return mapScannerResultsToScanBands(response.results);
    },
    enabled: authStatus === "authenticated" && enabled && Boolean(symbol),
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

  return {
    ...query,
    scanBands: query.data ?? [],
  };
}

// Alphabetically-first-by-name tends to surface ETPs/warrants/micro-caps
// with numeric-leading codes (e.g. "21Shares Bitcoin Core ETP", "029 GROUP
// SE") rather than a normal common-stock ticker — this is a light filter
// for "looks like a plain equity symbol" (letter-led, no odd punctuation).
const PLAUSIBLE_EQUITY_SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

// For exchanges without a hand-picked default (everything besides US/NSE —
// see DEFAULT_STOCK_BY_EXCHANGE in ScannerPage.tsx), fetch a real symbol
// from that exchange instead of showing an empty chart on first visit.
export function useExchangeDefaultStock(exchange: string, enabled: boolean) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.scanner.defaultStock(exchange),
    queryFn: async (): Promise<Stock | null> => {
      const response = await getStocks({
        exchange,
        limit: 25,
        sortBy: "name",
        sortDirection: "asc",
        includeUnpriced: true,
      });
      const stock =
        response.stocks.find((row) => PLAUSIBLE_EQUITY_SYMBOL_PATTERN.test(row.symbol)) ??
        response.stocks[0];
      if (!stock) return null;

      return {
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        close: stock.close ?? 0,
        changePct: stock.changePct ?? null,
        volume: stock.volume ?? 0,
        open: stock.open,
        hasMarketData: stock.close !== undefined,
      };
    },
    enabled: authStatus === "authenticated" && enabled && Boolean(exchange),
    retry: false,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
  });

  return query.data ?? null;
}

export function useScannerBacktest(
  symbol: string,
  enabled: boolean,
  exchange?: string,
  lookback?: ScannerLookbackMultiplier
) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.scanner.backtest({ symbol, exchange, lookback }),
    queryFn: () => getScannerBacktest({ symbol, exchange, lookback }),
    enabled: authStatus === "authenticated" && enabled && Boolean(symbol),
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

  return { ...query, stats: query.data?.stats ?? null };
}

export function useScannerWorkspaceDrawings(symbol: string, timeframe: Timeframe) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.scanner.workspaceDrawings({ symbol, timeframe }),
    queryFn: async () => {
      const response = await getWorkspaceDrawings({ symbol, timeframe });
      return fromBackendDrawingRows(response.drawings);
    },
    enabled: authStatus === "authenticated" && Boolean(symbol),
    retry: false,
    staleTime: 2 * 60_000,
    gcTime: 15 * 60_000,
  });

  return {
    ...query,
    drawings: query.data ?? [],
  };
}

export function useSaveScannerDrawings(symbol: string, timeframe: Timeframe) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (drawings: DrawingElement[]) => {
      const response = await saveWorkspaceDrawings({ symbol, timeframe, drawings });
      return fromBackendDrawingRows(response.drawings);
    },
    onSuccess: (drawings) => {
      queryClient.setQueryData(
        queryKeys.scanner.workspaceDrawings({ symbol, timeframe }),
        drawings
      );
    },
  });
}
