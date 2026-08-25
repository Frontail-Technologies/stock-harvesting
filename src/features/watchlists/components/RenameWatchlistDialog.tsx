"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useRenameWatchlist } from "../hooks/use-watchlists";
import type { WatchlistSummary } from "../types";

type RenameWatchlistDialogProps = {
  watchlist: WatchlistSummary | null;
  onClose: () => void;
};

export function RenameWatchlistDialog({ watchlist, onClose }: RenameWatchlistDialogProps) {
  return (
    <Dialog
      open={watchlist !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        {/* Keyed by id so a fresh target (dialog reopened on a different
            row) starts with clean useState initializers instead of
            needing an effect to reset stale name/error state. */}
        {watchlist && (
          <RenameWatchlistForm key={watchlist.id} watchlist={watchlist} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RenameWatchlistForm({
  watchlist,
  onClose,
}: {
  watchlist: WatchlistSummary;
  onClose: () => void;
}) {
  const [name, setName] = useState(watchlist.name);
  const [error, setError] = useState<string | null>(null);
  const rename = useRenameWatchlist();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === watchlist.name) {
      onClose();
      return;
    }
    setError(null);
    rename.mutate(
      { id: watchlist.id, name: trimmed },
      {
        onSuccess: () => onClose(),
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error ? mutationError.message : "Couldn't rename watchlist."
          );
        },
      }
    );
  };

  return (
    <>
      <DialogHeader>
        <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Rename Watchlist
        </p>
        <DialogTitle className="sr-only">Rename watchlist</DialogTitle>
        <DialogDescription className="sr-only">Rename this watchlist.</DialogDescription>
      </DialogHeader>

      <div>
        <label htmlFor="rename-watchlist-name" className="text-xs font-medium text-muted-foreground">
          Watchlist name
        </label>
        <Input
          id="rename-watchlist-name"
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          className="mt-1.5"
        />
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!name.trim() || rename.isPending}
          onClick={handleSubmit}
          className="gap-1.5"
        >
          {rename.isPending && <Loader2 className="size-3.5 animate-spin" />}
          {rename.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}
