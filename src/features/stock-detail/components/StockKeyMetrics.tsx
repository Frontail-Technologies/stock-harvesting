import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import type { StockFundamentals } from "../types";
import { StockSectionCard } from "./StockSectionCard";

type StockKeyMetricsProps = {
  fundamentals: StockFundamentals;
  currency: string;
};

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 first:pl-0 last:pr-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function StockKeyMetrics({ fundamentals, currency }: StockKeyMetricsProps) {
  const metrics: Array<{ label: string; value: string }> = [
    { label: "Market Cap", value: `${formatCurrencyValue(fundamentals.marketCapCr, currency)} Cr` },
    { label: "P/E Ratio", value: fundamentals.peRatio.toFixed(1) },
    { label: "P/B Ratio", value: fundamentals.pbRatio.toFixed(1) },
    { label: "ROCE", value: `${fundamentals.roce.toFixed(1)}%` },
    { label: "ROE", value: `${fundamentals.roe.toFixed(1)}%` },
    { label: "Dividend Yield", value: `${fundamentals.dividendYieldPct.toFixed(2)}%` },
    { label: "Book Value", value: formatCurrencyValue(fundamentals.bookValue, currency) },
    { label: "Face Value", value: formatCurrencyValue(fundamentals.faceValue, currency) },
    { label: "EPS (TTM)", value: formatCurrencyValue(fundamentals.eps, currency) },
  ];

  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">Key stats</h2>
      <StockSectionCard className="mt-3 p-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 sm:divide-y-0">
          {metrics.map((metric) => (
            <MetricCell key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </StockSectionCard>
    </section>
  );
}
