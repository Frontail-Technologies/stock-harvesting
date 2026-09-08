"use client";

import { watchlistTintStyleForSymbol } from "../lib/watchlist-colors";

type WatchlistStockRowProps = {
  symbol: string;
  onClick: () => void;
};

export function WatchlistStockRow({ symbol, onClick }: WatchlistStockRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Open ${symbol} in Charts`}
      style={watchlistTintStyleForSymbol(symbol)}
      className="flex w-full shrink-0 cursor-pointer items-center truncate rounded-sm px-2 py-1.5 text-left text-xs font-semibold transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {symbol}
    </button>
  );
}
