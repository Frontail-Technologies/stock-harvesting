"use client";

import { useMemo } from "react";
import { useCurrency } from "@/features/currency";
import type { Candle, ScanBand, Stock } from "@/types/market";
import type { ScannerBacktestStats } from "../api/scanner-api.types";
import { useLightweightCandlestickChart } from "../hooks/use-lightweight-candlestick-chart";
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
  backtestStats: ScannerBacktestStats | null;
  scannerHighlightsVisible: boolean;
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
  crosshairActive,
  captureRequest,
  drawing,
  autoScale,
  percentageScale,
  showBacktestStats,
  backtestStats,
  scannerHighlightsVisible,
}: ScannerChartProps) {
  const { formatStockCurrency } = useCurrency();
  const chartData = useMemo(
    () => buildScannerChartData(candles, rangeFilter, theme, timeframe),
    [candles, rangeFilter, theme, timeframe]
  );
  const priceFormatter = useMemo(
    () => (price: number) => formatStockCurrency(price, stock.exchange),
    [formatStockCurrency, stock.exchange]
  );
  const candleTimes = useMemo(
    () => candles.map((candle) => candle.time),
    [candles]
  );
  const effectiveCrosshairActive = crosshairActive && isCursorTool(drawing.activeTool);
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
      backtestStats={showBacktestStats ? backtestStats : null}
      scannerHighlightsVisible={scannerHighlightsVisible}
    />
  );
}
