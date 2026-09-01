"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMarketExchanges } from "@/features/market";
import { formatCurrencyValue, getCurrencyForExchange } from "../lib/currency-formatters";

type CurrencyContextValue = {
  formatStockCurrency: (value: number, exchange?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { exchanges } = useMarketExchanges();

  const value = useMemo(() => {
    return {
      formatStockCurrency: (amount: number, exchange?: string) => {
        const nativeCurrency = getCurrencyForExchange(exchange, exchanges);
        return formatCurrencyValue(amount, nativeCurrency);
      },
    };
  }, [exchanges]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
