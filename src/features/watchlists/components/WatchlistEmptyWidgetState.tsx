"use client";

import { ListX, Plus } from "lucide-react";

export function WatchlistEmptyWidgetState({ onAddStock }: { onAddStock: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
      <ListX className="size-5 text-muted-foreground/60" />
      <p className="text-xs font-medium text-muted-foreground">No stocks yet</p>
      <button
        type="button"
        onClick={onAddStock}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="size-3.5" />
        Add Stock
      </button>
    </div>
  );
}
