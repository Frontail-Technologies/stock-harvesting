"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { useAddWatchlistItem, useCreateWatchlist, useWatchlists } from "../hooks/use-watchlists";

type WatchlistQuickAddButtonProps = {
  exchange: string;
  symbol: string;
  className?: string;
};

export function WatchlistQuickAddButton({
  exchange,
  symbol,
  className,
}: WatchlistQuickAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addedWatchlistId, setAddedWatchlistId] = useState<string | null>(null);
  const [popoverRect, setPopoverRect] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { watchlists } = useWatchlists();
  const addItem = useAddWatchlistItem();
  const createList = useCreateWatchlist();

  const closePopover = () => {
    setOpen(false);
    setAddedWatchlistId(null);
    setNewName("");
  };

  useEffect(() => {
    if (!open) return;

    const updateRect = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverRect({ top: rect.bottom + 4, left: Math.max(8, rect.right - 224) });
    };
    updateRect();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      closePopover();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopover();
    };

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleAddToExisting = (watchlistId: string) => {
    addItem.mutate(
      { watchlistId, exchange, symbol },
      { onSuccess: () => setAddedWatchlistId(watchlistId) }
    );
  };

  const handleCreateAndAdd = () => {
    const name = newName.trim();
    if (!name) return;
    createList.mutate(
      { name },
      {
        onSuccess: (result) => {
          setNewName("");
          handleAddToExisting(result.watchlist.id);
        },
      }
    );
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          ref={triggerRef}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            if (open) closePopover();
            else setOpen(true);
          }}
          aria-label={`Add ${symbol} to a watchlist`}
          className={cn(
            "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            open && "bg-muted text-foreground",
            className
          )}
        >
          <ListPlus className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="top">Add to watchlist</TooltipContent>
      </Tooltip>

      {open && popoverRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={popoverRef}
              style={{ top: popoverRect.top, left: popoverRect.left }}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              className="scanner-portal fixed z-[60] w-56 rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl"
            >
              <div className="px-1.5 pb-1.5 text-xs font-semibold text-muted-foreground">
                Add {symbol} to watchlist
              </div>

              <div className="max-h-48 overflow-y-auto">
                {watchlists.length === 0 && (
                  <p className="px-1.5 py-1.5 text-xs text-muted-foreground">
                    No watchlists yet.
                  </p>
                )}
                {watchlists.map((watchlist) => {
                  const isAdded = addedWatchlistId === watchlist.id;
                  return (
                    <button
                      key={watchlist.id}
                      type="button"
                      disabled={addItem.isPending}
                      onClick={() => handleAddToExisting(watchlist.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="truncate">{watchlist.name}</span>
                      {isAdded && <Check className="size-3.5 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-1 flex items-center gap-1 border-t border-border pt-1.5">
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCreateAndAdd();
                  }}
                  placeholder="New watchlist"
                  className="h-7 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
                />
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    disabled={!newName.trim() || createList.isPending}
                    onClick={handleCreateAndAdd}
                    aria-label="Create watchlist and add stock"
                    className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createList.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top">Create watchlist</TooltipContent>
                </Tooltip>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
