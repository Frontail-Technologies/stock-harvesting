"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ScannerBacktestStats } from "../api/scanner-api.types";

function formatPct(value: number, signed = false) {
  const sign = signed && value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatProfitFactor(value: number | null) {
  return value === null ? "∞" : value.toFixed(2);
}

type StatRow = { label: string; value: string; tone?: "positive" | "negative" };

function StatLine({ label, value, tone }: StatRow) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[11px] whitespace-nowrap tabular-nums sm:text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          !tone && "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ScannerBacktestStatsOverlay({
  stats,
}: {
  stats: ScannerBacktestStats | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!stats) return null;

  const primaryRows: StatRow[] = [
    { label: "Hit Ratio", value: formatPct(stats.hitRatePct) },
    {
      label: "Total Return",
      value: formatPct(stats.totalReturnPct, true),
      tone: stats.totalReturnPct >= 0 ? "positive" : "negative",
    },
    { label: "Max Drawdown", value: formatPct(stats.maxDrawdownPct), tone: "negative" },
    { label: "Profit Factor", value: formatProfitFactor(stats.profitFactor) },
    { label: "Signals", value: String(stats.signalsGenerated) },
    { label: "Avg Holding", value: `${Math.round(stats.avgHoldingDays)}D` },
  ];

  const secondaryRows: StatRow[] = [
    { label: "Largest Winner", value: formatPct(stats.largestWinnerPct, true), tone: "positive" },
    { label: "Largest Loser", value: formatPct(stats.largestLoserPct, true), tone: "negative" },
  ];

  return (
    <div className="pointer-events-none absolute left-2 top-16 z-20 select-none sm:left-3 sm:top-1/2 sm:-translate-y-1/2">
      <div className="pointer-events-auto w-fit rounded-md border border-border/70 bg-popover/75 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 px-2.5 py-1.5 text-left sm:px-3"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand performance panel" : "Collapse performance panel"}
        >
          <span className="font-mono text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
            Performance
          </span>
          {collapsed ? (
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-3 shrink-0 text-muted-foreground" />
          )}
        </button>

        {!collapsed && (
          <div className="flex flex-col gap-0.5 border-t border-border/60 px-2.5 pt-1 pb-1.5 sm:px-3 sm:pb-2">
            {primaryRows.map((row) => (
              <StatLine key={row.label} {...row} />
            ))}
            <div className="my-0.5 h-px bg-border/50" />
            {secondaryRows.map((row) => (
              <StatLine key={row.label} {...row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
