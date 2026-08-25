"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import type { Stock } from "@/types/market";
import { Input } from "@/components/ui/input";
import { WatchlistQuickAddButton } from "@/features/watchlists/components/WatchlistQuickAddButton";
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
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (inputRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

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
        className="h-8 border-border/60 bg-muted/35 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/25 sm:pr-3 sm:text-sm"
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
              className="scanner-portal fixed z-50 max-h-[70dvh] overflow-hidden rounded-md border border-border bg-popover shadow-xl"
            >
              <div className="max-h-72 overflow-y-auto py-1">
                {results.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No stocks found.</p>
                ) : (
                  results.map((stock) => (
                    <div
                      key={stock.symbol}
                      className={cn(
                        "flex w-full items-center gap-1 px-1.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground",
                        selectedStock.symbol === stock.symbol && "bg-primary/15 text-foreground"
                      )}
                    >
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectStock(stock)}
                        className="min-w-0 flex-1 cursor-pointer px-1.5 py-1 text-left text-sm"
                      >
                        <span className="block font-semibold text-foreground">
                          {stock.symbol}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {stock.name} - {stock.exchange}
                        </span>
                      </button>
                      <WatchlistQuickAddButton exchange={stock.exchange} symbol={stock.symbol} />
                    </div>
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

