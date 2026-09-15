import { EmptyStatePreviewCard } from "@/components/ui/empty-state";
import { cn } from "@/utils/cn";

const TILES = [
  { trend: "up" as const },
  { trend: "down" as const },
  { trend: "up" as const },
  { trend: "up" as const },
];

export function WidgetEmptyIllustration() {
  return (
    <EmptyStatePreviewCard label="Widget">
      <div className="grid grid-cols-2 gap-1.5">
        {TILES.map((tile, index) => (
          <div
            key={index}
            className="flex h-7 items-center justify-center rounded-md border border-border bg-background/60"
          >
            <span
              className={cn(
                "h-1.5 w-8 rounded-full",
                tile.trend === "up" ? "bg-success/35" : "bg-danger/35",
              )}
            />
          </div>
        ))}
      </div>
    </EmptyStatePreviewCard>
  );
}
