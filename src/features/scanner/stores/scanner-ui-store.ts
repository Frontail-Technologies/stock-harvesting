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
  // Empty string means "no stock selected" - Scanner's startup identity
  // comes solely from the URL (see ScannerPage.tsx); this and
  // selectedExchange/selectedStock are an in-app cache of the last
  // explicit in-app selection (search result, watchlist click, Scanner's
  // own exchange switcher), used only to avoid re-deriving a placeholder
  // while the URL sync effects catch up - never a startup fallback, and
  // deliberately NOT persisted (see partialize below), so a stale
  // previous stock can never reopen on a bare /scanner visit.
  selectedSymbol: string;
  // Scanner's own exchange, not a read of some app-wide "current
  // exchange" - this is the exchange of the stock Scanner currently has
  // open (or, before any stock is explicitly chosen, just the toolbar's
  // exchange selector preference for this session).
  selectedExchange: MarketExchangeCode;
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
  // The toolbar-triggered watchlist sidebar (see ScannerWatchlistSidebar.tsx)
  // - separate from selectedSymbol/selectedStock above, and separate from
  // the URL-driven ?watchlist= floating widget (ScannerWatchlistWidget.tsx),
  // which keeps its own local open state. width is in px, clamped to the
  // sidebar's own min/max when applied.
  isWatchlistPanelOpen: boolean;
  // Minimized = shrunk to a fixed narrow rail, still visible/anchored to
  // the right edge - distinct from isWatchlistPanelOpen (which removes it
  // from the layout entirely). Never mutates watchlistPanelWidth, so
  // maximizing always restores exactly the width the user had before.
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

// Fixed rail width when minimized - not user-resizable, so this is a plain
// constant rather than clamped/persisted state like watchlistPanelWidth.
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
      // Deliberately excludes selectedSymbol/selectedExchange/
      // selectedStock - stock identity must come solely from the URL on
      // every visit (see ScannerPage.tsx), never from a previous session's
      // persisted selection. Everything below is a harmless UI
      // preference, not stock-identity data.
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
