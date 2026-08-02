"use client";

import { useMemo } from "react";
import { useCurrency } from "@/features/currency";
import type { Candle, ScanBand, Stock } from "@/types/market";
import { useLightweightCandlestickChart } from "../hooks/use-lightweight-candlestick-chart";
import { useScannerBacktest } from "../hooks/use-scanner-data";
import { buildBacktestStatsFromCandles } from "../lib/build-backtest-stats-from-candles";
import { buildScannerChartData } from "../lib/build-scanner-chart-data";
import { isCursorTool } from "../tools/cursor-tool-config";
import type {
  ChartCaptureRequest,
  DrawingController,
  ScannerRangeFilter,
  ScannerChartType,
  ScannerLookbackMultiplier,
  ScannerTheme,
  Timeframe,
} from "../types";
import { ScannerChartStage } from "./ScannerChartStage";

type ScannerChartProps = {
  stock: Stock;
  candles: Candle[];
  baseScanBands: ScanBand[];
  loading: boolean;
  chartType: ScannerChartType;
  rangeFilter: ScannerRangeFilter;
  theme: ScannerTheme;
  timeframe: Timeframe;
  lookbackMultiplier: ScannerLookbackMultiplier;
  crosshairActive: boolean;
  captureRequest: ChartCaptureRequest | null;
  drawing: DrawingController;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
};

export function ScannerChart({
  stock,
  candles,
  baseScanBands,
  loading,
  chartType,
  rangeFilter,
  theme,
  timeframe,
  lookbackMultiplier,
  crosshairActive,
  captureRequest,
  drawing,
  autoScale,
  percentageScale,
  showBacktestStats,
}: ScannerChartProps) {
  const { formatStockCurrency } = useCurrency();
  const chartData = useMemo(
    () => buildScannerChartData(candles, rangeFilter, theme),
    [candles, rangeFilter, theme]
  );
  const priceFormatter = useMemo(
    () => (price: number) => formatStockCurrency(price, stock.exchange),
    [formatStockCurrency, stock.exchange]
  );
  const candleTimes = useMemo(
    () => candles.map((candle) => candle.time),
    [candles]
  );
  const fallbackBacktestStats = useMemo(
    () =>
      timeframe === "1W"
        ? buildBacktestStatsFromCandles(candles, lookbackMultiplier)
        : null,
    [candles, lookbackMultiplier, timeframe]
  );
  const effectiveCrosshairActive = crosshairActive && isCursorTool(drawing.activeTool);
  const { stats: backtestStats } = useScannerBacktest(
    stock.symbol,
    timeframe === "1W",
    stock.exchange,
    lookbackMultiplier
  );
  const visibleBacktestStats = backtestStats ?? fallbackBacktestStats;
  // Include whether real candle data has arrived yet: on first mount candles
  // are still empty (query in flight), so the chart renders a trivial
  // placeholder range. Once real candles land, the identity portion below
  // hasn't changed (same symbol/timeframe/range-filter) — without this flag
  // that transition would be treated as a no-op "live update" and the
  // correct range would never get applied, leaving the chart on whatever
  // the library defaults to (looks like a fully-zoomed-out "ALL" view).
  const viewResetKey = `${stock.exchange}:${stock.symbol}:${timeframe}:${rangeFilter}:${
    candles.length > 0 ? "loaded" : "empty"
  }`;
  const { containerRef, chartHandles } = useLightweightCandlestickChart({
    data: chartData,
    chartType,
    crosshairActive: effectiveCrosshairActive,
    priceFormatter,
    theme,
    autoScale,
    percentageScale,
    viewResetKey,
  });

  return (
    <ScannerChartStage
      containerRef={containerRef}
      chartHandles={chartHandles}
      stock={stock}
      timeframe={timeframe}
      candles={candles}
      candleTimes={candleTimes}
      scanBands={baseScanBands}
      loading={loading}
      captureRequest={captureRequest}
      drawing={drawing}
      theme={theme}
      backtestStats={showBacktestStats ? visibleBacktestStats : null}
    />
  );
}
