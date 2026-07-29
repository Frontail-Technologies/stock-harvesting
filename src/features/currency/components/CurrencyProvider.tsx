"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMarketExchanges } from "@/features/market";
import { DEFAULT_CURRENCY } from "../constants";
import { formatCurrencyValue, getCurrencyForExchange } from "../lib/currency-formatters";
import type { AppCurrency } from "../types";

type CurrencyContextValue = {
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
  formatCurrency: (value: number, sourceCurrency?: AppCurrency) => string;
  formatStockCurrency: (value: number, exchange?: string) => string;
  rateLabel: string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = DEFAULT_CURRENCY;
  const { exchanges } = useMarketExchanges();

  const value = useMemo(() => {
    return {
      currency,
      setCurrency: () => undefined,
      formatCurrency: (amount: number, sourceCurrency: AppCurrency = "USD") =>
        formatCurrencyValue(amount, sourceCurrency, sourceCurrency, {}),
      formatStockCurrency: (amount: number, exchange?: string) => {
        const nativeCurrency = getCurrencyForExchange(exchange, exchanges);
        return formatCurrencyValue(amount, nativeCurrency, nativeCurrency, {});
      },
      rateLabel: "Exchange-native currency",
    };
  }, [currency, exchanges]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
