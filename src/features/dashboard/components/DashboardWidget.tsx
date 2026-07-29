import { Info } from "lucide-react";
import { useCurrency } from "@/features/currency";
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
  const { formatStockCurrency } = useCurrency();
  const maxAbsValue = Math.max(
    ...card.items.map((item) => Math.abs(item.value)),
    1
  );

  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-border bg-card px-3 py-3 text-card-foreground shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-[0.8125rem] font-semibold text-foreground">
          {card.title}
        </h3>
        <Info className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{card.timestamp}</p>

      <div className="mt-2.5 flex max-h-128 flex-col overflow-x-hidden overflow-y-auto">
        {card.items.length === 0 ? (
          <div className="py-3 text-[0.6875rem] text-muted-foreground">
            No additional movers to show right now
          </div>
        ) : null}
        {card.items.map((item) => {
          const isPositive = item.value >= 0;
          const halfWidthPct = Math.max(
            (Math.abs(item.value) / maxAbsValue) * 50,
            6
          );
          const valueClass = isPositive ? "text-success" : "text-danger";
          const displayValue =
            item.metric === "price"
              ? formatStockCurrency(item.value, item.exchange)
              : formatValue(item.value);

          return (
            <div key={item.rank} className="flex items-center gap-2 py-0.5">
              <span
                className={`w-14 shrink-0 text-right text-[0.6875rem] font-medium tabular-nums ${valueClass}`}
              >
                {displayValue}
              </span>

              <div className="relative h-5 min-w-0 flex-1">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
                <div
                  className={`absolute inset-y-0 flex items-center rounded-sm px-1.5 ${
                    isPositive ? "justify-start" : "justify-end"
                  }`}
                  style={{
                    backgroundColor: COLOR_MAP[item.color],
                    width: `${halfWidthPct}%`,
                    left: isPositive ? "50%" : `${50 - halfWidthPct}%`,
                  }}
                >
                  <span className="whitespace-nowrap text-[0.6875rem] font-medium text-black dark:text-white">
                    {item.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
