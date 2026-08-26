"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { queryKeys } from "@/features/api";
import { AdPlacement, AdsenseScript } from "@/features/adsense";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toast";
import type { Stock } from "@/types/market";
import { AuthGuard, useSessionStore } from "@/features/auth";
import { useMarketStream, type MarketStreamEvent } from "@/features/market-stream";
import { useSearchModalStore } from "@/features/global-search/stores/search-modal-store";
import { useTheme } from "@/features/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { mockScanBands } from "@/mocks/market/candles";
import { cn } from "@/utils/cn";
import { useScannerDrawingState } from "../hooks/use-scanner-drawing-state";
import {
  useScannerBacktest,
  useSaveScannerDrawings,
  useScannerCandles,
  useScannerHistoryRange,
  useScannerResults,
  useScannerWorkspaceDrawings,
} from "../hooks/use-scanner-data";
import { buildBacktestStatsFromCandles } from "../lib/build-backtest-stats-from-candles";
import { mapScanBandsToDisplayTimeframe } from "../lib/map-scan-bands-to-display-timeframe";
import { buildNear250WeekHighScanBand } from "../lib/near-250-week-high-scan";
import { getScannerThemeClass } from "../lib/scanner-chart-config";
import {
  isHistoricalRangeFilterAvailable,
  type AvailableHistoryRange,
} from "../lib/historical-range";
import { useScannerUiStore } from "../stores/scanner-ui-store";
import type {
  ChartCaptureRequest,
  ScannerRangeFilter,
  ScannerChartType,
  ScannerLookbackMultiplier,
  ScannerTheme,
  Timeframe,
} from "../types";
import { getScannerLookbackWeeks } from "../types";
import { ChartToolsBar } from "./ChartToolsBar";
import { RangeFilterTabs } from "./RangeFilterTabs";
import { ScannerChart } from "./ScannerChart";
import { ScannerWatchlistWidget } from "./ScannerWatchlistWidget";
import { TopToolbar } from "./TopToolbar";

const SCANNER_ANALYSIS_TIMEFRAME: Timeframe = "1W";

// A placeholder for "the toolbar needs some Stock object to render, but
// nothing is actually selected" - symbol is deliberately empty, which is
// exactly what every stock-specific query/subscription below gates on, so
// this never itself triggers a market-data call. Never a real default.
function buildEmptyStock(exchange: string): Stock {
  return {
    symbol: "",
    name: "",
    exchange,
    close: 0,
    changePct: 0,
    volume: 0,
    hasMarketData: false,
  };
}

function isSameMarketStock(
  stock: Stock | null,
  symbol: string,
  exchange: string
): stock is Stock {
  return Boolean(stock && stock.symbol === symbol && stock.exchange === exchange);
}

function setStockParams({
  pathname,
  router,
  searchParams,
  symbol,
  exchange,
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  searchParams: { toString: () => string };
  symbol: string;
  exchange: string;
}) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("symbol", symbol);
  params.set("exchange", exchange);
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
}

