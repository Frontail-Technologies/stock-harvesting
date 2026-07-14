import type { Stock } from "@/types/market";

export function findStockBySymbol(
  stocks: Stock[],
  symbol: string
): Stock | undefined {
  const normalized = symbol.trim().toLowerCase();
  return stocks.find((stock) => stock.symbol.toLowerCase() === normalized);
}

export function searchStocks(stocks: Stock[], query: string): Stock[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(normalized) ||
      stock.name.toLowerCase().includes(normalized)
  );
}
