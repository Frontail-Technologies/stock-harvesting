"use client";

// Mirrors WatchlistStockRow's exact row size/spacing so the loading state
// occupies the same footprint as real rows - the card's height is already
// fixed (min-h-104/max-h-112 on the root), so this is about avoiding a
// content "pop" inside that fixed area, not fixing a height jump.
const ROW_WIDTHS = [64, 44, 56, 36, 48];

export function WatchlistWidgetSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden pr-0.5">
      {ROW_WIDTHS.map((width, index) => (
        <div key={index} className="flex w-full shrink-0 items-center rounded-sm px-2 py-1.5">
          <div className="h-3.5 animate-pulse rounded-sm bg-muted" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}
