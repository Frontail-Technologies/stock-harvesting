import type { Stock } from "@/types/market";
import type { WatchlistItem } from "../types";

export function watchlistItemToStock(item: Pick<WatchlistItem, "symbol" | "exchange">): Stock {
  return {
    symbol: item.symbol,
    name: item.symbol,
    exchange: item.exchange,
    close: 0,
    changePct: 0,
    volume: 0,
  };
}
