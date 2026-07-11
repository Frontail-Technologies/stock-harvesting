"use client";

import { useState } from "react";
import { ChevronDown, TrendingUp, X } from "lucide-react";
import type { TradeLevels } from "@/lib/scanners/near-250-week-high";
import { formatCurrency } from "@/lib/formatters";

type TradeLevelsPanelProps = {
  tradeLevels: TradeLevels;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

// Collapsed by default: a small chip button that expands into a popover
// below it, so it never sits on top of the chart's scan-zone labels unless
// the user deliberately opens it. z-50 keeps it above every chart overlay
// (bands z-10, measurement boxes z-20, signal label z-30) when open.
export function TradeLevelsPanel({ tradeLevels }: TradeLevelsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const riskReward =
    tradeLevels.riskRewardToTarget1 === null
      ? "—"
      : `1 : ${tradeLevels.riskRewardToTarget1.toFixed(2)}`;

  return (
    <div className="absolute right-3 top-2 z-50 select-none">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-border bg-white/95 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm hover:bg-white"
      >
        <TrendingUp className="size-3.5 text-primary" />
        Trade Levels
        <ChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="pointer-events-auto absolute right-0 top-full mt-1 w-44 rounded-md border border-border bg-white px-2.5 py-2 text-[11px] leading-snug shadow-lg">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-foreground">Trade Levels</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close trade levels"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <Row label="Entry" value={formatCurrency(tradeLevels.entry)} />
            <Row label="Stop Loss" value={formatCurrency(tradeLevels.stopLoss)} />
            <Row label="Target 1" value={formatCurrency(tradeLevels.target1)} />
            <Row label="Target 2" value={formatCurrency(tradeLevels.target2)} />
            <Row label="Risk : Reward" value={riskReward} />
          </div>
        </div>
      )}
    </div>
  );
}
