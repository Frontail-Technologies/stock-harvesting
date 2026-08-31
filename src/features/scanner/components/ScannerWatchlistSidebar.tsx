"use client";

import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import {
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  SquareArrowOutUpRight,
} from "lucide-react";
import type { Stock } from "@/types/market";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CreateWatchlistDialog,
  useWatchlist,
  useWatchlists,
  watchlistItemToStock,
  WatchlistStockSearchInput,
} from "@/features/watchlists";
import { cn } from "@/utils/cn";
import { useIsDesktopViewport } from "../hooks/use-is-desktop-viewport";
import {
  SCANNER_WATCHLIST_PANEL_MAX_WIDTH,
  SCANNER_WATCHLIST_PANEL_MIN_WIDTH,
  SCANNER_WATCHLIST_PANEL_RAIL_WIDTH,
  useScannerUiStore,
} from "../stores/scanner-ui-store";

const COLLAPSE_ON_DRAG_THRESHOLD = SCANNER_WATCHLIST_PANEL_MIN_WIDTH / 2;

function getInitials(symbol: string) {
  return symbol.slice(0, 2).toUpperCase();
}

type WatchlistItemRow = { id: string; symbol: string; exchange: string };

function WatchlistRows({
  items,
  selectedSymbol,
  selectedExchange,
  onSelectStock,
}: {
  items: WatchlistItemRow[];
  selectedSymbol: string;
  selectedExchange: string;
  onSelectStock: (stock: Stock) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="px-2.5 py-3 text-xs text-muted-foreground">
        No stocks in this watchlist yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-px py-1">
      {items.map((item) => {
        const active = item.symbol === selectedSymbol && item.exchange === selectedExchange;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelectStock(watchlistItemToStock(item))}
              className={cn(
                "flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border-l-2 px-2 text-left transition-colors",
                active
                  ? "border-l-primary bg-primary/10"
                  : "border-l-transparent hover:border-l-primary/40 hover:bg-muted/60"
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[0.6rem] font-bold tracking-tight text-primary"
              >
                {getInitials(item.symbol)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {item.symbol}
              </span>
              <span className="shrink-0 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {item.exchange}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function WatchlistEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-foreground">No watchlists yet</p>
      <p className="max-w-[16rem] text-xs text-muted-foreground">
        Create a watchlist to track stocks and jump straight into Charts.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-1 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="size-3.5" />
        Create Watchlist
      </button>
      <Link
        href="/watchlists"
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Open Watchlists page
      </Link>
    </div>
  );
}

function WatchlistRail({ onMaximize }: { onMaximize: () => void }) {
  return (
    <div className="flex h-full flex-col items-center pt-2">
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={onMaximize}
          aria-label="Expand watchlist panel"
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <PanelRightOpen className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="left" className="scanner-portal">
          Expand watchlist panel
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function ScannerWatchlistPanelBody({
  selectedSymbol,
  selectedExchange,
  onSelectStock,
  onCollapse,
  collapseLabel,
}: {
  selectedSymbol: string;
  selectedExchange: string;
  onSelectStock: (stock: Stock) => void;
  onCollapse: () => void;
  collapseLabel: string;
}) {
  const activeWatchlistId = useScannerUiStore((state) => state.activeWatchlistId);
  const setActiveWatchlistId = useScannerUiStore((state) => state.setActiveWatchlistId);
  const { watchlists, isLoading: isListLoading } = useWatchlists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    if (isListLoading) return;
    if (watchlists.length === 0) {
      if (activeWatchlistId !== null) setActiveWatchlistId(null);
      return;
    }
    if (activeWatchlistId && watchlists.some((list) => list.id === activeWatchlistId)) return;
    setActiveWatchlistId(watchlists[0].id);
  }, [activeWatchlistId, isListLoading, setActiveWatchlistId, watchlists]);

  const { watchlist, isLoading: isDetailLoading } = useWatchlist(activeWatchlistId);
  const selectedName = watchlist?.name ?? (isListLoading ? "Loading..." : "Select watchlist");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-2.5 py-2">
        <span className="text-xs font-bold tracking-wide text-foreground uppercase">
          Watchlists
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/watchlists"
                  aria-label="Open Watchlists page"
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                />
              }
            >
              <SquareArrowOutUpRight className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="scanner-portal">
              Open Watchlists page
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={onCollapse}
              aria-label={collapseLabel}
              className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelRightClose className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="scanner-portal">
              {collapseLabel}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {watchlists.length === 0 && !isListLoading ? (
        <WatchlistEmptyState onCreate={() => setCreateDialogOpen(true)} />
      ) : (
        <>
          <div className="shrink-0 border-b border-border/60 p-1.5">
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-muted aria-expanded:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60">
                  <span className="min-w-0 flex-1 truncate text-left">{selectedName}</span>
                  <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="scanner-portal w-56">
                  {watchlists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => setActiveWatchlistId(list.id)}
                      className={cn(
                        "justify-between gap-2",
                        list.id === activeWatchlistId && "bg-primary/10 text-foreground"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{list.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {list.itemCount}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCreateDialogOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" />
                    New watchlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger
                  type="button"
                  onClick={() => setShowAddInput((prev) => !prev)}
                  aria-label="Add symbol to this watchlist"
                  aria-pressed={showAddInput}
                  className={cn(
                    "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    showAddInput && "bg-muted text-primary"
                  )}
                >
                  <Plus className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="scanner-portal">
                  Add symbol
                </TooltipContent>
              </Tooltip>
            </div>

            {showAddInput && watchlist && (
              <div className="pt-1.5">
                <WatchlistStockSearchInput
                  watchlistId={watchlist.id}
                  existingItems={watchlist.items}
                />
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-1.5">
            {isDetailLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              <WatchlistRows
                items={watchlist?.items ?? []}
                selectedSymbol={selectedSymbol}
                selectedExchange={selectedExchange}
                onSelectStock={onSelectStock}
              />
            )}
          </div>
        </>
      )}

      <CreateWatchlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(watchlistId) => setActiveWatchlistId(watchlistId)}
      />
    </div>
  );
}

type ScannerWatchlistSidebarProps = {
  selectedSymbol: string;
  selectedExchange: string;
  onSelectStock: (stock: Stock) => void;
};

export function ScannerWatchlistSidebar({
  selectedSymbol,
  selectedExchange,
  onSelectStock,
}: ScannerWatchlistSidebarProps) {
  const isOpen = useScannerUiStore((state) => state.isWatchlistPanelOpen);
  const setOpen = useScannerUiStore((state) => state.setWatchlistPanelOpen);
  const isMinimized = useScannerUiStore((state) => state.isWatchlistPanelMinimized);
  const setMinimized = useScannerUiStore((state) => state.setWatchlistPanelMinimized);
  const storedWidth = useScannerUiStore((state) => state.watchlistPanelWidth);
  const setWatchlistPanelWidth = useScannerUiStore((state) => state.setWatchlistPanelWidth);
  const isDesktop = useIsDesktopViewport();
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const expandedWidth = dragWidth ?? storedWidth;

  const targetWidth = !isOpen ? 0 : isMinimized ? SCANNER_WATCHLIST_PANEL_RAIL_WIDTH : expandedWidth;

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = storedWidth;

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = startX - moveEvent.clientX;
      const next = Math.min(
        SCANNER_WATCHLIST_PANEL_MAX_WIDTH,
        Math.max(0, startWidth + delta)
      );
      setDragWidth(next);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setDragWidth((current) => {
        if (current !== null) {
          if (current < COLLAPSE_ON_DRAG_THRESHOLD) {
            setOpen(false);
          } else {
            setWatchlistPanelWidth(current);
          }
        }
        return null;
      });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const desktopBody = useMemo(
    () => (
      <ScannerWatchlistPanelBody
        selectedSymbol={selectedSymbol}
        selectedExchange={selectedExchange}
        onSelectStock={onSelectStock}
        onCollapse={() => setMinimized(true)}
        collapseLabel="Minimize watchlist panel"
      />
    ),
    [selectedSymbol, selectedExchange, onSelectStock, setMinimized]
  );

  if (!isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="scanner-portal max-h-[85dvh] gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Watchlists</SheetTitle>
          </SheetHeader>
          <div className="flex h-[70dvh] flex-col">
            <ScannerWatchlistPanelBody
              selectedSymbol={selectedSymbol}
              selectedExchange={selectedExchange}
              onSelectStock={onSelectStock}
              onCollapse={() => setOpen(false)}
              collapseLabel="Close watchlist panel"
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div

      className="relative flex h-full shrink-0 flex-col overflow-hidden rounded-[3px] border border-border/60 bg-background transition-[width,margin-left] duration-200 ease-out"
      style={{ width: targetWidth, marginLeft: isOpen ? 4 : 0 }}
    >
      {!isMinimized && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize watchlist panel"
          onPointerDown={isOpen ? handleDragStart : undefined}
          className="absolute top-0 -left-0.75 z-10 h-full w-1.5 cursor-col-resize touch-none select-none"
        />
      )}
      {isMinimized ? (
        <WatchlistRail onMaximize={() => setMinimized(false)} />
      ) : (
        desktopBody
      )}
    </div>
  );
}
