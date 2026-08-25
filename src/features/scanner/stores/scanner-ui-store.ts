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

let captureRequestCounter = 0;

type ScannerUiState = {
  selectedSymbol: string;
  selectedStock: Stock | null;
  timeframe: Timeframe;
  chartType: ScannerChartType;
  lookbackMultiplier: ScannerLookbackMultiplier;
  rangeFilter: ScannerRangeFilter;
  captureRequest: ChartCaptureRequest | null;
  // Tracks the last captureRequest.id that was actually acted on. Lives
  // here (not a ref inside ScannerChartStage) because that component
  // remounts on every timeframe switch (its `key` includes timeframe) -
  // a fresh per-mount ref would forget a request was already handled and
  // silently re-fire the same download/share on the next unrelated
  // remount. captureRequest itself is never reset to null once set, so
  // this is what actually makes each request fire exactly once.
  lastProcessedCaptureId: number | null;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  scannerHighlightsVisible: boolean;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedStock: (stock: Stock) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (chartType: ScannerChartType) => void;
  setLookbackMultiplier: (lookbackMultiplier: ScannerLookbackMultiplier) => void;
  setRangeFilter: (rangeFilter: ScannerRangeFilter) => void;
  requestCapture: (mode: ChartCaptureMode, targetWindow?: Window | null) => void;
  markCaptureProcessed: (id: number) => void;
  toggleAutoScale: () => void;
  togglePercentageScale: () => void;
  toggleBacktestStats: () => void;
  toggleScannerHighlights: () => void;
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
      lastProcessedCaptureId: null,
      autoScale: true,
      percentageScale: false,
      showBacktestStats: true,
      scannerHighlightsVisible: true,
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
      requestCapture: (mode, targetWindow) =>
        set({
          captureRequest: {
            id: ++captureRequestCounter,
            mode,
            targetWindow,
          },
        }),
      markCaptureProcessed: (id) => set({ lastProcessedCaptureId: id }),
      toggleAutoScale: () => set((state) => ({ autoScale: !state.autoScale })),
      togglePercentageScale: () =>
        set((state) => ({ percentageScale: !state.percentageScale })),
      toggleBacktestStats: () =>
        set((state) => ({ showBacktestStats: !state.showBacktestStats })),
      toggleScannerHighlights: () =>
        set((state) => ({
          scannerHighlightsVisible: !state.scannerHighlightsVisible,
        })),
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
        scannerHighlightsVisible: state.scannerHighlightsVisible,
      }),
    }
  )
);
