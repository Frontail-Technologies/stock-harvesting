"use client";

import type { Stock } from "@/types/market";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/features/theme";
import type { ScannerChartType, Timeframe } from "../types";
import { AiSummaryButton } from "./AiSummaryButton";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { StockSearchCombobox } from "./StockSearchCombobox";

type TopToolbarProps = {
  stock: Stock;
  chartType: ScannerChartType;
  timeframe: Timeframe;
  onChartTypeChange: (chartType: ScannerChartType) => void;
  onSelectStock: (stock: Stock) => void;
};

export function TopToolbar({
  stock,
  chartType,
  timeframe,
  onChartTypeChange,
  onSelectStock,
}: TopToolbarProps) {
  return (
    <div className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-2 py-1 sm:flex-nowrap">
      <div className="flex min-w-0 items-center gap-1.5">
        <ChartTypeSelector value={chartType} onChange={onChartTypeChange} />

        <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

        <AiSummaryButton stock={stock} timeframe={timeframe} />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
        <ThemeToggle />
        <StockSearchCombobox
          selectedStock={stock}
          onSelectStock={onSelectStock}
        />
      </div>
    </div>
  );
}
