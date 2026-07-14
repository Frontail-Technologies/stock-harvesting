"use client";

import { useState } from "react";
import type { Stock } from "@/types/market";
import { useTheme } from "@/features/theme";
import { mockStocks } from "@/mocks/market/stocks";
import { cn } from "@/utils/cn";
import { findStockBySymbol } from "@/utils/stock-search";
import { useScannerDrawingState } from "../hooks/use-scanner-drawing-state";
import { getScannerThemeClass } from "../lib/scanner-chart-config";
import type {
  ChartCaptureMode,
  ChartCaptureRequest,
  ScannerRangeFilter,
  ScannerChartType,
  ScannerTheme,
  Timeframe,
} from "../types";
import { ChartToolsBar } from "./ChartToolsBar";
import { RangeFilterTabs } from "./RangeFilterTabs";
import { ScannerChart } from "./ScannerChart";
import { TopToolbar } from "./TopToolbar";

const DEFAULT_STOCK: Stock =
  findStockBySymbol(mockStocks, "INFY") ??
  ({
    symbol: "INFY",
    name: "Infosys Limited",
    exchange: "NSE",
    close: 1918.45,
    changePct: 1.31,
    volume: 4_876_200,
  } satisfies Stock);

export function ScannerPage() {
  const { theme } = useTheme();
  const [selectedStock, setSelectedStock] = useState<Stock>(DEFAULT_STOCK);
  const [chartType, setChartType] = useState<ScannerChartType>("candlestick");
  const [rangeFilter, setRangeFilter] = useState<ScannerRangeFilter>("ALL");
  const timeframe: Timeframe = "1W";
  const [captureRequest, setCaptureRequest] = useState<ChartCaptureRequest | null>(null);

  const requestCapture = (mode: ChartCaptureMode) => {
    setCaptureRequest({ id: Date.now(), mode });
  };

  return (
    <div
      className={cn(
        getScannerThemeClass(theme),
        "flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-foreground"
      )}
    >
      <TopToolbar
        stock={selectedStock}
        chartType={chartType}
        timeframe={timeframe}
        onChartTypeChange={setChartType}
        onSelectStock={setSelectedStock}
      />

      <ScannerDrawingWorkspace
        key={`${selectedStock.symbol}:${timeframe}`}
        stock={selectedStock}
        chartType={chartType}
        rangeFilter={rangeFilter}
        theme={theme}
        timeframe={timeframe}
        captureRequest={captureRequest}
        onRangeFilterChange={setRangeFilter}
        onScreenshot={() => requestCapture("download")}
        onSend={() => requestCapture("share")}
      />
    </div>
  );
}

type ScannerDrawingWorkspaceProps = {
  stock: Stock;
  chartType: ScannerChartType;
  rangeFilter: ScannerRangeFilter;
  theme: ScannerTheme;
  timeframe: Timeframe;
  captureRequest: ChartCaptureRequest | null;
  onRangeFilterChange: (rangeFilter: ScannerRangeFilter) => void;
  onScreenshot: () => void;
  onSend: () => void;
};

function ScannerDrawingWorkspace({
  stock,
  chartType,
  rangeFilter,
  theme,
  timeframe,
  captureRequest,
  onRangeFilterChange,
  onScreenshot,
  onSend,
}: ScannerDrawingWorkspaceProps) {
  const drawing = useScannerDrawingState(stock.symbol, timeframe);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:flex-row">
      <ChartToolsBar
        drawing={drawing}
        onScreenshot={onScreenshot}
        onSend={onSend}
      />

      <div className="relative order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:order-none">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <ScannerChart
            stock={stock}
            chartType={chartType}
            rangeFilter={rangeFilter}
            theme={theme}
            timeframe={timeframe}
            crosshairActive={drawing.crosshairActive}
            captureRequest={captureRequest}
            drawing={drawing}
          />
        </div>
        <RangeFilterTabs value={rangeFilter} onChange={onRangeFilterChange} />
      </div>
    </div>
  );
}
