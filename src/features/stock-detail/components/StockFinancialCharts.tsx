import { cn } from "@/utils/cn";
import type {
  StockBalanceSheetPeriod,
  StockCashFlowPeriod,
  StockFinancialPeriod,
} from "../types";

type MiniChartProps = {
  title: string;
  children: React.ReactNode;
};

function MiniChart({ title, children }: MiniChartProps) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="mt-3 flex h-28 items-end gap-2">{children}</div>
    </div>
  );
}

function RevenueNetIncomeChart({ periods }: { periods: StockFinancialPeriod[] }) {
  const max = Math.max(...periods.map((period) => period.totalIncomeCr), 1);

  return (
    <MiniChart title="Revenue vs net income">
      {periods.map((period) => (
        <div key={period.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex h-24 w-full items-end justify-center gap-1">
            <span
              className="w-2.5 rounded-t-sm bg-primary/70"
              style={{ height: `${(period.totalIncomeCr / max) * 100}%` }}
              aria-hidden="true"
            />
            <span
              className="w-2.5 rounded-t-sm bg-foreground/25"
              style={{ height: `${(period.patCr / max) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[0.625rem] text-muted-foreground">{period.label}</span>
        </div>
      ))}
    </MiniChart>
  );
}

function ProfitabilityChart({ periods }: { periods: StockFinancialPeriod[] }) {
  const values = periods.map((period) => period.ebitdaMarginPct);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = periods.length > 1 ? (index / (periods.length - 1)) * 100 : 0;
    const y = 100 - ((value - min) / span) * 100;
    return `${x},${y}`;
  });

  return (
    <MiniChart title="Profitability (EBITDA margin)">
      <div className="relative h-24 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full text-primary">
          <polyline points={points.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-1 flex justify-between text-[0.625rem] text-muted-foreground">
          {periods.map((period) => (
            <span key={period.label}>{period.label}</span>
          ))}
        </div>
      </div>
    </MiniChart>
  );
}

function CashFlowChart({ periods }: { periods: StockCashFlowPeriod[] }) {
  const max = Math.max(...periods.map((period) => Math.abs(period.operatingCr)), 1);

  return (
    <MiniChart title="Operating cash flow">
      {periods.map((period) => (
        <div key={period.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex h-24 w-full items-end justify-center">
            <span
              className={cn(
                "w-3.5 rounded-t-sm",
                period.operatingCr >= 0 ? "bg-success/60" : "bg-danger/60",
              )}
              style={{ height: `${(Math.abs(period.operatingCr) / max) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[0.625rem] text-muted-foreground">{period.label}</span>
        </div>
      ))}
    </MiniChart>
  );
}

function BalanceSheetChart({ periods }: { periods: StockBalanceSheetPeriod[] }) {
  const max = Math.max(...periods.map((period) => period.totalAssetsCr), 1);

  return (
    <MiniChart title="Assets vs liabilities">
      {periods.map((period) => (
        <div key={period.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <div className="flex h-24 w-full items-end justify-center gap-1">
            <span
              className="w-2.5 rounded-t-sm bg-primary/70"
              style={{ height: `${(period.totalAssetsCr / max) * 100}%` }}
              aria-hidden="true"
            />
            <span
              className="w-2.5 rounded-t-sm bg-foreground/25"
              style={{ height: `${(period.totalLiabilitiesCr / max) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-[0.625rem] text-muted-foreground">{period.label}</span>
        </div>
      ))}
    </MiniChart>
  );
}

type StockFinancialChartsProps = {
  profitLoss: StockFinancialPeriod[];
  cashFlow: StockCashFlowPeriod[];
  balanceSheet: StockBalanceSheetPeriod[];
};

export function StockFinancialCharts({ profitLoss, cashFlow, balanceSheet }: StockFinancialChartsProps) {
  return (
    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2">
      <RevenueNetIncomeChart periods={profitLoss} />
      <ProfitabilityChart periods={profitLoss} />
      <CashFlowChart periods={cashFlow} />
      <BalanceSheetChart periods={balanceSheet} />
    </div>
  );
}
