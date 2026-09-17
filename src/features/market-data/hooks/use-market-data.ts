"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { DEFAULT_MARKET_EXCHANGE } from "@/features/market";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { mockStocks } from "@/mocks/market/stocks";
import { DEV_MOCK_FALLBACK_ENABLED } from "@/utils/frontend-flags";
import { searchStocks } from "@/utils/stock-search";
import { MARKET_DATA_PAGE_SIZE, STOCK_SEARCH_LIMIT } from "../constants";
import {
  ensureFreshCandles,
  getCandles,
  getCurrentDayCandle,
  getHistoryRange,
  getIndexRelativeStrength,
  getStocks,
  searchChartEligibleBseStocksApi,
  searchStocksApi,
} from "../api/market-data-api";
import { normalizeStocks } from "../lib/stock-mappers";
import { useMarketDataCacheStore } from "../stores/market-data-cache-store";
import type { CandleListInput, HistoryRangeInput, StockListInput } from "../types";
import type { Candle, Stock } from "@/types/market";

const STOCK_SEARCH_STALE_TIME_MS = 10 * 60_000;
const STOCK_LIST_STALE_TIME_MS = 5 * 60_000;
const CANDLE_STALE_TIME_MS = 30 * 60_000;
const SCANNER_SEARCH_DEBOUNCE_MS = 450;

const EMPTY_STOCK_ROWS: Stock[] = [];

