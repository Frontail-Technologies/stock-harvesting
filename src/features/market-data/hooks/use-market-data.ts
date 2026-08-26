"use client";

import { useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { DEFAULT_MARKET_EXCHANGE } from "@/features/market";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { mockStocks } from "@/mocks/market/stocks";
import { DEV_MOCK_FALLBACK_ENABLED } from "@/utils/frontend-flags";
import { searchStocks } from "@/utils/stock-search";
import { MARKET_DATA_PAGE_SIZE, STOCK_SEARCH_LIMIT } from "../constants";
import {
  getCandles,
  getHistoryRange,
  getIndexRelativeStrength,
  getStocks,
  searchStocksApi,
} from "../api/market-data-api";
import { normalizeStocks } from "../lib/stock-mappers";
import { useMarketDataCacheStore } from "../stores/market-data-cache-store";
import type { CandleListInput, HistoryRangeInput, StockListInput } from "../types";
import type { Stock } from "@/types/market";

const STOCK_SEARCH_STALE_TIME_MS = 10 * 60_000;
const STOCK_LIST_STALE_TIME_MS = 5 * 60_000;
const CANDLE_STALE_TIME_MS = 30 * 60_000;
const SCANNER_SEARCH_DEBOUNCE_MS = 450;
// `query.data ?? []` would otherwise construct a brand-new array on every
// render while the query has no data yet (disabled, or still in flight) -
// consumers that key an effect/memo off this array's identity (e.g.
// resetting a highlighted index whenever "the results changed") would see
// a "new" array every render even though nothing changed, which can
// cascade into a render loop. Reusing one stable empty array for that
// case fixes it at the source instead of asking every consumer to work
// around it.
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
export function useCandles(input: CandleListInput) {
  const authStatus = useSessionStore((state) => state.status);

  return useQuery({
    queryKey: queryKeys.marketData.candles(input),
    queryFn: async () => {
      const response = await getCandles(input);
      return response.candles;
    },
    enabled: authStatus !== "unknown" && Boolean(input.symbol) && Boolean(input.exchange),
    retry: false,
    staleTime: CANDLE_STALE_TIME_MS,
    gcTime: 60 * 60_000,
  });
}

// Not collection-scoped — same index ranking regardless of which dashboard
// collection is open, so the query key deliberately has no `code`/filter
// dependency (only `exchange`, so NSE/BSE index views cache independently)
// and stays cached across collection switches within the same exchange.
export function useIndexRelativeStrength(limit?: number, exchange?: string) {
  const authStatus = useSessionStore((state) => state.status);

  const query = useQuery({
    queryKey: queryKeys.marketData.indexRelativeStrength(limit, exchange),
    queryFn: async () => {
      const response = await getIndexRelativeStrength(limit, exchange);
      return response.metrics;
    },
    enabled: authStatus === "authenticated",
    retry: false,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

  return { ...query, metrics: query.data ?? [] };
}

