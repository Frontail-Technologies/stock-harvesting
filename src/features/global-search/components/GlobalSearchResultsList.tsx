"use client";

import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";

type GlobalSearchResultsListProps = {
  results: Stock[];
  isLoading: boolean;
  isError: boolean;
  hasQuery: boolean;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (stock: Stock) => void;
  listId?: string;
  className?: string;
};

// Shared by every search presentation - one place that decides how a
// result row (symbol / company name / exchange), the loading state, the
// empty state, and the error state look, so they can't drift apart
// between the navbar, landing hero, and command dialog.
export function GlobalSearchResultsList({
  results,
  isLoading,
  isError,
  hasQuery,
  highlightedIndex,
  onHighlight,
  onSelect,
  listId,
  className,
}: GlobalSearchResultsListProps) {
  if (!hasQuery) return null;

  if (isLoading) {
    return (
      <div className={cn("px-3 py-2.5 text-sm text-muted-foreground", className)}>
        Searching...
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("px-3 py-2.5 text-sm text-destructive", className)}>
        Couldn&apos;t load results. Try again.
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn("px-3 py-2.5 text-sm text-muted-foreground", className)}>
        No stocks found.
      </div>
    );
  }

  return (
    <ul id={listId} role="listbox" className={cn("py-1", className)}>
      {results.map((stock, index) => {
        const active = index === highlightedIndex;
        return (
          <li key={`${stock.exchange}:${stock.symbol}`} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={active}
              id={listId ? `${listId}-option-${index}` : undefined}
              onMouseEnter={() => onHighlight(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(stock)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-popover-foreground"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground">
                  {stock.symbol}
                </span>
                {stock.name && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {stock.name}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
                {stock.exchange}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
