import { apiFetch, API_ROUTES } from "@/features/api";
import type { ExchangeRatesResponse, MarketExchangesResponse } from "../types";

export function getMarketExchanges() {
  return apiFetch<MarketExchangesResponse>(API_ROUTES.marketData.exchanges);
}

export function getExchangeRates() {
  return apiFetch<ExchangeRatesResponse>(API_ROUTES.marketData.exchangeRates);
}
