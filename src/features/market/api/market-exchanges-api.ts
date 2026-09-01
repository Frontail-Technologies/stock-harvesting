import { apiFetch, API_ROUTES } from "@/features/api";
import type { MarketExchangesResponse } from "../types";

export function getMarketExchanges() {
  return apiFetch<MarketExchangesResponse>(API_ROUTES.marketData.exchanges);
}
