import { Info } from "lucide-react";
import type { DashboardCardData, DashboardItemColor } from "@/types/dashboard";

const COLOR_MAP: Record<DashboardItemColor, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  purple: "#A855F7",
  orange: "#F97316",
  red: "#EF4444",
  teal: "#14B8A6",
};

function formatValue(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

export function DashboardWidget({ card }: { card: DashboardCardData }) {
  const maxAbsValue = Math.max(...card.items.map((item) => Math.abs(item.value)));

  return (
    <div className="min-w-0 flex-1 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-[0.8125rem] font-semibold text-foreground">
          {card.title}
        </h3>
        <Info className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{card.timestamp}</p>

      <div className="mt-2.5 flex flex-col">
        {card.items.map((item) => {
          const isPositive = item.value >= 0;
          const halfWidthPct = Math.max(
            (Math.abs(item.value) / maxAbsValue) * 50,
            6
          );
          const valueClass = isPositive ? "text-success" : "text-danger";

          return (
            <div key={item.rank} className="flex items-center gap-2 py-0.5">
              <span className="w-22 shrink-0 truncate text-[0.6875rem] text-foreground">
                {item.label}
              </span>

              <div className="relative h-5 min-w-0 flex-1">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
                <div
                  className="absolute inset-y-0 rounded-sm"
                  style={{
                    backgroundColor: COLOR_MAP[item.color],
                    width: `${halfWidthPct}%`,
                    left: isPositive ? "50%" : `${50 - halfWidthPct}%`,
                  }}
                />
              </div>

              <span
                className={`w-12 shrink-0 text-right text-[0.6875rem] font-medium tabular-nums ${valueClass}`}
              >
                {formatValue(item.value)}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-2.5 text-[0.6875rem] font-medium text-primary hover:underline"
      >
        View all
      </button>
    </div>
  );
}
