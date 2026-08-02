"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import type { Stock } from "@/types/market";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { useScannerStockSearch } from "../hooks/use-scanner-data";

type StockSearchComboboxProps = {
  selectedStock: Stock;
  exchange: string;
  onSelectStock: (stock: Stock) => void;
  autoFocus?: boolean;
};

export function StockSearchCombobox({
  selectedStock,
  exchange,
  onSelectStock,
  autoFocus,
}: StockSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
    // Only meant to focus once, when this instance mounts (e.g. the mobile
    // search overlay opening) — not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const trimmedQuery = query.trim();
  const stockSearchQuery = useScannerStockSearch(
    query,
    open && trimmedQuery.length >= 2,
    exchange
  );

  const results = useMemo(
    () => (trimmedQuery.length >= 2 ? stockSearchQuery.rows.slice(0, 8) : []),
    [trimmedQuery.length, stockSearchQuery.rows]
  );

  const selectStock = (stock: Stock) => {
    onSelectStock(stock);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setOpen(true);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      selectStock(results[0]);
    }
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) return;

    const updateMenuRect = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      const isMobile = window.innerWidth < 640;
      setMenuRect({
        top: rect.bottom + 4,
        left: isMobile ? 48 : rect.left,
        width: isMobile
          ? Math.max(1, window.innerWidth - 56)
          : Math.min(384, Math.max(rect.width, 320)),
      });
    };

    updateMenuRect();
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [open, trimmedQuery.length]);

  return (
    <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none lg:w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => {
          if (trimmedQuery.length >= 2) setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleInputKeyDown}
        placeholder={`Search ${selectedStock.symbol}`}
        className="h-8 border-border bg-muted/35 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground sm:pr-3 sm:text-sm"
      />

      {open && trimmedQuery.length >= 2 && menuRect && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={menuRef}
          style={{
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
          }}
          className="fixed z-50 max-h-[70dvh] overflow-hidden rounded-md border border-border bg-popover shadow-xl"
        >
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
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">
                      {stock.symbol}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {stock.name} - {stock.exchange}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>,
          document.body
        )
        : null}
    </div>
  );
}
