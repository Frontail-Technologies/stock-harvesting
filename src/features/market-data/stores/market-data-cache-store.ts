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
