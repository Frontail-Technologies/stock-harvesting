"use client";

import {
  Bell,
  CandlestickChart,
  LayoutTemplate,
  RotateCcw,
  SlidersHorizontal,
  User,
} from "lucide-react";
import type { Stock } from "@/types/market";
import { TimeframeSelector, type Timeframe } from "@/components/scanner/TimeframeSelector";
import { SearchStocksInput } from "@/components/scanner/SearchStocksInput";
import { AiSummaryDialog } from "@/components/scanner/AiSummaryDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TopToolbarProps = {
  stock: Stock;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onReset: () => void;
  onSelectStock: (stock: Stock) => void;
};

export function TopToolbar({
  stock,
  timeframe,
  onTimeframeChange,
  onReset,
  onSelectStock,
}: TopToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-2">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="gap-1.5">
          <CandlestickChart className="size-3.5" />
          Candlestick
        </Button>

        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Indicators
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <LayoutTemplate className="size-3.5" />
          Templates
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Bell className="size-3.5" />
          Alerts
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="gap-1.5 text-muted-foreground"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <AiSummaryDialog stock={stock} timeframe={timeframe} />
      </div>

      <div className="flex items-center gap-2">
        <SearchStocksInput onSelectStock={onSelectStock} />
        <button
          type="button"
          title="Account"
          className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <User className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
