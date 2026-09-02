import { EmptyStatePreviewCard } from "@/components/ui/empty-state";
import { cn } from "@/utils/cn";

const BARS = [
  { height: "40%", trend: "up" as const },
  { height: "70%", trend: "up" as const },
  { height: "28%", trend: "down" as const },
  { height: "55%", trend: "up" as const },
  { height: "18%", trend: "down" as const },
];

export function DashboardEmptyIllustration() {
  return (
    <EmptyStatePreviewCard label="Dashboard">
      <div className="flex h-16 items-end gap-1.5 rounded-md border border-border bg-background/60 p-2">
        {BARS.map((bar, index) => (
          <span
            key={index}
            className={cn(
              "flex-1 rounded-sm",
              bar.trend === "up" ? "bg-success/35" : "bg-danger/35",
            )}
            style={{ height: bar.height }}
          />
        ))}
      </div>
    </EmptyStatePreviewCard>
  );
}
