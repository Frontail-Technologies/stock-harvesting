"use client";

import { useMemo } from "react";
import { useCurrency } from "@/features/currency";
import type { Candle, ScanBand, Stock } from "@/types/market";
import { useLightweightCandlestickChart } from "../hooks/use-lightweight-candlestick-chart";
import { useScannerBacktest } from "../hooks/use-scanner-data";
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
  candles: Candle[];
  baseScanBands: ScanBand[];
  loading: boolean;
  chartType: ScannerChartType;
  rangeFilter: ScannerRangeFilter;
  theme: ScannerTheme;
  timeframe: Timeframe;
  crosshairActive: boolean;
  captureRequest: ChartCaptureRequest | null;
  drawing: DrawingController;
  autoScale: boolean;
  percentageScale: boolean;
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
  const hasHistoricalCandles = candles.length > 1;
  const { stats: backtestStats } = useScannerBacktest(
    stock.symbol,
    timeframe === "1W" && hasHistoricalCandles,
    stock.exchange
  );
  const { containerRef, chartHandles } = useLightweightCandlestickChart({
    data: chartData,
    chartType,
    crosshairActive,
    priceFormatter,
    theme,
    autoScale,
    percentageScale,
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
      backtestStats={hasHistoricalCandles ? backtestStats : null}
    />
  );
}
