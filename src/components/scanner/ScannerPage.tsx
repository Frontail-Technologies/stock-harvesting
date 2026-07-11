"use client";

import { useState } from "react";
import type { Stock } from "@/types/market";
import { findStockBySymbol } from "@/lib/mock-stocks";
import { ScannerChart } from "@/components/scanner/ScannerChart";
import { ChartToolsBar, type ToolId } from "@/components/scanner/ChartToolsBar";
import { TopToolbar } from "@/components/scanner/TopToolbar";
import type { Timeframe } from "@/components/scanner/TimeframeSelector";

const DEFAULT_STOCK: Stock =
  findStockBySymbol("INFY") ??
  ({
    symbol: "INFY",
    name: "Infosys Limited",
    exchange: "NSE",
    close: 1918.45,
    changePct: 1.31,
    volume: 4_876_200,
  } satisfies Stock);

export function ScannerPage() {
  const [selectedStock, setSelectedStock] = useState<Stock>(DEFAULT_STOCK);
  const [timeframe, setTimeframe] = useState<Timeframe>("1W");
  const [activeTool, setActiveTool] = useState<ToolId>("crosshair");
  const [measureClearSignal, setMeasureClearSignal] = useState(0);

  const handleReset = () => {
    setTimeframe("1W");
    setActiveTool("crosshair");
    setMeasureClearSignal((n) => n + 1);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <TopToolbar
        stock={selectedStock}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onReset={handleReset}
        onSelectStock={setSelectedStock}
      />

      <div className="flex h-[calc(100vh-44px)] overflow-hidden">
        <ChartToolsBar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onDelete={() => setMeasureClearSignal((n) => n + 1)}
        />

        <div className="relative min-h-0 min-w-0 flex-1">
          <ScannerChart
            stock={selectedStock}
            timeframe={timeframe}
            crosshairActive={activeTool === "crosshair"}
            measureActive={activeTool === "measure"}
            measureClearSignal={measureClearSignal}
          />
        </div>
      </div>
    </div>
  );
}
