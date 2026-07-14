"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Stock } from "@/types/market";
import { mockStocks, popularSearchSymbols } from "@/mocks/market/stocks";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { findStockBySymbol, searchStocks } from "@/utils/stock-search";

type StockSearchComboboxProps = {
  selectedStock: Stock;
  onSelectStock: (stock: Stock) => void;
};

export function StockSearchCombobox({
  selectedStock,
  onSelectStock,
}: StockSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed) return searchStocks(mockStocks, trimmed).slice(0, 8);

    return popularSearchSymbols
      .map((symbol) => findStockBySymbol(mockStocks, symbol))
      .filter((stock): stock is Stock => Boolean(stock));
  }, [query]);

  const selectStock = (stock: Stock) => {
    onSelectStock(stock);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none lg:w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && results[0]) {
            event.preventDefault();
            selectStock(results[0]);
          }
          if (event.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder={`Search ${selectedStock.symbol}`}
        className="h-8 border-border bg-muted/35 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
      />

      {open && (
        <div className="fixed left-2 right-2 top-12 z-50 mt-1 max-h-[70dvh] overflow-hidden rounded-md border border-border bg-popover shadow-xl sm:absolute sm:left-0 sm:right-auto sm:top-full sm:w-96">
          <div className="border-b border-border px-3 py-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {query.trim() ? "Matches" : "Popular"}
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No stocks found.</p>
            ) : (
              results.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectStock(stock)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    selectedStock.symbol === stock.symbol && "bg-primary/10"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">
                      {stock.symbol}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {stock.name} - {stock.exchange}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatCurrency(stock.close)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
