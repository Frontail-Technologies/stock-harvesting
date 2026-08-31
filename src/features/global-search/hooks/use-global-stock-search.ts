"use client";

import { useMemo, useState } from "react";
import { useStockSearch } from "@/features/market-data";
import { useScannerUiStore } from "@/features/scanner";
import type { Stock } from "@/types/market";

const GLOBAL_SEARCH_RESULT_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;

const EMPTY_RESULTS: Stock[] = [];

export function useGlobalStockSearch() {
  const [query, setQuery] = useState("");
  const [exchange, setExchange] = useState(
    () => useScannerUiStore.getState().selectedExchange
  );

  const trimmedQuery = query.trim();
  const search = useStockSearch(query, GLOBAL_SEARCH_RESULT_LIMIT, {
    exchange,
    minLength: MIN_QUERY_LENGTH,
  });

  const results = useMemo(
    () => (trimmedQuery.length >= MIN_QUERY_LENGTH ? search.rows : EMPTY_RESULTS),
    [trimmedQuery.length, search.rows]
  );

  const reset = () => setQuery("");

  return {
    query,
    setQuery,
    exchange,
    setExchange,
    results,
    hasQuery: trimmedQuery.length >= MIN_QUERY_LENGTH,
    isLoading: search.isLoading,
    isError: search.isError,
    reset,
  };
}
