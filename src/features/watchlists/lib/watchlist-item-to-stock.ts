import type { Stock } from "@/types/market";
import type { WatchlistItem } from "../types";

// A minimal placeholder Stock built straight from a watchlist item's own
// saved symbol/exchange - price/name fill in once Scanner's own queries
// resolve, the same convention ScannerPage uses for a URL-only stock.
// Never a global-exchange lookup: the exchange always comes from the item
// itself, not whatever Scanner or Search currently has selected.
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
