"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteWatchlist } from "../hooks/use-watchlists";
import type { WatchlistSummary } from "../types";

type DeleteWatchlistDialogProps = {
  watchlist: WatchlistSummary | null;
  onClose: () => void;
};

export function DeleteWatchlistDialog({ watchlist, onClose }: DeleteWatchlistDialogProps) {
  const remove = useDeleteWatchlist();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
      remove.reset();
    }
  };

  const handleConfirm = () => {
    if (!watchlist) return;
    remove.mutate({ id: watchlist.id }, { onSuccess: () => onClose() });
  };

  return (
    <Dialog open={watchlist !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Delete Watchlist
          </p>
          <DialogTitle>Delete &ldquo;{watchlist?.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will remove the watchlist and its saved stock entries. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {remove.isError && (
          <p className="text-xs text-destructive">
            Couldn&apos;t delete this watchlist. Try again.
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={remove.isPending}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            {remove.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {remove.isPending ? "Deleting..." : "Delete Watchlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
