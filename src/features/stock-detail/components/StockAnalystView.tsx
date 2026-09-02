import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import { cn } from "@/utils/cn";
import type { StockAnalystSummary } from "../types";
import { StockSectionCard } from "./StockSectionCard";

type StockAnalystViewProps = {
  analystSummary: StockAnalystSummary;
  currency: string;
};

export function StockAnalystView({ analystSummary, currency }: StockAnalystViewProps) {
  const { distribution } = analystSummary;
  const total = distribution.buy + distribution.hold + distribution.sell || 1;
  const gaugePct = (analystSummary.scoreOutOf5 / 5) * 100;

  const bars: Array<{ label: string; value: number; className: string }> = [
    { label: "Buy", value: distribution.buy, className: "bg-success" },
    { label: "Hold", value: distribution.hold, className: "bg-muted-foreground/50" },
    { label: "Sell", value: distribution.sell, className: "bg-danger" },
  ];

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">Analyst / Market View</h2>

      <StockSectionCard className="mt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-primary">{analystSummary.rating}</span>
          <span className="text-xs text-muted-foreground">
            {analystSummary.scoreOutOf5.toFixed(1)}/5 &middot; {analystSummary.analystCount} analysts
          </span>
        </div>
        <div className="flex items-baseline gap-4 text-sm">
          <span className="text-muted-foreground">
            Mean target{" "}
            <span className="font-semibold text-foreground">
              {formatCurrencyValue(analystSummary.meanTargetPrice, currency)}
            </span>
          </span>
          <span
            className={cn(
              "font-semibold",
              analystSummary.impliedUpsidePct >= 0 ? "text-success" : "text-danger",
            )}
          >
            {analystSummary.impliedUpsidePct >= 0 ? "+" : ""}
            {analystSummary.impliedUpsidePct.toFixed(1)}% upside
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <div className="relative h-1.5 rounded-full bg-gradient-to-r from-danger/40 via-muted-foreground/30 to-success/50">
          <span
            className="absolute top-1/2 size-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-background bg-primary"
            style={{ left: `${gaugePct}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="flex items-center justify-between text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Sell</span>
          <span>Hold</span>
          <span>Buy</span>
        </div>
      </div>

      <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-muted">
        {bars.map((bar) => (
          <span
            key={bar.label}
            className={bar.className}
            style={{ width: `${(bar.value / total) * 100}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
        {bars.map((bar) => (
          <span key={bar.label}>
            {bar.label} {bar.value}%
          </span>
        ))}
      </div>
      </StockSectionCard>
    </section>
  );
}
