"use client";

import { useMemo, useState } from "react";
import { useStockSearch } from "@/features/market-data";
import { useScannerUiStore } from "@/features/scanner";
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
// Exchange is owned right here, as plain component state - never a shared
// store. Search reads Scanner's current exchange once, on mount, purely as
// a convenient starting value (e.g. opening Search while Scanner has
// RELIANCE/NSE open defaults Search to NSE too) - after that, Search's
// exchange is entirely local. Changing it here never mutates Scanner, any
// other feature, or a global store; the query key below already includes
// exchange, so switching it here only ever changes what Search itself
// fetches and displays.
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
