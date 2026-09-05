"use client";

import { useRouter } from "next/navigation";
import { Maximize2, MoreHorizontal, SquareArrowOutUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWatchlist } from "../hooks/use-watchlists";
import { buildWatchlistChartsHref } from "../lib/watchlist-chart-links";
import type { WatchlistItem, WatchlistSummary } from "../types";
import { WatchlistEmptyWidgetState } from "./WatchlistEmptyWidgetState";
import { WatchlistStockList } from "./WatchlistStockList";
import { WatchlistWidgetSkeleton } from "./WatchlistWidgetSkeleton";
import { Button } from "@/components/ui/button";

type WatchlistWidgetProps = {
  watchlist: WatchlistSummary;
  onRename: () => void;
  onDelete: () => void;
  onAddStock: () => void;
  onFullView: () => void;
};

export function WatchlistWidget({
  watchlist,
  onRename,
  onDelete,
  onAddStock,
  onFullView,
}: WatchlistWidgetProps) {
  const router = useRouter();
  const { watchlist: detail, isLoading } = useWatchlist(watchlist.id);

  const items = [...(detail?.items ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const firstItem: WatchlistItem | undefined = items[0];

  const openInCharts = (item: WatchlistItem) => {
    router.push(
      buildWatchlistChartsHref({
        watchlistId: watchlist.id,
        symbol: item.symbol,
        exchange: item.exchange,
      }),
    );
  };

  return (
    <div className="flex h-full min-h-104 max-h-112 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">
          {watchlist.name}
        </h3>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              type="button"
              disabled={!firstItem}
              onClick={() => firstItem && openInCharts(firstItem)}
              aria-label="Open in Charts"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <SquareArrowOutUpRight className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Open in Charts</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={onFullView}
              aria-label="Open full view"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Open full view</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    aria-label={`${watchlist.name} options`}
                    className="inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  />
                }
              >
                <MoreHorizontal className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {watchlist.name} options
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete Watchlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
        {watchlist.itemCount} {watchlist.itemCount === 1 ? "stock" : "stocks"}
      </p>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <WatchlistWidgetSkeleton />
        ) : items.length === 0 ? (
          <WatchlistEmptyWidgetState onAddStock={onAddStock} />
        ) : (
          <>
            <WatchlistStockList items={items} onStockClick={openInCharts} />
            <Button
              type="button"
              variant="link"
              onClick={onAddStock}
              className="mt-2.5 cursor-pointer self-start text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              + Add Stock
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
