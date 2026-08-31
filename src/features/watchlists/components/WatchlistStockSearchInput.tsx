"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useChartEligibleBseStockSearch } from "@/features/market-data";
import { cn } from "@/utils/cn";
import { useAddWatchlistItem } from "../hooks/use-watchlists";

const MENU_VIEWPORT_MARGIN = 8;

type WatchlistStockSearchInputProps = {
  watchlistId: string;
  existingItems: Array<{ exchange: string; symbol: string }>;
  className?: string;
};

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

  const trimmedQuery = query.trim();
  const stockSearchQuery = useChartEligibleBseStockSearch(query, 8, {
    enabled: open && trimmedQuery.length >= 2,
    minLength: 2,
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
      const desiredWidth = Math.max(rect.width, 260);
      const maxWidth = window.innerWidth - MENU_VIEWPORT_MARGIN * 2;
      const width = Math.min(desiredWidth, maxWidth);
      // Anchor to the input's right edge and grow leftward when the
      // panel/sidebar is docked at the viewport's right edge (the common
      // case here) - growing rightward from rect.left would push the menu
      // past the viewport edge instead of staying visible.
      const left = Math.min(
        Math.max(rect.right - width, MENU_VIEWPORT_MARGIN),
        window.innerWidth - width - MENU_VIEWPORT_MARGIN
      );
      setMenuRect({ top: rect.bottom + 4, left, width });
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
          placeholder="Search BSE stocks to add..."
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
                        <span className="block truncate font-semibold text-foreground">
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
