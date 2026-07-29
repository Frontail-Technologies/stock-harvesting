"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stock } from "@/types/market";

type StocksCacheEntry = {
  rows: Stock[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type MarketDataCacheState = {
  stocksByExchange: Record<string, StocksCacheEntry>;
  setStocksSnapshot: (exchange: string, entry: StocksCacheEntry) => void;
};

// A stale-while-revalidate "paint cache", not a replacement for TanStack
// Query's own cache: it only ever seeds the very first render on a cold
// page load (via placeholderData) with whatever was last successfully
// fetched, so the stocks view can paint instantly instead of blank while
// the real query silently revalidates in the background.
export const useMarketDataCacheStore = create<MarketDataCacheState>()(
  persist(
    (set) => ({
      stocksByExchange: {},
      setStocksSnapshot: (exchange, entry) =>
        set((state) => ({
          stocksByExchange: { ...state.stocksByExchange, [exchange]: entry },
        })),
    }),
    {
      name: "stock-harvesting-market-data-cache",
    }
  )
);
