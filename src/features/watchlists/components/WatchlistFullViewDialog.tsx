"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRemoveWatchlistItem, useWatchlist } from "../hooks/use-watchlists";
import { buildWatchlistChartsHref } from "../lib/watchlist-chart-links";

type WatchlistFullViewDialogProps = {
  watchlistId: string | null;
  onClose: () => void;
  onAddStock: (watchlistId: string) => void;
};

export function WatchlistFullViewDialog({
  watchlistId,
  onClose,
  onAddStock,
}: WatchlistFullViewDialogProps) {
  const router = useRouter();
  const { watchlist, isLoading } = useWatchlist(watchlistId);
  const removeItem = useRemoveWatchlistItem();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const sorted = [...(watchlist?.items ?? [])].sort((a, b) => a.position - b.position);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sorted;
    return sorted.filter((item) => item.symbol.toLowerCase().includes(trimmed));
  }, [watchlist?.items, query]);

  const openInCharts = (symbol: string, exchange: string) => {
    if (!watchlistId) return;
    router.push(buildWatchlistChartsHref({ watchlistId, symbol, exchange }));
  };

  return (
    <Dialog
      open={watchlistId !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          setQuery("");
        }
      }}
    >
      <DialogContent className="flex h-[85dvh] w-[min(96vw,640px)] max-w-[min(96vw,640px)] flex-col gap-0 p-4 sm:max-w-[min(96vw,640px)]">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold">{watchlist?.name ?? "..."}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {watchlist ? `${watchlist.items.length} ${watchlist.items.length === 1 ? "stock" : "stocks"}` : ""}
          </p>
        </DialogHeader>

        {isLoading || !watchlist ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          <>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search this watchlist"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => onAddStock(watchlist.id)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="size-3.5" />
                Add Stock
              </button>
            </div>

            {items.length === 0 ? (
              <EmptyState
                size="compact"
                title={query ? "No matches for your search." : "No stocks added yet."}
                description={query ? undefined : "Add a stock from Charts."}
                className="py-8"
              />
            ) : (
              <div className="mt-2 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-foreground/5 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-10 w-14 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Sr.
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Symbol
                      </TableHead>
                      <TableHead className="h-10 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Exchange
                      </TableHead>
                      <TableHead className="h-10 px-4 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow
                        key={item.id}
                        onClick={() => openInCharts(item.symbol, item.exchange)}
                        className="cursor-pointer border-border/60 hover:bg-primary/5"
                      >
                        <TableCell className="h-12 px-4 text-muted-foreground tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="px-4 font-semibold text-foreground">{item.symbol}</TableCell>
                        <TableCell className="px-4 text-muted-foreground">{item.exchange}</TableCell>
                        <TableCell className="px-4 text-right" onClick={(event) => event.stopPropagation()}>
                          <Tooltip>
                            <DropdownMenu>
                              <TooltipTrigger
                                render={
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`${item.symbol} actions`}
                                        className="ml-auto size-8 cursor-pointer text-muted-foreground hover:text-foreground"
                                      />
                                    }
                                  />
                                }
                              >
                                <MoreHorizontal className="size-4" />
                              </TooltipTrigger>
                              <TooltipContent side="top">{item.symbol} actions</TooltipContent>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openInCharts(item.symbol, item.exchange)}>
                                  Open in Chart
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  render={<Link href={`/stocks/${item.exchange}/${item.symbol}`} target="_blank" />}
                                >
                                  Open Stock Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => removeItem.mutate({ watchlistId: watchlist.id, itemId: item.id })}
                                >
                                  Remove from Watchlist
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
