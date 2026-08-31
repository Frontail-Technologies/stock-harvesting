"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MARKET_EXCHANGE, type MarketExchangeCode } from "@/features/market";
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

  selectedExchange: MarketExchangeCode;
  selectedStock: Stock | null;
  timeframe: Timeframe;
  chartType: ScannerChartType;
  lookbackMultiplier: ScannerLookbackMultiplier;
  rangeFilter: ScannerRangeFilter;
  captureRequest: ChartCaptureRequest | null;

  lastProcessedCaptureId: number | null;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  scannerHighlightsVisible: boolean;

  isWatchlistPanelOpen: boolean;

  isWatchlistPanelMinimized: boolean;
  watchlistPanelWidth: number;
  activeWatchlistId: string | null;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedExchange: (exchange: MarketExchangeCode) => void;
  setSelectedStock: (stock: Stock) => void;
  clearSelectedStock: () => void;
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
  setWatchlistPanelOpen: (open: boolean) => void;
  toggleWatchlistPanel: () => void;
  setWatchlistPanelMinimized: (minimized: boolean) => void;
  setWatchlistPanelWidth: (width: number) => void;
  setActiveWatchlistId: (id: string | null) => void;
};

export const SCANNER_WATCHLIST_PANEL_RAIL_WIDTH = 44;

export const SCANNER_WATCHLIST_PANEL_MIN_WIDTH = 240;
export const SCANNER_WATCHLIST_PANEL_MAX_WIDTH = 480;
const SCANNER_WATCHLIST_PANEL_DEFAULT_WIDTH = 280;

function clampWatchlistPanelWidth(width: number) {
  return Math.min(
    SCANNER_WATCHLIST_PANEL_MAX_WIDTH,
    Math.max(SCANNER_WATCHLIST_PANEL_MIN_WIDTH, width)
  );
}

export const useScannerUiStore = create<ScannerUiState>()(
  persist(
    (set) => ({
      selectedSymbol: "",
      selectedExchange: DEFAULT_MARKET_EXCHANGE,
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
      isWatchlistPanelOpen: false,
      isWatchlistPanelMinimized: false,
      watchlistPanelWidth: SCANNER_WATCHLIST_PANEL_DEFAULT_WIDTH,
      activeWatchlistId: null,
      setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
      setSelectedExchange: (selectedExchange) => set({ selectedExchange }),
      setSelectedStock: (selectedStock) =>
        set({
          selectedSymbol: selectedStock.symbol,
          selectedExchange: selectedStock.exchange,
          selectedStock,
        }),
      clearSelectedStock: () => set({ selectedSymbol: "", selectedStock: null }),
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
      setWatchlistPanelOpen: (isWatchlistPanelOpen) => set({ isWatchlistPanelOpen }),
      toggleWatchlistPanel: () =>
        set((state) => ({ isWatchlistPanelOpen: !state.isWatchlistPanelOpen })),
      setWatchlistPanelMinimized: (isWatchlistPanelMinimized) =>
        set({ isWatchlistPanelMinimized }),
      setWatchlistPanelWidth: (width) =>
        set({ watchlistPanelWidth: clampWatchlistPanelWidth(width) }),
      setActiveWatchlistId: (activeWatchlistId) => set({ activeWatchlistId }),
    }),
    {
      name: "stock-harvesting-scanner-ui",

      partialize: (state) => ({
        timeframe: state.timeframe,
        chartType: state.chartType,
        lookbackMultiplier: state.lookbackMultiplier,
        rangeFilter: state.rangeFilter,
        autoScale: state.autoScale,
        percentageScale: state.percentageScale,
        showBacktestStats: state.showBacktestStats,
        scannerHighlightsVisible: state.scannerHighlightsVisible,
        isWatchlistPanelOpen: state.isWatchlistPanelOpen,
        isWatchlistPanelMinimized: state.isWatchlistPanelMinimized,
        watchlistPanelWidth: state.watchlistPanelWidth,
        activeWatchlistId: state.activeWatchlistId,
      }),
    }
  )
);
