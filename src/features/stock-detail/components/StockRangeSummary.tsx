import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import { cn } from "@/utils/cn";
import type { StockPriceRange } from "../lib/stock-detail-range";

type StockRangeSummaryProps = {
  dayRange: StockPriceRange | null;
  fiftyTwoWeekRange: StockPriceRange | null;
  currency: string;
};

function RangeBar({
  label,
  range,
  currency,
}: {
  label: string;
  range: StockPriceRange;
  currency: string;
}) {
  const span = range.high - range.low || 1;
  const positionPct = Math.min(100, Math.max(0, ((range.current - range.low) / span) * 100));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatCurrencyValue(range.low, currency)}
      </span>
      <div className="relative h-px min-w-0 flex-1 bg-border">
        <span
          className="absolute top-1/2 size-2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary"
          style={{ left: `${positionPct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatCurrencyValue(range.high, currency)}
      </span>
    </div>
  );
}

export function StockRangeSummary({
  dayRange,
  fiftyTwoWeekRange,
  currency,
}: StockRangeSummaryProps) {
  if (!dayRange && !fiftyTwoWeekRange) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:gap-8",
      )}
    >
      {dayRange && <RangeBar label="Day's Range" range={dayRange} currency={currency} />}
      {fiftyTwoWeekRange && (
        <RangeBar label="52 Week Range" range={fiftyTwoWeekRange} currency={currency} />
      )}
    </div>
  );
}
