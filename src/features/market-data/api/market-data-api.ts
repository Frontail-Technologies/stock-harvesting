import { apiFetch, API_ROUTES } from "@/features/api";
import type {
  CandleListInput,
  CandleListResponse,
  StockListInput,
  StockListResponse,
} from "../types";

function withQuery(
  path: string,
  query: Record<string, string | number | string[] | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function getStocks(input: StockListInput = {}) {
  return apiFetch<StockListResponse>(
    withQuery(API_ROUTES.marketData.stocks, {
      q: input.q,
      page: input.page ?? 1,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
      exchange: input.exchange,
      moveFilter: input.moveFilter,
      minVolume: input.minVolume,
      includeUnpriced: input.includeUnpriced ? "true" : undefined,
    })
  );
}

export async function searchStocksApi(input: StockListInput = {}) {
  return apiFetch<StockListResponse>(
    withQuery(API_ROUTES.marketData.stockSearch, {
      q: input.q,
      page: input.page ?? 1,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
      exchange: input.exchange,
      moveFilter: input.moveFilter,
      minVolume: input.minVolume,
      includeUnpriced: input.includeUnpriced ? "true" : undefined,
    })
  );
}

export async function getCandles(input: CandleListInput) {
  return apiFetch<CandleListResponse>(
    withQuery(API_ROUTES.marketData.candles(input.symbol), {
      timeframe: input.timeframe,
      from: input.from,
      to: input.to,
      exchange: input.exchange,
    })
  );
}
