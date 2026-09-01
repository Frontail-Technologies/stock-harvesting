import type { MarketExchangeInfo } from "@/features/market";
import type { AppCurrency } from "../types";

export function getCurrencyForExchange(
  exchange: string | undefined,
  exchanges: MarketExchangeInfo[]
): AppCurrency {
  if (!exchange) return "USD";
  const match = exchanges.find((item) => item.code === exchange.toUpperCase());
  return match?.currency?.toUpperCase() || "USD";
}

// Currency comes entirely from the instrument's own exchange (see
// getCurrencyForExchange) - there is no manual/user-selected display
// currency, so this only ever formats a value in its own native currency.
export function formatCurrencyValue(value: number, currency: AppCurrency) {
  const fractionDigits = getAdaptiveFractionDigits(value);

  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits.minimum,
      maximumFractionDigits: fractionDigits.maximum,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(fractionDigits.maximum)}`;
  }
}

function getAdaptiveFractionDigits(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue === 0 || absoluteValue >= 1) {
    return { minimum: 2, maximum: 2 };
  }

  if (absoluteValue >= 0.01) {
    return { minimum: 2, maximum: 4 };
  }

  if (absoluteValue >= 0.0001) {
    return { minimum: 4, maximum: 6 };
  }

  return { minimum: 6, maximum: 8 };
}
