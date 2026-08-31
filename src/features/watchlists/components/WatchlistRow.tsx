"use client";

import Link from "next/link";
import { ChevronDown, MoreHorizontal, SquareArrowOutUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { useRemoveWatchlistItem, useWatchlist } from "../hooks/use-watchlists";
import type { WatchlistSummary } from "../types";

function formatUpdatedAt(iso: string) {
  return new Date(iso)
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toUpperCase();
}

type WatchlistRowProps = {
  watchlist: WatchlistSummary;
  index: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddStock: () => void;
};

export function WatchlistRow({
  watchlist,
  index,
  expanded,
  onToggleExpanded,
  onRename,
  onDelete,
  onAddStock,
}: WatchlistRowProps) {
  return (
    // Item 5 - the whole row is the hover/click surface visually (a plain
    // div with a mouse-only onClick + hover background, NOT role="button"
    // - real interactive elements sit inside it below (the Open in Charts
    // link, the ⋯ menu), and nesting those inside an element with
    // role="button" would be invalid ARIA). Keyboard/screen-reader users
    // get the SAME toggle via the real <button> on the name segment
    // below, unchanged from before - this only adds a mouse convenience
    // on top of it, never replaces it. The two separate actions stop
    // propagation so a click on them never also toggles the row.
    <div
      onClick={onToggleExpanded}
      className="group -mx-3 cursor-pointer rounded-md px-3 py-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 sm:flex-nowrap sm:items-center">
        <button
          type="button"
          onClick={(event) => {
            // Stops the outer row's own onClick from ALSO firing (it
            // would otherwise toggle twice via bubbling - once here, once
            // on the wrapper - cancelling itself out).
            event.stopPropagation();
            onToggleExpanded();
          }}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${watchlist.name}` : `Expand ${watchlist.name}`}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-none"
        >
          <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground/70">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold tracking-tight text-foreground">
              {watchlist.name}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground/70 transition-transform",
              expanded && "-scale-y-100"
            )}
          />
        </button>

        <div className="flex shrink-0 items-center gap-4 pl-9 sm:pl-0">
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
            {watchlist.itemCount} {watchlist.itemCount === 1 ? "stock" : "stocks"}
          </span>
          <span className="hidden font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground sm:inline">
            Updated {formatUpdatedAt(watchlist.updatedAt)}
          </span>

          <Link
            href={`/charts?watchlist=${encodeURIComponent(watchlist.id)}`}
            aria-label="Open in Charts"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="hidden sm:inline">Open in Charts</span>
            <SquareArrowOutUpRight className="size-3.5" />
          </Link>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`${watchlist.name} options`}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">More actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              className="w-40"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete Watchlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pl-9" onClick={(event) => event.stopPropagation()}>
          <WatchlistExpandedItems watchlistId={watchlist.id} onAddStock={onAddStock} />
        </div>
      )}
    </div>
  );
}

function WatchlistExpandedItems({
  watchlistId,
  onAddStock,
}: {
  watchlistId: string;
  onAddStock: () => void;
}) {
  const { watchlist, isLoading } = useWatchlist(watchlistId);
  const removeItem = useRemoveWatchlistItem();

  if (isLoading || !watchlist) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div>
      {watchlist.items.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No stocks in this watchlist yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/70 border-t border-border/70">
          {watchlist.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-[13px] font-semibold text-foreground">{item.symbol}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
                  {item.exchange}
                </span>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    onClick={() => removeItem.mutate({ watchlistId, itemId: item.id })}
                    aria-label={`Remove ${item.symbol}`}
                    className="inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground/70 transition-colors hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="top">Remove from watchlist</TooltipContent>
                </Tooltip>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAddStock}
        className="mt-2 h-7 gap-1.5 px-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-primary"
      >
        + Add Stock
      </Button>
    </div>
  );
}
