"use client";

import { WatchlistWidgetSkeleton } from "./WatchlistWidgetSkeleton";

// Full card-shaped placeholder (shell + header + rows) for the PAGE-level
// loading state, before we even know how many Watchlists exist - distinct
// from WatchlistWidgetSkeleton, which is just the row placeholders shown
// inside an already-rendered card while its own detail query loads.
export function WatchlistCardSkeleton() {
  return (
    <div className="flex h-full min-h-104 max-h-112 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
        <div className="flex items-center gap-1">
          <div className="size-6 animate-pulse rounded bg-muted" />
          <div className="size-6 animate-pulse rounded bg-muted" />
          <div className="size-6 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-1.5 h-2.5 w-16 animate-pulse rounded-full bg-muted" />

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <WatchlistWidgetSkeleton />
      </div>
    </div>
  );
}
