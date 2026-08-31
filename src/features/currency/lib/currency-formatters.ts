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

export function convertCurrency(
  value: number,
  fromCurrency: AppCurrency,
  toCurrency: AppCurrency,
  ratesToUsd: Record<string, number>
) {
  if (fromCurrency === toCurrency) return value;

  const fromRate = ratesToUsd[fromCurrency] ?? 1;
  const toRate = ratesToUsd[toCurrency] ?? 1;
  if (toRate === 0) return value;

  return (value * fromRate) / toRate;
}

export function formatCurrencyValue(
  value: number,
  displayCurrency: AppCurrency,
  sourceCurrency: AppCurrency,
  ratesToUsd: Record<string, number>
) {
  const convertedValue = convertCurrency(value, sourceCurrency, displayCurrency, ratesToUsd);
  const fractionDigits = getAdaptiveFractionDigits(convertedValue);

  try {
    return new Intl.NumberFormat(displayCurrency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: displayCurrency,
      minimumFractionDigits: fractionDigits.minimum,
      maximumFractionDigits: fractionDigits.maximum,
    }).format(convertedValue);
  } catch {

    return `${displayCurrency} ${convertedValue.toFixed(fractionDigits.maximum)}`;
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
