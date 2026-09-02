import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import { cn } from "@/utils/cn";
import type { StockFinancialPeriod } from "../types";
import { StockSectionCard } from "./StockSectionCard";

type StockLatestEarningsProps = {
  quarterly: StockFinancialPeriod[];
  currency: string;
};

function pctChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function StockLatestEarnings({ quarterly, currency }: StockLatestEarningsProps) {
  const latest = quarterly[quarterly.length - 1];
  const previous = quarterly[quarterly.length - 2];
  if (!latest) return null;

  const revenueChange = previous ? pctChange(latest.totalIncomeCr, previous.totalIncomeCr) : null;
  const patChange = previous ? pctChange(latest.patCr, previous.patCr) : null;

  const stats: Array<{ label: string; value: string; changePct: number | null }> = [
    {
      label: "Revenue",
      value: `${formatCurrencyValue(latest.totalIncomeCr, currency)} Cr`,
      changePct: revenueChange,
    },
    {
      label: "Net income",
      value: `${formatCurrencyValue(latest.patCr, currency)} Cr`,
      changePct: patChange,
    },
    {
      label: "EPS",
      value: formatCurrencyValue(latest.epsValue, currency),
      changePct: null,
    },
    {
      label: "Net margin",
      value: `${latest.netProfitMarginPct}%`,
      changePct: null,
    },
  ];

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Latest earnings</h2>
        <span className="text-xs text-muted-foreground">{latest.label}</span>
      </div>
      <StockSectionCard className="mt-3 p-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 px-4 py-3">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <span className="text-base font-semibold tabular-nums text-foreground">{stat.value}</span>
              {stat.changePct !== null && (
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    stat.changePct >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {stat.changePct >= 0 ? "+" : ""}
                  {stat.changePct.toFixed(1)}% QoQ
                </span>
              )}
            </div>
          ))}
        </div>
      </StockSectionCard>
    </section>
  );
}