function dedupeStocksByMarketKey(rows: Stock[]) {
  const seen = new Set<string>();
  const deduped: Stock[] = [];

  for (const row of rows) {
    const key = `${row.exchange}:${row.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

export function useStocks(
  input: StockListInput = {},
  options: { fallback?: boolean } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const useFallback = options.fallback ?? DEV_MOCK_FALLBACK_ENABLED;
  const exchangeKey = input.exchange ?? DEFAULT_MARKET_EXCHANGE;
  const isDefaultView =
    !input.q?.trim() && (input.page ?? 1) === 1 && !input.moveFilter && !input.minVolume;
  const cachedSnapshot = useMarketDataCacheStore(
    (state) => state.stocksByExchange[exchangeKey]
  );
  const setStocksSnapshot = useMarketDataCacheStore((state) => state.setStocksSnapshot);
  const query = useQuery({
    queryKey: queryKeys.marketData.stocks({
      q: input.q,
      page: input.page ?? 1,
      limit: input.limit ?? MARKET_DATA_PAGE_SIZE,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
      exchange: input.exchange,
      moveFilter: input.moveFilter,
      minVolume: input.minVolume,
      includeUnpriced: input.includeUnpriced,
    }),
    queryFn: async () => {
      const response = await getStocks({
        page: input.page ?? 1,
        limit: input.limit ?? MARKET_DATA_PAGE_SIZE,
        q: input.q,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
        exchange: input.exchange,
        moveFilter: input.moveFilter,
        minVolume: input.minVolume,
        includeUnpriced: input.includeUnpriced,
      });
      return {
        rows: normalizeStocks(response.stocks),
        pagination: response.pagination,
      };
    },
    enabled: authStatus !== "unknown",
    retry: false,
    staleTime: STOCK_LIST_STALE_TIME_MS,
    gcTime: 30 * 60_000,
    placeholderData: (previousData) =>
      previousData ?? (isDefaultView ? cachedSnapshot : undefined),
  });

  useEffect(() => {
    if (query.data && isDefaultView) {
      setStocksSnapshot(exchangeKey, query.data);
    }
  }, [exchangeKey, isDefaultView, query.data, setStocksSnapshot]);

  const fallbackRows = input.q?.trim()
    ? searchStocks(mockStocks, input.q)
    : mockStocks;
  const rows = query.isError && useFallback ? fallbackRows : query.data?.rows ?? [];
  const pagination =
    query.data?.pagination ??
    (query.isError && useFallback
      ? {
          page: input.page ?? 1,
          limit: input.limit ?? MARKET_DATA_PAGE_SIZE,
          total: fallbackRows.length,
          totalPages: Math.max(
            1,
            Math.ceil(fallbackRows.length / (input.limit ?? MARKET_DATA_PAGE_SIZE))
          ),
        }
      : {
          page: input.page ?? 1,
          limit: input.limit ?? MARKET_DATA_PAGE_SIZE,
          total: 0,
          totalPages: 1,
        });

  return {
    ...query,
    rows,
    pagination,
    usingFallback: query.isError && useFallback,
  };
}

export function useInfiniteStocks(
  input: Omit<StockListInput, "page"> = {},
  options: { fallback?: boolean } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const useFallback = options.fallback ?? DEV_MOCK_FALLBACK_ENABLED;
  const limit = input.limit ?? MARKET_DATA_PAGE_SIZE;
  const query = useInfiniteQuery({
    queryKey: queryKeys.marketData.infiniteStocks({
      q: input.q,
      limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
      exchange: input.exchange,
      moveFilter: input.moveFilter,
      minVolume: input.minVolume,
      includeUnpriced: input.includeUnpriced,
    }),
    queryFn: async ({ pageParam }) => {
      const response = await getStocks({
        page: pageParam,
        limit,
        q: input.q,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
        exchange: input.exchange,
        moveFilter: input.moveFilter,
        minVolume: input.minVolume,
        includeUnpriced: input.includeUnpriced,
      });

      return {
        rows: normalizeStocks(response.stocks),
        pagination: response.pagination,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: authStatus !== "unknown",
    retry: false,
    staleTime: STOCK_LIST_STALE_TIME_MS,
    gcTime: 30 * 60_000,
  });

  const fallbackRows = input.q?.trim()
    ? searchStocks(mockStocks, input.q)
    : mockStocks;
  const rows = query.isError && useFallback
    ? fallbackRows
    : dedupeStocksByMarketKey(query.data?.pages.flatMap((page) => page.rows) ?? []);
  const lastPage = query.data?.pages[query.data.pages.length - 1];
  const pagination =
    lastPage?.pagination ??
    (query.isError && useFallback
      ? {
          page: 1,
          limit,
          total: fallbackRows.length,
          totalPages: Math.max(1, Math.ceil(fallbackRows.length / limit)),
        }
      : {
          page: 1,
          limit,
          total: 0,
          totalPages: 1,
        });

  return {
    ...query,
    rows,
    pagination,
    usingFallback: query.isError && useFallback,
  };
}

export function useStockSearch(
  queryText: string,
  limit = STOCK_SEARCH_LIMIT,
  options: { enabled?: boolean; minLength?: number; exchange?: string } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const minLength = options.minLength ?? 2;
  const debouncedQuery = useDebouncedValue(queryText, SCANNER_SEARCH_DEBOUNCE_MS);
  const normalizedQuery = debouncedQuery.trim();
  const query = useQuery({
    queryKey: queryKeys.marketData.stockSearch({
      query: normalizedQuery,
      limit,
      exchange: options.exchange,
    }),
    queryFn: async () => {
      const response = await searchStocksApi({
        q: normalizedQuery,
        page: 1,
        limit,
        exchange: options.exchange,
      });
      return normalizeStocks(response.stocks);
    },
    enabled:
      authStatus !== "unknown" &&
      options.enabled !== false &&
      normalizedQuery.length >= minLength,
    retry: false,
    staleTime: STOCK_SEARCH_STALE_TIME_MS,
    gcTime: 30 * 60_000,
  });

  const fallbackRows = normalizedQuery
    ? searchStocks(mockStocks, normalizedQuery).slice(0, limit)
    : mockStocks.slice(0, limit);
  const rows =
    query.isError && DEV_MOCK_FALLBACK_ENABLED ? fallbackRows : (query.data ?? EMPTY_STOCK_ROWS);

  return {
    ...query,
    debouncedQuery: normalizedQuery,
    rows,
    usingFallback: query.isError && DEV_MOCK_FALLBACK_ENABLED,
  };
}

// Watchlist/Charts stock-selection picker only - always BSE, always
// chart-eligible (backend-filtered to instruments with stored 1D candle
// history). Deliberately a separate hook/endpoint from useStockSearch
// rather than an option on it - see searchChartEligibleBseStocks on the
// backend.
export function useChartEligibleBseStockSearch(
  queryText: string,
  limit = STOCK_SEARCH_LIMIT,
  options: { enabled?: boolean; minLength?: number } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const minLength = options.minLength ?? 2;
  const debouncedQuery = useDebouncedValue(queryText, SCANNER_SEARCH_DEBOUNCE_MS);
  const normalizedQuery = debouncedQuery.trim();
  const query = useQuery({
    queryKey: queryKeys.marketData.chartEligibleBseStockSearch({
      query: normalizedQuery,
      limit,
    }),
    queryFn: async () => {
      const response = await searchChartEligibleBseStocksApi({ q: normalizedQuery, limit });
      return normalizeStocks(response.stocks);
    },
    enabled:
      authStatus !== "unknown" &&
      options.enabled !== false &&
      normalizedQuery.length >= minLength,
    retry: false,
    staleTime: STOCK_SEARCH_STALE_TIME_MS,
    gcTime: 30 * 60_000,
  });

  return {
    ...query,
    debouncedQuery: normalizedQuery,
    rows: query.data ?? EMPTY_STOCK_ROWS,
  };
}

export function useHistoryRange(input: HistoryRangeInput) {
  const authStatus = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: queryKeys.marketData.historyRange(input),
    queryFn: () => getHistoryRange(input),
    enabled:
      authStatus === "authenticated" &&
      Boolean(input.symbol) &&
      Boolean(input.exchange),
    retry: false,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
}
export function useCandles(
  input: CandleListInput,
  options: { ensureFresh?: boolean } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const ensureFresh = options.ensureFresh ?? false;
  const queryClient = useQueryClient();
  const ensuredKeyRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.marketData.candles(input),
    queryFn: () => getCandles(input),
    enabled: authStatus !== "unknown" && Boolean(input.symbol) && Boolean(input.exchange),
    retry: false,
    staleTime: CANDLE_STALE_TIME_MS,
    gcTime: 60 * 60_000,

    // Keeps the previously-displayed candles visible during any refetch
    // (manual Refresh, WS-triggered invalidation, ensure-fresh repair) -
    // isLoading/isFetching still reflect the real query state, this only
    // avoids the array collapsing to [] mid-fetch and the chart briefly
    // rendering a single lone (provisional-merged) candle.
    placeholderData: (previousData) => previousData,
    refetchInterval: (currentQuery) =>
      ensureFresh &&
      input.exchange === "BSE" &&
      currentQuery.state.data?.candles.length === 0
        ? 3_000
        : false,
  });

  useEffect(() => {
    if (!ensureFresh || input.exchange !== "BSE" || !input.symbol || !query.isSuccess) return;
    const ensureKey = `${input.exchange}:${input.symbol}`;
    if (ensuredKeyRef.current === ensureKey) return;
    ensuredKeyRef.current = ensureKey;

    void ensureFreshCandles({ symbol: input.symbol, exchange: input.exchange })
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.marketData.candles(input) }))
      .catch(() => undefined);
  }, [ensureFresh, input, query.isSuccess, queryClient]);

  return { ...query, data: query.data?.candles, dataThrough: query.data?.dataThrough ?? null };
}

const PROGRESSIVE_CANDLE_PAGE_SIZE = 400;

export function useProgressiveCandles(
  input: Omit<CandleListInput, "before" | "limit">,
  options: { ensureFresh?: boolean } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const ensureFresh = options.ensureFresh ?? false;
  const queryClient = useQueryClient();
  const ensuredKeyRef = useRef<string | null>(null);
  const queryInput = { ...input, limit: PROGRESSIVE_CANDLE_PAGE_SIZE };
  const queryKey = queryKeys.marketData.candles(queryInput);
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      getCandles({ ...queryInput, before: pageParam || undefined }),
    initialPageParam: "",
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextBefore ? lastPage.nextBefore : undefined,
    enabled: authStatus !== "unknown" && Boolean(input.symbol) && Boolean(input.exchange),
    retry: false,
    staleTime: CANDLE_STALE_TIME_MS,
    gcTime: 60 * 60_000,
  });

  useEffect(() => {
    if (!ensureFresh || input.exchange !== "BSE" || !input.symbol || !query.isSuccess) return;
    const ensureKey = `${input.exchange}:${input.symbol}`;
    if (ensuredKeyRef.current === ensureKey) return;
    ensuredKeyRef.current = ensureKey;

    void ensureFreshCandles({ symbol: input.symbol, exchange: input.exchange })
      .then(() => queryClient.invalidateQueries({ queryKey }))
      .catch(() => undefined);
  }, [ensureFresh, input.exchange, input.symbol, query.isSuccess, queryClient, queryKey]);

  const candleMap = new Map<string, Candle>();
  for (const page of [...(query.data?.pages ?? [])].reverse()) {
    for (const candle of page.candles) candleMap.set(candle.time, candle);
  }
  const data = Array.from(candleMap.values()).sort((a, b) => a.time.localeCompare(b.time));

  return {
    ...query,
    data,
    dataThrough: query.data?.pages[0]?.dataThrough ?? null,
  };
}

const CURRENT_DAY_CANDLE_STALE_TIME_MS = 60_000;

export function useCurrentDayCandle(
  input: { symbol: string; exchange: string },
  options: { enabled?: boolean } = {}
) {
  const authStatus = useSessionStore((state) => state.status);
  const enabled = options.enabled ?? true;

  const query = useQuery({
    queryKey: queryKeys.marketData.currentDayCandle(input),
    queryFn: () => getCurrentDayCandle(input),
    enabled:
      authStatus !== "unknown" &&
      enabled &&
      Boolean(input.symbol) &&
      Boolean(input.exchange) &&
      input.exchange === "BSE",
    retry: false,
    staleTime: CURRENT_DAY_CANDLE_STALE_TIME_MS,
    gcTime: 5 * 60_000,
  });

  return { ...query, candle: query.data?.candle ?? null, capability: query.data?.capability ?? null };
}

export function useManualChartRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ensureFreshCandles,
    onSuccess: (response, variables) => {
      if (variables.exchange) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.marketData.currentDayCandle({ symbol: variables.symbol, exchange: variables.exchange }),
        });
      }

      void queryClient.invalidateQueries({
        predicate: (query) => {
          const [namespace, resource, input] = query.queryKey;
          if (namespace !== "market-data" || resource !== "candles") return false;
          const candleInput = input as { symbol?: string; exchange?: string } | undefined;
          return candleInput?.symbol === variables.symbol && candleInput?.exchange === variables.exchange;
        },
      });
    },
  });
}

export function useIndexRelativeStrength(limit?: number, exchange?: string) {
  const authStatus = useSessionStore((state) => state.status);

  const query = useQuery({
    queryKey: queryKeys.marketData.indexRelativeStrength(limit, exchange),
    queryFn: () => getIndexRelativeStrength(limit, exchange),
    enabled: authStatus === "authenticated",
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,

    placeholderData: (previousData) => previousData,
  });

  return { ...query, metrics: query.data?.metrics ?? [], asOfDate: query.data?.asOfDate ?? null };
}

