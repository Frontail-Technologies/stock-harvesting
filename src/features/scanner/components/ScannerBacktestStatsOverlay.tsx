import {
  CheckCircle2,
  Hourglass,
  Scale,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ScannerBacktestStats } from "../api/scanner-api.types";

function formatPct(value: number, signed = false) {
  const sign = signed && value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatProfitFactor(value: number | null) {
  return value === null ? "∞" : value.toFixed(2);
}

export function ScannerBacktestStatsOverlay({
  stats,
}: {
  stats: ScannerBacktestStats | null;
}) {
  if (!stats) return null;

  const rows: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
    tone?: "positive" | "negative";
  }> = [
    { icon: CheckCircle2, label: "Hit Ratio", value: formatPct(stats.hitRatePct) },
    {
      icon: TrendingUp,
      label: "Total Return",
      value: formatPct(stats.totalReturnPct, true),
      tone: stats.totalReturnPct >= 0 ? "positive" : "negative",
    },
    {
      icon: TrendingDown,
      label: "Max Drawdown",
      value: formatPct(stats.maxDrawdownPct),
      tone: "negative",
    },
    { icon: Scale, label: "Profit Factor", value: formatProfitFactor(stats.profitFactor) },
    { icon: Target, label: "Signals Generated", value: String(stats.signalsGenerated) },
    { icon: Hourglass, label: "Avg Holding", value: `${Math.round(stats.avgHoldingDays)} Days` },
    {
      icon: Trophy,
      label: "Largest Winner",
      value: formatPct(stats.largestWinnerPct, true),
      tone: "positive",
    },
    {
      icon: ShieldAlert,
      label: "Largest Loser",
      value: formatPct(stats.largestLoserPct, true),
      tone: "negative",
    },
  ];
  const compactRows = [
    { label: "HR", value: formatPct(stats.hitRatePct) },
    {
      label: "Ret",
      value: formatPct(stats.totalReturnPct, true),
      tone: stats.totalReturnPct >= 0 ? "positive" : "negative",
    },
    { label: "DD", value: formatPct(stats.maxDrawdownPct), tone: "negative" },
    { label: "PF", value: formatProfitFactor(stats.profitFactor) },
    { label: "Sig", value: String(stats.signalsGenerated) },
  ] satisfies Array<{
    label: string;
    value: string;
    tone?: "positive" | "negative";
  }>;

  return (
    <div className="pointer-events-none absolute left-2 top-16 z-20 select-none sm:left-3 sm:top-1/2 sm:-translate-y-1/2">
      <div className="pointer-events-auto grid grid-cols-2 gap-x-2 gap-y-0.5 rounded-md border border-border bg-popover/90 px-2 py-1.5 text-[0.625rem] text-popover-foreground shadow-lg backdrop-blur-sm sm:hidden">
        {compactRows.map((row) => (
          <div key={row.label} className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-muted-foreground">{row.label}</span>
            <span
              className={
                row.tone === "positive"
                  ? "font-semibold text-success"
                  : row.tone === "negative"
                    ? "font-semibold text-danger"
                    : "font-semibold text-foreground"
              }
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-auto hidden flex-col gap-1.5 rounded-lg border border-border bg-popover/90 px-3 py-2.5 text-popover-foreground shadow-lg backdrop-blur-sm sm:flex">
        {rows.map((row) => {
          const Icon = row.icon;
          const iconClass =
            row.tone === "positive"
              ? "text-success"
              : row.tone === "negative"
                ? "text-danger"
                : "text-muted-foreground";

          return (
            <div key={row.label} className="flex items-center gap-2 text-xs whitespace-nowrap">
              <Icon className={`size-3.5 shrink-0 ${iconClass}`} />
              <span className="text-muted-foreground">{row.label}:</span>
              <span
                className={
                  row.tone === "positive"
                    ? "font-semibold text-success"
                    : row.tone === "negative"
                      ? "font-semibold text-danger"
                      : "font-semibold text-foreground"
                }
              >
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
