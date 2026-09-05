import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import type { StockFundamentals } from "../types";

type StockKeyMetricsProps = {
  fundamentals: StockFundamentals;
  currency: string;
};

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
      <h2 className="text-lg font-semibold text-foreground">Key stats</h2>

      {/* Desktop/tablet: one horizontal strip. */}
      <div className="mt-3 hidden overflow-x-auto border-t border-border sm:block">
        <div className="flex min-w-max divide-x divide-border">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex shrink-0 flex-col gap-1 px-4 py-3">
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                {metric.label}
              </span>
              <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: compact vertical label/value list. */}
      <div className="mt-3 flex flex-col divide-y divide-border border-t border-border sm:hidden">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">{metric.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
