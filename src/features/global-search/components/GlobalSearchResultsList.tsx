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
  // Shown before the user has typed anything - a restrained hint rather
  // than leaving the results area looking blank/broken. Omit to render
  // nothing before a query exists (the original behavior).
  emptyBeforeQuery?: string;
};

// First letters of the company name (falling back to the symbol when a
// name isn't available) - same "first letter of first two words, else
// first two characters" convention as getAvatarInitials, just sourced
// from stock data instead of a person's name/email.
function getStockBadgeText(stock: Stock): string {
  const source = (stock.name || stock.symbol).trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

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
  emptyBeforeQuery,
}: GlobalSearchResultsListProps) {
  if (!hasQuery) {
    if (!emptyBeforeQuery) return null;
    return (
      <div className={cn("flex items-start justify-center px-3 pt-12 pb-10 text-xs text-muted-foreground/80", className)}>
        {emptyBeforeQuery}
      </div>
    );
  }

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
    <ul id={listId} role="listbox" className={cn("divide-y divide-border/60 py-1", className)}>
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
                "flex min-h-[48px] w-full items-center gap-3 border-l-2 px-3 text-left transition-colors",
                active
                  ? "border-l-primary bg-primary/10"
                  : "border-l-transparent text-popover-foreground hover:border-l-primary/40 hover:bg-muted/50"
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[0.65rem] font-bold tracking-tight text-primary"
              >
                {getStockBadgeText(stock)}
              </span>

              <span className="w-28 shrink-0 truncate text-sm font-semibold text-foreground">
                {stock.symbol}
              </span>

              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                {stock.name}
              </span>

              <span className="shrink-0 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {stock.exchange}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
