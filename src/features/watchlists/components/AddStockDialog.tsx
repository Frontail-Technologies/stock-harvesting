"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useWatchlist } from "../hooks/use-watchlists";
import { WatchlistStockSearchInput } from "./WatchlistStockSearchInput";

type AddStockDialogProps = {
  watchlistId: string | null;
  onClose: () => void;
};

export function AddStockDialog({ watchlistId, onClose }: AddStockDialogProps) {
  const { watchlist, isLoading } = useWatchlist(watchlistId);

  return (
    <Dialog
      open={watchlistId !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Add Stock
          </p>
          <DialogTitle className="sr-only">Add stock to watchlist</DialogTitle>
          <DialogDescription>
            Watchlist:{" "}
            <span className="font-medium text-foreground">{watchlist?.name ?? "..."}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading || !watchlist ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : (
          <WatchlistStockSearchInput watchlistId={watchlist.id} existingItems={watchlist.items} />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
