"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Stock } from "@/types/market";
import { searchStocks } from "@/lib/mock-stocks";
import { formatCurrency } from "@/lib/formatters";
import { Input } from "@/components/ui/input";

type SearchStocksInputProps = {
  onSelectStock: (stock: Stock) => void;
};

export function SearchStocksInput({ onSelectStock }: SearchStocksInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim() ? searchStocks(query) : [];

  const handleSelect = (stock: Stock) => {
    onSelectStock(stock);
    setQuery(stock.symbol);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-[200px]">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 120);
        }}
        placeholder="Search stocks..."
        className="h-8 border-border bg-background pl-8 text-sm"
      />

      {isOpen && query.trim() && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[280px] rounded-md border border-border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No stocks found.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((stock) => (
                <li key={stock.symbol}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(stock)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium text-foreground">{stock.symbol}</span>{" "}
                      <span className="text-xs text-muted-foreground">{stock.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(stock.close)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
