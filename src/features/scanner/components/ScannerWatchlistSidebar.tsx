"use client";

import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal, PanelRightClose, Plus, SquareArrowOutUpRight } from "lucide-react";
import type { Stock } from "@/types/market";
import { EmptyState } from "@/components/ui/empty-state";
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
  chipColorForSymbol,
  CreateWatchlistDialog,
  DeleteWatchlistDialog,
  RenameWatchlistDialog,
  useWatchlist,
  useWatchlists,
  watchlistItemToStock,
  WatchlistStockSearchInput,
  type WatchlistSummary,
} from "@/features/watchlists";
import { cn } from "@/utils/cn";
import { useIsDesktopViewport } from "../hooks/use-is-desktop-viewport";
import {
  SCANNER_WATCHLIST_PANEL_MAX_WIDTH,
  SCANNER_WATCHLIST_PANEL_MIN_WIDTH,
  useScannerUiStore,
} from "../stores/scanner-ui-store";

// Keeps the chart from ever being crushed to nothing when a wide stored
// panel width meets a narrow (but still "desktop") viewport - the stored
// width itself is untouched, this only clamps what's actually rendered.
const MIN_CHART_WIDTH_PX = 320;

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
    return <EmptyState size="compact" title="No stocks in this watchlist yet." className="py-3" />;
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
                "flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border-l-2 px-2 text-left transition-colors",
                active
                  ? "border-l-primary bg-primary/10"
                  : "border-l-transparent hover:border-l-primary/40 hover:bg-muted/60"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold tracking-tight",
                  chipColorForSymbol(item.symbol)
                )}
              >
                {getInitials(item.symbol)}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  active ? "font-bold text-foreground" : "font-semibold text-foreground"
                )}
              >
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
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <EmptyState
        size="compact"
        title="No watchlists yet"
        description="Create a watchlist to track stocks and jump straight into Charts."
        primaryAction={{ label: "Create Watchlist", icon: Plus, onClick: onCreate }}
        secondaryAction={{ label: "Open Watchlists page", href: "/watchlists" }}
      />
    </div>
  );
}

function WatchlistAccordionGroup({
  watchlist,
  expanded,
  selectedSymbol,
  selectedExchange,
  onToggle,
  onSelectStock,
  onRename,
  onDelete,
}: {
  watchlist: WatchlistSummary;
  expanded: boolean;
  selectedSymbol: string;
  selectedExchange: string;
  onToggle: () => void;
  onSelectStock: (stock: Stock) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [showAddInput, setShowAddInput] = useState(false);
  const { watchlist: detail, isLoading } = useWatchlist(expanded ? watchlist.id : null);

  return (
    <div>
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          "flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 outline-none transition-colors",
          expanded ? "bg-primary/5" : "hover:bg-muted/60"
        )}
      >
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left text-sm",
            expanded ? "font-bold text-foreground" : "font-semibold text-foreground"
          )}
        >
          {watchlist.name}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{watchlist.itemCount}</span>

        <div onClick={(event) => event.stopPropagation()} className="shrink-0">
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
              <TooltipContent side="bottom" className="scanner-portal">
                {watchlist.name} options
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="scanner-portal w-40">
              <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete Watchlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="pl-5">
          {isLoading || !detail ? (
            <div className="flex justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              <WatchlistRows
                items={detail.items}
                selectedSymbol={selectedSymbol}
                selectedExchange={selectedExchange}
                onSelectStock={onSelectStock}
              />
              <button
                type="button"
                onClick={() => setShowAddInput((prev) => !prev)}
                className={cn(
                  "mb-1 h-7 cursor-pointer px-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary",
                  showAddInput && "text-primary"
                )}
              >
                + Add Stock
              </button>
              {showAddInput && (
                <div className="pb-2 pl-2">
                  <WatchlistStockSearchInput watchlistId={detail.id} existingItems={detail.items} />
                </div>
              )}
            </>
          )}
        </div>
      )}
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
  const [renameTarget, setRenameTarget] = useState<WatchlistSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WatchlistSummary | null>(null);

  useEffect(() => {
    if (isListLoading) return;
    if (watchlists.length === 0) {
      if (activeWatchlistId !== null) setActiveWatchlistId(null);
      return;
    }
    if (activeWatchlistId && watchlists.some((list) => list.id === activeWatchlistId)) return;
    setActiveWatchlistId(watchlists[0].id);
  }, [activeWatchlistId, isListLoading, setActiveWatchlistId, watchlists]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-2.5 py-2">
        <span className="text-xs font-bold tracking-wide text-foreground uppercase">
          Watchlists
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              aria-label="Create watchlist"
              className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="scanner-portal">
              Create watchlist
            </TooltipContent>
          </Tooltip>
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

      {isListLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : watchlists.length === 0 ? (
        <WatchlistEmptyState onCreate={() => setCreateDialogOpen(true)} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5">
          <div className="flex flex-col gap-0.5">
            {watchlists.map((list) => (
              <WatchlistAccordionGroup
                key={list.id}
                watchlist={list}
                expanded={activeWatchlistId === list.id}
                selectedSymbol={selectedSymbol}
                selectedExchange={selectedExchange}
                onToggle={() =>
                  setActiveWatchlistId(activeWatchlistId === list.id ? null : list.id)
                }
                onSelectStock={onSelectStock}
                onRename={() => setRenameTarget(list)}
                onDelete={() => setDeleteTarget(list)}
              />
            ))}
          </div>
        </div>
      )}

      <CreateWatchlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(watchlistId) => setActiveWatchlistId(watchlistId)}
      />
      <RenameWatchlistDialog watchlist={renameTarget} onClose={() => setRenameTarget(null)} />
      <DeleteWatchlistDialog
        watchlist={deleteTarget}
        onClose={() => {
          setDeleteTarget((current) => {
            if (current && activeWatchlistId === current.id) setActiveWatchlistId(null);
            return null;
          });
        }}
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
  const storedWidth = useScannerUiStore((state) => state.watchlistPanelWidth);
  const setWatchlistPanelWidth = useScannerUiStore((state) => state.setWatchlistPanelWidth);
  const isDesktop = useIsDesktopViewport();
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? Infinity : window.innerWidth
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Only clamps what's rendered right now - never overwrites the stored
  // preference, so widening the window back out restores the full value.
  const viewportMaxWidth = Math.max(
    SCANNER_WATCHLIST_PANEL_MIN_WIDTH,
    Math.min(SCANNER_WATCHLIST_PANEL_MAX_WIDTH, viewportWidth - MIN_CHART_WIDTH_PX)
  );
  const expandedWidth = Math.min(dragWidth ?? storedWidth, viewportMaxWidth);

  const targetWidth = isOpen ? expandedWidth : 0;

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
        onCollapse={() => setOpen(false)}
        collapseLabel="Collapse watchlist panel"
      />
    ),
    [selectedSymbol, selectedExchange, onSelectStock, setOpen]
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
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden rounded-[3px] transition-[width,margin-left] duration-200 ease-out",
        isOpen && "border border-border/60 bg-background"
      )}
      style={{ width: targetWidth, marginLeft: isOpen ? 4 : 0 }}
    >
      {isOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize watchlist panel"
          onPointerDown={handleDragStart}
          className="absolute top-0 -left-0.75 z-10 h-full w-1.5 cursor-col-resize touch-none select-none"
        />
      )}
      {isOpen && desktopBody}
    </div>
  );
}
