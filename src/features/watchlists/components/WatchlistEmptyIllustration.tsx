import { EmptyStatePreviewCard } from "@/components/ui/empty-state";
import { cn } from "@/utils/cn";

const PREVIEW_ROWS = [
  { width: "68%", trend: "up" as const },
  { width: "44%", trend: "down" as const },
  { width: "80%", trend: "up" as const },
  { width: "52%", trend: "down" as const },
];

export function WatchlistEmptyIllustration() {
  return (
    <EmptyStatePreviewCard
      label="Watchlist"
      badge={
        <span className="flex size-5 items-center justify-center rounded-full bg-muted font-mono text-[0.625rem] font-semibold text-muted-foreground">
          {PREVIEW_ROWS.length}
        </span>
      }
    >
      {PREVIEW_ROWS.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="h-2 flex-1 rounded-full bg-muted" style={{ maxWidth: row.width }} />
          <span
            className={cn(
              "h-2 w-6 shrink-0 rounded-full",
              row.trend === "up" ? "bg-success/35" : "bg-danger/35",
            )}
          />
        </div>
      ))}
    </EmptyStatePreviewCard>
  );
}
