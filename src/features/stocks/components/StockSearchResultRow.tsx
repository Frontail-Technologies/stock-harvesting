"use client";

import type { ReactNode } from "react";
import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";

type StockSearchResultRowProps = {
  stock: Pick<Stock, "symbol" | "name" | "exchange">;
  // Caller-owned right-side control - a Plus/Trash2 membership toggle, a
  // quick-add popover trigger, nothing at all, etc. This component only
  // lays the row out; it has no opinion on what the action means or does.
  action?: ReactNode;
  // When provided, the Symbol/Name block itself becomes clickable (e.g.
  // "select this stock", "add this stock") - omit it to make the row body
  // inert and require the explicit action control instead.
  onSelect?: () => void;
  selected?: boolean;
  className?: string;
};

// Shared Symbol / Company Name / Exchange presentation for a single stock
// search result - extracted so WatchlistStockSearchInput (Watchlist
// membership) and StockSearchCombobox (Charts navigation) stop
// duplicating the same row markup while keeping their own, different
// row-click and action behavior.
export function StockSearchResultRow({
  stock,
  action,
  onSelect,
  selected,
  className,
}: StockSearchResultRowProps) {
  const nameBlock = (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-semibold text-foreground">{stock.symbol}</span>
      <span className="block truncate text-xs text-muted-foreground">
        {stock.name} - {stock.exchange}
      </span>
    </span>
  );

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
        selected && "bg-primary/15 text-foreground",
        className
      )}
    >
      {onSelect ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onSelect}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          {nameBlock}
        </button>
      ) : (
        nameBlock
      )}
      {action}
    </div>
  );
}
