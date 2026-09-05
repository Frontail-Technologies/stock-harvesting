"use client";

import type { WatchlistItem } from "../types";
import { WatchlistStockRow } from "./WatchlistStockRow";

type WatchlistStockListProps = {
  items: WatchlistItem[];
  onStockClick: (item: WatchlistItem) => void;
};

// Vertical, one-stock-per-row list with an internal scroll region once
// content overflows - fills whatever body height the parent widget card
// (bounded by its own min/max-height) leaves available, rather than
// capping itself independently or growing the whole card.
export function WatchlistStockList({ items, onStockClick }: WatchlistStockListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pr-0.5">
      {items.map((item) => (
        <WatchlistStockRow key={item.id} symbol={item.symbol} onClick={() => onStockClick(item)} />
      ))}
    </div>
  );
}
