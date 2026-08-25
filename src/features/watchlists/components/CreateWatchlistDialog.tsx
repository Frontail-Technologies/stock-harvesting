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
import { useCreateWatchlist } from "../hooks/use-watchlists";

type CreateWatchlistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (watchlistId: string) => void;
};

export function CreateWatchlistDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateWatchlistDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createList = useCreateWatchlist();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setName("");
      setError(null);
      createList.reset();
    }
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    createList.mutate(
      { name: trimmed },
      {
        onSuccess: (result) => {
          handleOpenChange(false);
          onCreated(result.watchlist.id);
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error ? mutationError.message : "Couldn't create watchlist."
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            New Watchlist
          </p>
          <DialogTitle className="sr-only">New watchlist</DialogTitle>
          <DialogDescription>Create a new collection of stocks.</DialogDescription>
        </DialogHeader>

        <div>
          <label htmlFor="new-watchlist-name" className="text-xs font-medium text-muted-foreground">
            Watchlist name
          </label>
          <Input
            id="new-watchlist-name"
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
            placeholder="My Portfolio"
            className="mt-1.5"
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!name.trim() || createList.isPending}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            {createList.isPending && <Loader2 className="size-3.5 animate-spin" />}
            {createList.isPending ? "Creating..." : "Create Watchlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