export function ScannerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const openSearchModal = useSearchModalStore((state) => state.open);
  // Scanner owns this exchange - it's the exchange of the stock Scanner
  // currently has open, never a read of some shared app-wide "current
  // exchange". See scanner-ui-store.ts. Neither this nor selectedSymbol is
  // persisted across visits (see the store's partialize) - both exist only
  // as an in-app cache of the last explicit in-app selection, kept in sync
  // with the URL below. The URL is what actually decides whether a stock
  // is open at all.
  const selectedSymbol = useScannerUiStore((state) => state.selectedSymbol);
  const selectedExchange = useScannerUiStore((state) => state.selectedExchange);
  const selectedStockSnapshot = useScannerUiStore((state) => state.selectedStock);
  const setSelectedSymbol = useScannerUiStore((state) => state.setSelectedSymbol);
  const setSelectedExchange = useScannerUiStore((state) => state.setSelectedExchange);
  const setSelectedStock = useScannerUiStore((state) => state.setSelectedStock);
  const clearSelectedStock = useScannerUiStore((state) => state.clearSelectedStock);
  const chartType = useScannerUiStore((state) => state.chartType);
  const setChartType = useScannerUiStore((state) => state.setChartType);
  const lookbackMultiplier = useScannerUiStore((state) => state.lookbackMultiplier);
  const setLookbackMultiplier = useScannerUiStore((state) => state.setLookbackMultiplier);
  const rangeFilter = useScannerUiStore((state) => state.rangeFilter);
  const setRangeFilter = useScannerUiStore((state) => state.setRangeFilter);
  const timeframe = useScannerUiStore((state) => state.timeframe);
  const setTimeframe = useScannerUiStore((state) => state.setTimeframe);
  const captureRequest = useScannerUiStore((state) => state.captureRequest);
  const autoScale = useScannerUiStore((state) => state.autoScale);
  const percentageScale = useScannerUiStore((state) => state.percentageScale);
  const toggleAutoScale = useScannerUiStore((state) => state.toggleAutoScale);
  const togglePercentageScale = useScannerUiStore((state) => state.togglePercentageScale);
  const showBacktestStats = useScannerUiStore((state) => state.showBacktestStats);
  const scannerHighlightsVisible = useScannerUiStore((state) => state.scannerHighlightsVisible);
  const toggleBacktestStats = useScannerUiStore((state) => state.toggleBacktestStats);
  const toggleScannerHighlights = useScannerUiStore((state) => state.toggleScannerHighlights);

  // The URL is the sole source of truth for "is a stock open right now" -
  // both symbol AND exchange must be present; a bare /scanner or a partial
  // URL (only one of the two) is treated identically as no stock, never
  // guessed or backfilled from a previous selection.
  const symbolParam = searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const exchangeParam = searchParams.get("exchange")?.trim().toUpperCase() ?? "";
  const hasStockInUrl = Boolean(symbolParam) && Boolean(exchangeParam);

  const selectedStock = useMemo<Stock | null>(() => {
    if (!hasStockInUrl) return null;
    if (isSameMarketStock(selectedStockSnapshot, symbolParam, exchangeParam)) {
      return selectedStockSnapshot;
    }
    // The URL names a stock the in-app cache doesn't have full metadata
    // for yet (direct link, external nav, back/forward) - a minimal
    // placeholder keyed by the URL's own identity; the metadata/candle
    // queries below fill in name/price once they resolve.
    return { ...buildEmptyStock(exchangeParam), symbol: symbolParam };
  }, [hasStockInUrl, symbolParam, exchangeParam, selectedStockSnapshot]);
  const symbolSyncOriginRef = useRef<"url" | "user" | null>(null);

  const handleSelectStock = (stock: Stock) => {
    symbolSyncOriginRef.current = "user";
    setSelectedStock(stock);
  };

  // The scanner toolbar itself has no watchlist affordance - this widget
  // opens only when navigated to from the Watchlists page's "Open in
  // Scanner" link (?watchlist=<id>), read once on mount. Read via lazy
  // useState init (not a synced effect) so it behaves as "auto-open once
  // from this navigation", not "stay in lockstep with the URL forever" -
  // closing it must not re-open on the next unrelated param change.
  const [watchlistWidgetId, setWatchlistWidgetId] = useState<string | null>(() =>
    searchParams.get("watchlist")
  );

  const handleCloseWatchlistWidget = () => {
    setWatchlistWidgetId(null);
    if (!searchParams.get("watchlist")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("watchlist");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // URL -> store, both directions: a URL that names a stock takes priority
  // over whatever Scanner currently has open (this is what makes
  // /scanner?symbol=TCS&exchange=BSE authoritative on a hard reload rather
  // than falling back to a persisted preference) - and a URL that names NO
  // stock (bare /scanner, a partial URL, or navigating back from a stock
  // URL) clears the in-app cache too, so a stale previous selection can
  // never leak back into the rendered stock via the store snapshot above.
  useEffect(() => {
    if (symbolSyncOriginRef.current === "user") return;

    if (!hasStockInUrl) {
      if (!selectedSymbol) return;
      symbolSyncOriginRef.current = "url";
      clearSelectedStock();
      return;
    }

    if (symbolParam === selectedSymbol && exchangeParam === selectedExchange) return;

    symbolSyncOriginRef.current = "url";
    setSelectedSymbol(symbolParam);
    setSelectedExchange(exchangeParam);
  }, [
    hasStockInUrl,
    symbolParam,
    exchangeParam,
    selectedSymbol,
    selectedExchange,
    setSelectedSymbol,
    setSelectedExchange,
    clearSelectedStock,
  ]);

  // Store -> URL: any in-app stock change (search result, a watchlist
  // click) ends up here, and this is the one place that actually writes
  // the URL - always both `symbol` and `exchange` together, so the address
  // bar is always a complete, shareable, reloadable identity rather than
  // symbol-only. An empty selection deliberately never writes anything by
  // itself, so a bare /scanner is never fought back to a stock just
  // because the store still remembers one.
  useEffect(() => {
    if (symbolSyncOriginRef.current === "url") {
      symbolSyncOriginRef.current = null;
      return;
    }

    if (!selectedSymbol || !selectedExchange) return;

    if (symbolParam === selectedSymbol && exchangeParam === selectedExchange) {
      symbolSyncOriginRef.current = null;
      return;
    }

    symbolSyncOriginRef.current = "user";
    setStockParams({
      pathname,
      router,
      searchParams,
      symbol: selectedSymbol,
      exchange: selectedExchange,
    });
  }, [pathname, router, searchParams, selectedExchange, selectedSymbol, symbolParam, exchangeParam]);

  return (
    <AuthGuard
      className={cn(
        getScannerThemeClass(theme),
        "grid h-dvh w-screen place-items-center bg-background text-foreground"
      )}
    >
      <div
        className={cn(
          getScannerThemeClass(theme),
          "flex h-dvh w-screen flex-col overflow-hidden bg-background text-foreground"
        )}
      >
        <AdsenseScript placementKeys={["scanner_bottom"]} />
        <Toaster />
        <TopToolbar
          stock={selectedStock ?? buildEmptyStock(selectedExchange)}
          chartType={chartType}
          timeframe={timeframe}
          lookbackMultiplier={lookbackMultiplier}
          onChartTypeChange={setChartType}
          onTimeframeChange={setTimeframe}
          onLookbackMultiplierChange={setLookbackMultiplier}
        />

        {selectedStock ? (
          <ScannerDrawingWorkspace
            key={`${selectedStock.exchange}:${selectedStock.symbol}:${timeframe}`}
            stock={selectedStock}
            chartType={chartType}
            lookbackMultiplier={lookbackMultiplier}
            rangeFilter={rangeFilter}
            theme={theme}
            timeframe={timeframe}
            captureRequest={captureRequest}
            autoScale={autoScale}
            percentageScale={percentageScale}
            showBacktestStats={showBacktestStats}
            scannerHighlightsVisible={scannerHighlightsVisible}
            onChartTypeChange={setChartType}
            onRangeFilterChange={setRangeFilter}
            onToggleAutoScale={toggleAutoScale}
            onTogglePercentageScale={togglePercentageScale}
            onToggleBacktestStats={toggleBacktestStats}
            onToggleScannerHighlights={toggleScannerHighlights}
            watchlistWidgetId={watchlistWidgetId}
            onSelectStock={handleSelectStock}
            onCloseWatchlistWidget={handleCloseWatchlistWidget}
          />
        ) : (
          <ScannerEmptyState onOpenSearch={() => openSearchModal()} />
        )}
      </div>
    </AuthGuard>
  );
}

// Deliberately minimal - this sits inside the same chart workspace chrome
// (scanner tokens, no card/illustration/gradient) rather than reading as a
// separate onboarding screen. No candle grid, axis, or stat placeholders
// here - nothing that could be mistaken for a stock actually being open.
function ScannerEmptyState({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">Search for a stock to start</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use search to open a stock and review its chart.
          </p>
        </div>
        <Button type="button" variant="outline" size="lg" onClick={onOpenSearch} className="gap-2">
          <Search className="size-4" />
          Search stocks
        </Button>
      </div>
      <AdPlacement placementKey="scanner_bottom" variant="scanner" className="shrink-0" />
    </div>
  );
}

type ScannerDrawingWorkspaceProps = {
  stock: Stock;
  chartType: ScannerChartType;
  lookbackMultiplier: ScannerLookbackMultiplier;
  rangeFilter: ScannerRangeFilter;
  theme: ScannerTheme;
  timeframe: Timeframe;
  captureRequest: ChartCaptureRequest | null;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  scannerHighlightsVisible: boolean;
  onChartTypeChange: (chartType: ScannerChartType) => void;
  onRangeFilterChange: (rangeFilter: ScannerRangeFilter) => void;
  onToggleAutoScale: () => void;
  onTogglePercentageScale: () => void;
  onToggleBacktestStats: () => void;
  onToggleScannerHighlights: () => void;
  watchlistWidgetId: string | null;
  onSelectStock: (stock: Stock) => void;
  onCloseWatchlistWidget: () => void;
};

function ScannerDrawingWorkspace({
  stock,
  chartType,
  lookbackMultiplier,
  rangeFilter,
  theme,
  timeframe,
  captureRequest,
  autoScale,
  percentageScale,
  showBacktestStats,
  scannerHighlightsVisible,
  onChartTypeChange,
  onRangeFilterChange,
  onToggleAutoScale,
  onTogglePercentageScale,
  onToggleBacktestStats,
  onToggleScannerHighlights,
  watchlistWidgetId,
  onSelectStock,
  onCloseWatchlistWidget,
}: ScannerDrawingWorkspaceProps) {
  const queryClient = useQueryClient();
  const drawing = useScannerDrawingState(stock.symbol, timeframe);
  const authStatus = useSessionStore((state) => state.status);
  const historyRangeQuery = useScannerHistoryRange(stock.symbol, "1D", stock.exchange);
  const historyMetadataRange = useMemo<AvailableHistoryRange | null>(() => {
    const range = historyRangeQuery.data;
    if (!range?.from || !range.to) return null;
    return { from: range.from, to: range.to };
  }, [historyRangeQuery.data]);
  const candleQuery = useScannerCandles(stock.symbol, timeframe, stock.exchange);
  const candles = useMemo(
    () =>
      candleQuery.data && candleQuery.data.length > 0
        ? candleQuery.data
        : [],
    [candleQuery.data]
  );
  const candleHistoryRange = useMemo<AvailableHistoryRange | null>(() => {
    if (candles.length === 0) return null;

    return {
      from: candles[0].time,
      to: candles[candles.length - 1].time,
    };
  }, [candles]);
  const availableHistoryRange = historyMetadataRange ?? candleHistoryRange;
  const effectiveRangeFilter = useMemo<ScannerRangeFilter>(
    () =>
      isHistoricalRangeFilterAvailable(rangeFilter, availableHistoryRange)
        ? rangeFilter
        : "ALL",
    [availableHistoryRange, rangeFilter]
  );

  useEffect(() => {
    if (!availableHistoryRange) return;
    if (effectiveRangeFilter === rangeFilter) return;

    onRangeFilterChange(effectiveRangeFilter);
  }, [availableHistoryRange, effectiveRangeFilter, onRangeFilterChange, rangeFilter]);
  const analysisCandleQuery = useScannerCandles(
    stock.symbol,
    SCANNER_ANALYSIS_TIMEFRAME,
    stock.exchange
  );
  const analysisCandles = useMemo(
    () =>
      timeframe === SCANNER_ANALYSIS_TIMEFRAME
        ? candles
        : analysisCandleQuery.data ?? [],
    [analysisCandleQuery.data, candles, timeframe]
  );
  const scannerResultsQuery = useScannerResults(
    stock.symbol,
    SCANNER_ANALYSIS_TIMEFRAME,
    timeframe === SCANNER_ANALYSIS_TIMEFRAME
      ? !candleQuery.isPending
      : !analysisCandleQuery.isPending,
    stock.exchange,
    lookbackMultiplier
  );
  const fallbackBacktestStats = useMemo(
    () => buildBacktestStatsFromCandles(analysisCandles, lookbackMultiplier),
    [analysisCandles, lookbackMultiplier]
  );
  const { stats: backendBacktestStats } = useScannerBacktest(
    stock.symbol,
    true,
    stock.exchange,
    lookbackMultiplier
  );
  const visibleBacktestStats = backendBacktestStats ?? fallbackBacktestStats;
  const workspaceDrawingsQuery = useScannerWorkspaceDrawings(stock.symbol, timeframe);
  const { mutate: saveDrawings } = useSaveScannerDrawings(stock.symbol, timeframe);
  const { replaceDrawings } = drawing;
  const debouncedDrawings = useDebouncedValue(drawing.drawings, 900);
  const hydratedWorkspaceRef = useRef(false);
  const lastSavedDrawingsRef = useRef("");
  const streamSymbols = useMemo(
    () => [{ exchange: stock.exchange, symbol: stock.symbol }],
    [stock.exchange, stock.symbol]
  );

  useMarketStream({
    symbols: streamSymbols,
    enabled:
      Boolean(stock.symbol) &&
      candleQuery.isSuccess &&
      (candleQuery.data?.length ?? 0) > 0,
    onEvent: (event: MarketStreamEvent) => {
      if (event.type !== "market.candle.update") return;
      if (event.data.exchange !== stock.exchange || event.data.symbol !== stock.symbol) return;
      if (event.data.timeframe !== timeframe) return;

      queryClient.setQueryData(
        queryKeys.marketData.candles({
          symbol: stock.symbol,
          timeframe,
          exchange: stock.exchange,
        }),
        (current: import("@/types/market").Candle[] | undefined) => {
          if (!current || current.length === 0) return current ?? [];

          const nextCandle = {
            time: event.data.time,
            open: event.data.open,
            high: event.data.high,
            low: event.data.low,
            close: event.data.close,
            volume: event.data.volume ?? 0,
          };

          const existingIndex = current.findIndex((candle) => candle.time === nextCandle.time);
          if (existingIndex === -1) {
            return [...current, nextCandle].sort((a, b) => a.time.localeCompare(b.time));
          }

          return current.map((candle, index) =>
            index === existingIndex
              ? {
                  ...candle,
                  high: Math.max(candle.high, nextCandle.high),
                  low: Math.min(candle.low, nextCandle.low),
                  close: nextCandle.close,
                  volume: Math.max(candle.volume, nextCandle.volume),
                }
              : candle
          );
        }
      );
    },
  });

  const derivedScanBand = useMemo(
    () =>
      buildNear250WeekHighScanBand({
        symbol: stock.symbol,
        exchange: stock.exchange,
        timeframe: SCANNER_ANALYSIS_TIMEFRAME,
        candles: analysisCandles,
        lookbackWeeks: getScannerLookbackWeeks(lookbackMultiplier),
      }),
    [analysisCandles, lookbackMultiplier, stock.exchange, stock.symbol]
  );
  const weeklyScanBands = useMemo(
    () => {
      if (derivedScanBand) return [derivedScanBand];

      const backendBandsWithHighlights = scannerResultsQuery.scanBands.filter(
        (band) => (band.highlightTimes?.length ?? 0) > 0
      );

      if (backendBandsWithHighlights.length > 0) {
        return backendBandsWithHighlights;
      }

      return scannerResultsQuery.isError ? mockScanBands : [];
    },
    [
      derivedScanBand,
      scannerResultsQuery.isError,
      scannerResultsQuery.scanBands,
    ]
  );

  const baseScanBands = useMemo(
    () => mapScanBandsToDisplayTimeframe(weeklyScanBands, candles, timeframe),
    [candles, timeframe, weeklyScanBands]
  );

  useEffect(() => {
    if (!workspaceDrawingsQuery.isSuccess || hydratedWorkspaceRef.current) return;

    hydratedWorkspaceRef.current = true;
    if (workspaceDrawingsQuery.drawings.length > 0) {
      replaceDrawings(workspaceDrawingsQuery.drawings);
      lastSavedDrawingsRef.current = JSON.stringify(workspaceDrawingsQuery.drawings);
    }
  }, [
    replaceDrawings,
    workspaceDrawingsQuery.drawings,
    workspaceDrawingsQuery.isSuccess,
  ]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!workspaceDrawingsQuery.isSuccess && !workspaceDrawingsQuery.isError) return;

    const serialized = JSON.stringify(debouncedDrawings);
    if (serialized === lastSavedDrawingsRef.current) return;

    lastSavedDrawingsRef.current = serialized;
    saveDrawings(debouncedDrawings);
  }, [
    authStatus,
    debouncedDrawings,
    saveDrawings,
    workspaceDrawingsQuery.isError,
    workspaceDrawingsQuery.isSuccess,
  ]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
      <ChartToolsBar
        drawing={drawing}
        stock={stock}
        chartType={chartType}
        onChartTypeChange={onChartTypeChange}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <ScannerChart
            stock={stock}
            candles={candles}
            baseScanBands={baseScanBands}
            loading={candleQuery.isPending}
            chartType={chartType}
            rangeFilter={effectiveRangeFilter}
            theme={theme}
            timeframe={timeframe}
            lookbackMultiplier={lookbackMultiplier}
            crosshairActive={drawing.crosshairActive}
            captureRequest={captureRequest}
            drawing={drawing}
            autoScale={autoScale}
            percentageScale={percentageScale}
            showBacktestStats={showBacktestStats}
            backtestStats={visibleBacktestStats}
            scannerHighlightsVisible={scannerHighlightsVisible}
          />
          {watchlistWidgetId && (
            <ScannerWatchlistWidget
              watchlistId={watchlistWidgetId}
              selectedSymbol={stock.symbol}
              selectedExchange={stock.exchange}
              onSelectStock={onSelectStock}
              onClose={onCloseWatchlistWidget}
            />
          )}
        </div>
        <RangeFilterTabs
          value={effectiveRangeFilter}
          availableRange={availableHistoryRange}
          availableRangeLoading={historyRangeQuery.isPending}
          backtestStats={visibleBacktestStats}
          onChange={onRangeFilterChange}
          autoScale={autoScale}
          percentageScale={percentageScale}
          showBacktestStats={showBacktestStats}
          scannerHighlightsVisible={scannerHighlightsVisible}
          onToggleAutoScale={onToggleAutoScale}
          onTogglePercentageScale={onTogglePercentageScale}
          onToggleBacktestStats={onToggleBacktestStats}
          onToggleScannerHighlights={onToggleScannerHighlights}
        />
        <AdPlacement placementKey="scanner_bottom" variant="scanner" className="shrink-0" />
      </div>
    </div>
  );
}

















