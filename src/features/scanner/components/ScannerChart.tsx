"use client";

import { useMemo } from "react";
import type { Stock } from "@/types/market";
import { mockScanBands, mockWeeklyCandles } from "@/mocks/market/candles";
import { useLightweightCandlestickChart } from "../hooks/use-lightweight-candlestick-chart";
import { useNearHighScanOverlayData } from "../hooks/use-near-high-scan-overlay-data";
import { buildScannerChartData } from "../lib/build-scanner-chart-data";
import type {
  ChartCaptureRequest,
  DrawingController,
  ScannerRangeFilter,
  ScannerChartType,
  ScannerTheme,
  Timeframe,
} from "../types";
import { ScannerChartStage } from "./ScannerChartStage";

type ScannerChartProps = {
  stock: Stock;
  chartType: ScannerChartType;
  rangeFilter: ScannerRangeFilter;
  theme: ScannerTheme;
  timeframe: Timeframe;
  crosshairActive: boolean;
  captureRequest: ChartCaptureRequest | null;
  drawing: DrawingController;
};

export function ScannerChart({
  stock,
  chartType,
  rangeFilter,
  theme,
  timeframe,
  crosshairActive,
  captureRequest,
  drawing,
}: ScannerChartProps) {
  const chartData = useMemo(
    () => buildScannerChartData(mockWeeklyCandles, rangeFilter, theme),
    [rangeFilter, theme]
  );
  const candleTimes = useMemo(
    () => mockWeeklyCandles.map((candle) => candle.time),
    []
  );
  const { containerRef, chartHandles } = useLightweightCandlestickChart({
    data: chartData,
    chartType,
    crosshairActive,
    theme,
  });
  const { scanBands } =
    useNearHighScanOverlayData({
      symbol: stock.symbol,
      candles: mockWeeklyCandles,
      baseScanBands: mockScanBands,
    });

  return (
    <ScannerChartStage
      containerRef={containerRef}
      chartHandles={chartHandles}
      stock={stock}
      timeframe={timeframe}
      candleTimes={candleTimes}
      scanBands={scanBands}
      captureRequest={captureRequest}
      drawing={drawing}
      theme={theme}
    />
  );
}
