"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Stock } from "@/types/market";
import type {
  ChartCaptureMode,
  ChartCaptureRequest,
  ScannerChartType,
  ScannerLookbackMultiplier,
  ScannerRangeFilter,
  Timeframe,
} from "../types";
import { DEFAULT_SCANNER_LOOKBACK } from "../types";

type ScannerUiState = {
  selectedSymbol: string;
  selectedStock: Stock | null;
  timeframe: Timeframe;
  chartType: ScannerChartType;
  lookbackMultiplier: ScannerLookbackMultiplier;
  rangeFilter: ScannerRangeFilter;
  captureRequest: ChartCaptureRequest | null;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedStock: (stock: Stock) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (chartType: ScannerChartType) => void;
  setLookbackMultiplier: (lookbackMultiplier: ScannerLookbackMultiplier) => void;
  setRangeFilter: (rangeFilter: ScannerRangeFilter) => void;
  requestCapture: (mode: ChartCaptureMode) => void;
  toggleAutoScale: () => void;
  togglePercentageScale: () => void;
  toggleBacktestStats: () => void;
};

export const useScannerUiStore = create<ScannerUiState>()(
  persist(
    (set) => ({
      selectedSymbol: "AAPL",
      selectedStock: null,
      timeframe: "1W",
      chartType: "candlestick",
      lookbackMultiplier: DEFAULT_SCANNER_LOOKBACK,
      rangeFilter: "ALL",
      captureRequest: null,
      autoScale: true,
      percentageScale: false,
      showBacktestStats: true,
      setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
      setSelectedStock: (selectedStock) =>
        set({
          selectedSymbol: selectedStock.symbol,
          selectedStock,
        }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setChartType: (chartType) => set({ chartType }),
      setLookbackMultiplier: (lookbackMultiplier) => set({ lookbackMultiplier }),
      setRangeFilter: (rangeFilter) => set({ rangeFilter }),
      requestCapture: (mode) =>
        set({
          captureRequest: {
            id: Date.now(),
            mode,
          },
        }),
      toggleAutoScale: () => set((state) => ({ autoScale: !state.autoScale })),
      togglePercentageScale: () =>
        set((state) => ({ percentageScale: !state.percentageScale })),
      toggleBacktestStats: () =>
        set((state) => ({ showBacktestStats: !state.showBacktestStats })),
    }),
    {
      name: "stock-harvesting-scanner-ui",
      partialize: (state) => ({
        selectedSymbol: state.selectedSymbol,
        timeframe: state.timeframe,
        chartType: state.chartType,
        lookbackMultiplier: state.lookbackMultiplier,
        rangeFilter: state.rangeFilter,
        autoScale: state.autoScale,
        percentageScale: state.percentageScale,
        showBacktestStats: state.showBacktestStats,
      }),
    }
  )
);
