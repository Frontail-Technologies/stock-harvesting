"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChartEligibleBseStockSearch } from "@/features/market-data";
import { StockSearchResultRow } from "@/features/stocks";
import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";
import { useAddWatchlistItem, useRemoveWatchlistItem } from "../hooks/use-watchlists";
import type { WatchlistItem } from "../types";

const MENU_VIEWPORT_MARGIN = 8;

type WatchlistStockSearchInputProps = {
  watchlistId: string;
  existingItems: Array<Pick<WatchlistItem, "id" | "exchange" | "symbol">>;
  className?: string;
};

function itemKey(item: { exchange: string; symbol: string }) {
  return `${item.exchange}:${item.symbol}`;
}

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
  // Only tracks which row's *remove* call is currently in flight - a real
  // async pending flag, not a stand-in for membership. Add's own pending
  // row is derived straight from addItem.variables; membership itself
  // always comes from `existingItems` (the live watchlist detail query,
  // already updated optimistically by useAddWatchlistItem/
  // useRemoveWatchlistItem's onMutate) rather than any local click state.
  const [pendingRemoveKey, setPendingRemoveKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addItem = useAddWatchlistItem();
  const removeItem = useRemoveWatchlistItem();

  const trimmedQuery = query.trim();
  const stockSearchQuery = useChartEligibleBseStockSearch(query, 8, {
    enabled: open && trimmedQuery.length >= 2,
    minLength: 2,
  });
  const results = trimmedQuery.length >= 2 ? stockSearchQuery.rows : [];
  const existingItemIdByKey = useMemo(
    () => new Map(existingItems.map((item) => [itemKey(item), item.id])),
    [existingItems]
  );

  const handleToggle = (stock: Pick<Stock, "exchange" | "symbol">) => {
    const key = itemKey(stock);
    const existingItemId = existingItemIdByKey.get(key);

    if (existingItemId) {
      if (removeItem.isPending && pendingRemoveKey === key) return;
      setPendingRemoveKey(key);
      removeItem.mutate(
        { watchlistId, itemId: existingItemId },
        {
          onSettled: () => setPendingRemoveKey((current) => (current === key ? null : current)),
        }
      );
      return;
    }

    if (
      addItem.isPending &&
      addItem.variables?.exchange === stock.exchange &&
      addItem.variables?.symbol === stock.symbol
    ) {
      return;
    }
    addItem.mutate({ watchlistId, exchange: stock.exchange, symbol: stock.symbol });
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      handleToggle(results[0]);
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
                <EmptyState
                  size="compact"
                  illustration={<SearchX className="size-4 text-muted-foreground" />}
                  title="No stocks found."
                  className="px-3 py-2"
                />
              ) : (
                results.map((stock) => {
                  const key = itemKey(stock);
                  const isMember = existingItemIdByKey.has(key);
                  const isAddPendingForThis =
                    addItem.isPending &&
                    addItem.variables?.exchange === stock.exchange &&
                    addItem.variables?.symbol === stock.symbol;
                  const isRemovePendingForThis = pendingRemoveKey === key;
                  const isPendingForThis = isAddPendingForThis || isRemovePendingForThis;
                  const actionLabel = isMember
                    ? `Remove ${stock.symbol} from watchlist`
                    : `Add ${stock.symbol} to watchlist`;

                  return (
                    <StockSearchResultRow
                      key={key}
                      stock={stock}
                      onSelect={isMember ? undefined : () => handleToggle(stock)}
                      action={
                        isPendingForThis ? (
                          <Spinner size="sm" className="shrink-0" />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type="button"
                                  variant={isMember ? "ghost" : "outline"}
                                  size="icon"
                                  aria-label={actionLabel}
                                  className={cn(
                                    "shrink-0",
                                    isMember &&
                                      "text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  )}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleToggle(stock);
                                  }}
                                />
                              }
                            >
                              {isMember ? (
                                <Trash2 className="size-4" />
                              ) : (
                                <Plus className="size-4" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent side="left">{actionLabel}</TooltipContent>
                          </Tooltip>
                        )
                      }
                    />
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
