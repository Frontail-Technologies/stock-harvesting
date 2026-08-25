"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Stock } from "@/types/market";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWatchlist } from "@/features/watchlists";
import { cn } from "@/utils/cn";

type ScannerWatchlistWidgetProps = {
  watchlistId: string;
  selectedSymbol: string;
  selectedExchange: string;
  onSelectStock: (stock: Stock) => void;
  onClose: () => void;
};

// Auto-opened only via the ?watchlist= URL param set by the Watchlists
// page's "Open in Scanner" link - there is no scanner-side control that
// opens this (see the plan/brief: the scanner toolbar deliberately has no
// watchlist affordance). Desktop gets a floating panel over unused chart
// space; mobile gets a bottom sheet instead of an overlay, since a small
// floating panel would be unusable at phone width.
function useIsDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
  );

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const handleChange = () => setIsDesktop(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

function watchlistItemToStock(item: { symbol: string; exchange: string }): Stock {
  return {
    symbol: item.symbol,
    name: item.symbol,
    exchange: item.exchange,
    close: 0,
    changePct: 0,
    volume: 0,
  };
}

function WatchlistItemsList({
  items,
  selectedSymbol,
  selectedExchange,
  onSelectStock,
}: {
  items: Array<{ id: string; symbol: string; exchange: string }>;
  selectedSymbol: string;
  selectedExchange: string;
  onSelectStock: (stock: Stock) => void;
}) {
  if (items.length === 0) {
    return <p className="px-1.5 py-2 text-sm text-muted-foreground">No stocks in this watchlist.</p>;
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = item.symbol === selectedSymbol && item.exchange === selectedExchange;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelectStock(watchlistItemToStock(item))}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-primary/15 text-foreground"
              )}
            >
              <span className="font-semibold text-foreground">{item.symbol}</span>
              <span className="text-xs text-muted-foreground">{item.exchange}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ScannerWatchlistWidget({
  watchlistId,
  selectedSymbol,
  selectedExchange,
  onSelectStock,
  onClose,
}: ScannerWatchlistWidgetProps) {
  const { watchlist, isLoading } = useWatchlist(watchlistId);
  const isDesktop = useIsDesktopViewport();

  if (isDesktop) {
    return (
      <div className="absolute right-2 top-2 z-20 w-56 select-none sm:right-3 sm:top-3">
        <div className="max-h-[60dvh] overflow-hidden rounded-md border border-border/70 bg-popover/90 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2.5 py-2">
            <span className="min-w-0 truncate text-xs font-semibold text-foreground">
              {watchlist?.name ?? "Watchlist"}
            </span>
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={onClose}
                aria-label="Close watchlist"
                className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="scanner-portal">
                Close watchlist
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="max-h-[calc(60dvh-2.25rem)] overflow-y-auto p-1.5">
            {isLoading ? (
              <div className="flex justify-center py-3">
                <Spinner size="sm" />
              </div>
            ) : (
              <WatchlistItemsList
                items={watchlist?.items ?? []}
                selectedSymbol={selectedSymbol}
                selectedExchange={selectedExchange}
                onSelectStock={onSelectStock}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Sheet
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent side="bottom" className="scanner-portal max-h-[70dvh] gap-3">
        <SheetHeader>
          <SheetTitle>{watchlist?.name ?? "Watchlist"}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <WatchlistItemsList
              items={watchlist?.items ?? []}
              selectedSymbol={selectedSymbol}
              selectedExchange={selectedExchange}
              onSelectStock={(stock) => {
                onSelectStock(stock);
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
