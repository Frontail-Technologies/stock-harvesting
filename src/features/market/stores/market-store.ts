"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_MARKET_EXCHANGE,
  isEnabledMarketExchange,
  type MarketExchangeCode,
} from "../constants/exchanges";

type MarketState = {
  selectedExchange: MarketExchangeCode;
  setSelectedExchange: (exchange: MarketExchangeCode) => void;
};

export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      selectedExchange: DEFAULT_MARKET_EXCHANGE,
      setSelectedExchange: (selectedExchange) =>
        set({
          selectedExchange: isEnabledMarketExchange(selectedExchange)
            ? selectedExchange
            : DEFAULT_MARKET_EXCHANGE,
        }),
    }),
    {
      name: "stock-harvesting-market",
      partialize: (state) => ({
        selectedExchange: state.selectedExchange,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state || isEnabledMarketExchange(state.selectedExchange)) return;
        state.setSelectedExchange(DEFAULT_MARKET_EXCHANGE);
      },
    }
  )
);
