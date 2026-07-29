import type { Stock } from "@/types/market";
import type { StockListItem } from "../types";

export function normalizeStock(stock: StockListItem): Stock {
  return {
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.exchange,
    close: stock.close ?? 0,
    changePct: stock.changePct ?? null,
    volume: stock.volume ?? 0,
    open: stock.open,
    hasMarketData: stock.close !== undefined,
  };
}

export function normalizeStocks(stocks: StockListItem[]) {
  return stocks.map(normalizeStock);
}
