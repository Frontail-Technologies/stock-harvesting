"use client";

import { useMemo, useState } from "react";
import { useStockSearch } from "@/features/market-data";
import { useMarketStore } from "@/features/market";
import type { Stock } from "@/types/market";

const GLOBAL_SEARCH_RESULT_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;
// Stable reference for "no results yet" - a fresh `[]` literal here would
// otherwise be a new array identity on every render, which breaks any
// consumer (e.g. keyboard-nav's "reset highlighted index when results
// change") that relies on reference equality to detect an actual change.
const EMPTY_RESULTS: Stock[] = [];

// The one canonical search data layer for every presentation (navbar,
// landing hero, Ctrl+K command panel) - all three call this same hook,
// which itself is a thin wrapper over the existing scanner search stack
// (useStockSearch -> searchStocksApi -> backend /stocks/search, already
// debounced, already routed through the backend's provider-eligibility
// logic). Nothing here talks to an API directly.
//
// Scoped to the app's current exchange (useMarketStore, the same store
// MarketSelector already reads/writes) rather than searching across every
// exchange at once - the backend's search endpoint is exchange-scoped by
// design (confirmed across every existing caller: StockSearchCombobox,
// WatchlistStockSearchInput, MarketSelector's own list), so this reuses
// that real behavior instead of inventing cross-exchange search that
// doesn't exist server-side.
export function useGlobalStockSearch() {
  const [query, setQuery] = useState("");
  const exchange = useMarketStore((state) => state.selectedExchange);

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
    results,
    hasQuery: trimmedQuery.length >= MIN_QUERY_LENGTH,
    isLoading: search.isLoading,
    isError: search.isError,
    reset,
  };
}
