"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import type { ScannerBacktestStats } from "../api/scanner-api.types";

function formatPct(value: number, signed = false) {
  const sign = signed && value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatProfitFactor(value: number | null) {
  return value === null ? "inf" : value.toFixed(2);
}

type StatRow = { label: string; value: string; tone?: "positive" | "negative" };

function getStatsRows(stats: ScannerBacktestStats) {
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

  return { primaryRows, secondaryRows };
}

function StatLine({ label, value, tone }: StatRow) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[10.5px] whitespace-nowrap tabular-nums">
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

export function ScannerBacktestStatsContent({
  stats,
  className,
}: {
  stats: ScannerBacktestStats | null;
  className?: string;
}) {
  if (!stats) {
    return <p className="text-sm text-muted-foreground">No performance data available.</p>;
  }

  const { primaryRows, secondaryRows } = getStatsRows(stats);

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {primaryRows.map((row) => (
        <StatLine key={row.label} {...row} />
      ))}
      <div className="my-0.5 h-px bg-border/60" />
      {secondaryRows.map((row) => (
        <StatLine key={row.label} {...row} />
      ))}
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

  return (
    <div className="pointer-events-none absolute left-2 top-16 z-20 hidden select-none sm:left-3 sm:top-1/2 sm:block sm:-translate-y-1/2">
      <div className="pointer-events-auto w-42 rounded-md border border-border/60 bg-popover/55 backdrop-blur-sm">
        <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 px-2 py-1 text-left"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand performance panel" : "Collapse performance panel"}
          >
            <span className="font-mono text-[0.5625rem] font-semibold tracking-widest text-muted-foreground uppercase">
              Performance
            </span>
            {collapsed ? (
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronUp className="size-3 shrink-0 text-muted-foreground" />
            )}
          </TooltipTrigger>
          <TooltipContent side="top" className="scanner-portal">
            {collapsed ? "Expand performance panel" : "Collapse performance panel"}
          </TooltipContent>
        </Tooltip>

        {!collapsed && (
          <ScannerBacktestStatsContent
            stats={stats}
            className="border-t border-border/50 px-2 pt-1 pb-1.5"
          />
        )}
      </div>
    </div>
  );
}
