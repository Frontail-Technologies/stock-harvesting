import { API_ROUTES } from "@/features/api/constants/api-routes";
import type { MarketExchangeInfo, MarketExchangesResponse } from "@/features/market";
import type { StockListItem, StockListResponse } from "@/features/market-data";
import type { Candle } from "@/types/market";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const IDENTITY_REVALIDATE_SECONDS = 1800;
const CANDLES_REVALIDATE_SECONDS = 86400;
const EXCHANGES_REVALIDATE_SECONDS = 86400;

type ApiEnvelope<T> = { data: T };

async function publicApiGet<T>(
  path: string,
  next: { revalidate: number; tags: string[] },
): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, { next });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Public stock-detail fetch failed: ${path} (${response.status})`);
  }

  const body = (await response.json()) as ApiEnvelope<T>;
  return body.data;
}

export function publicStockTag(exchange: string, symbol: string): string {
  return `public-stock:${exchange}:${symbol}`;
}

export function publicStockCandlesTag(exchange: string, symbol: string): string {
  return `public-stock-candles:${exchange}:${symbol}`;
}

export async function fetchPublicStockIdentity(
  symbol: string,
  exchange: string,
): Promise<StockListItem | null> {
  const query = new URLSearchParams({ q: symbol, exchange, limit: "5" });
  const result = await publicApiGet<StockListResponse>(
    `${API_ROUTES.marketData.stockSearch}?${query.toString()}`,
    { revalidate: IDENTITY_REVALIDATE_SECONDS, tags: [publicStockTag(exchange, symbol)] },
  );

  if (!result) return null;
  return result.stocks.find((row) => row.symbol === symbol && row.exchange === exchange) ?? null;
}

export async function fetchPublicDailyCandles(
  symbol: string,
  exchange: string,
): Promise<Candle[]> {
  const query = new URLSearchParams({ exchange });
  const result = await publicApiGet<{ candles: Candle[] }>(
    `${API_ROUTES.marketData.publicCandles(symbol)}?${query.toString()}`,
    { revalidate: CANDLES_REVALIDATE_SECONDS, tags: [publicStockCandlesTag(exchange, symbol)] },
  );

  return result?.candles ?? [];
}

export async function fetchPublicExchanges(): Promise<MarketExchangeInfo[]> {
  const result = await publicApiGet<MarketExchangesResponse>(API_ROUTES.marketData.exchanges, {
    revalidate: EXCHANGES_REVALIDATE_SECONDS,
    tags: ["public-stock-exchanges"],
  });

  return result?.exchanges ?? [];
}
