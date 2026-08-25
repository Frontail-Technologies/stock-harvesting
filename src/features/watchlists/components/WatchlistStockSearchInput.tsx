"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useMarketExchanges, useMarketStore } from "@/features/market";
import { useStockSearch } from "@/features/market-data";
import { cn } from "@/utils/cn";
import { useAddWatchlistItem } from "../hooks/use-watchlists";

type WatchlistStockSearchInputProps = {
  watchlistId: string;
  existingItems: Array<{ exchange: string; symbol: string }>;
  className?: string;
};

// Same search-as-you-type pattern as the scanner's StockSearchCombobox
// (debounced query, portal-positioned results dropdown so it isn't clipped
// by this panel's own overflow-y-auto), but unscoped to a single exchange -
// a watchlist can hold stocks from any exchange, unlike the scanner chart
// which only ever shows one at a time - and clicking a result adds it to
// this watchlist instead of selecting a chart symbol.
export function WatchlistStockSearchInput({
  watchlistId,
  existingItems,
  className,
}: WatchlistStockSearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addItem = useAddWatchlistItem();

  // Stock search is always scoped to one exchange on the backend (it
  // defaults to DEFAULT_EXCHANGE = "US" server-side if omitted, which is
  // why an earlier version of this input silently returned nothing for
  // non-US symbols) - default to whatever exchange the app is currently on,
  // but keep it local so changing it here doesn't affect the scanner's
  // global exchange selection.
  const currentExchange = useMarketStore((state) => state.selectedExchange);
  const { exchanges } = useMarketExchanges();
  const [exchange, setExchange] = useState(currentExchange);

  const trimmedQuery = query.trim();
  const stockSearchQuery = useStockSearch(query, 8, {
    enabled: open && trimmedQuery.length >= 2,
    minLength: 2,
    exchange,
  });
  const results = trimmedQuery.length >= 2 ? stockSearchQuery.rows : [];
  const existingKeys = useMemo(
    () => new Set(existingItems.map((item) => `${item.exchange}:${item.symbol}`)),
    [existingItems]
  );

  const handleAdd = (stock: { exchange: string; symbol: string }) => {
    const key = `${stock.exchange}:${stock.symbol}`;
    addItem.mutate(
      { watchlistId, exchange: stock.exchange, symbol: stock.symbol },
      { onSuccess: () => setAddedKey(key) }
    );
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      handleAdd(results[0]);
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
      setMenuRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 260) });
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
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select
        value={exchange}
        onValueChange={(next) => {
          setExchange(next);
          setAddedKey(null);
        }}
        options={
          exchanges.length > 0
            ? exchanges.map((item) => ({ value: item.code, label: item.code }))
            : [{ value: exchange, label: exchange }]
        }
        triggerClassName="h-8 w-20 px-2 text-xs"
      />
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setAddedKey(null);
          }}
          onFocus={() => {
            if (trimmedQuery.length >= 2) setOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={`Search ${exchange} stocks to add...`}
          className="h-8 w-full border-border bg-background pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {open && trimmedQuery.length >= 2 && menuRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className="scanner-portal fixed z-[60] max-h-72 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-xl"
            >
              {stockSearchQuery.isLoading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No stocks found.</p>
              ) : (
                results.map((stock) => {
                  const key = `${stock.exchange}:${stock.symbol}`;
                  const alreadyAdded = existingKeys.has(key) || addedKey === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={alreadyAdded || addItem.isPending}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleAdd(stock)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed",
                        alreadyAdded ? "opacity-60" : "cursor-pointer"
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
                      {alreadyAdded && <Check className="size-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
