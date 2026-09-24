"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Minimize2, Search } from "lucide-react";
import { queryKeys } from "@/features/api";
import { AdPlacement, AdsenseScript } from "@/features/adsense";
import { EmptyState } from "@/components/ui/empty-state";
import type { Stock } from "@/types/market";
import { AuthGuard, useSessionStore } from "@/features/auth";
import { useCurrentDayCandle } from "@/features/market-data";
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
  useProgressiveScannerCandles,
  useScannerHistoryRange,
  useScannerResults,
  useScannerWorkspaceDrawings,
} from "../hooks/use-scanner-data";
import { mapScanBandsToDisplayTimeframe } from "../lib/map-scan-bands-to-display-timeframe";
import { getScannerThemeClass } from "../lib/scanner-chart-config";
import {
  isHistoricalRangeFilterAvailable,
  type AvailableHistoryRange,
} from "../lib/historical-range";
import { useScannerUiStore } from "../stores/scanner-ui-store";
import { mergeProvisionalCandleForDisplay } from "../lib/provisional-candles";
import type {
  ChartCaptureRequest,
  ScannerRangeFilter,
  ScannerChartType,
  ScannerLookbackMultiplier,
  ScannerTheme,
  Timeframe,
} from "../types";
import { SCANNER_LOOKBACK_OPTIONS } from "../types";
import { ChartsEmptyIllustration } from "./ChartsEmptyIllustration";
import { ChartToolsBar } from "./ChartToolsBar";
import { RangeFilterTabs } from "./RangeFilterTabs";
import { ScannerChart } from "./ScannerChart";
import { ScannerWatchlistSidebar } from "./ScannerWatchlistSidebar";
import { TopToolbar } from "./TopToolbar";

const SCANNER_ANALYSIS_TIMEFRAME: Timeframe = "1W";

const SCANNER_GUTTER = "gap-0.5 sm:gap-[3px] lg:gap-1";
const SCANNER_GUTTER_B = "mb-0.5 sm:mb-[3px] lg:mb-1";
const SCANNER_LOOKBACK_VALUES = new Set<string>(
  SCANNER_LOOKBACK_OPTIONS.map((option) => option.value)
);

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
  const launchSearchHandledRef = useRef(false);
  
  
  
  
  
  
  
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

  useEffect(() => {
    if (searchParams.get("search") !== "1" || launchSearchHandledRef.current) return;
    launchSearchHandledRef.current = true;
    openSearchModal();

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [openSearchModal, pathname, router, searchParams]);
  const showBacktestStats = useScannerUiStore((state) => state.showBacktestStats);
  const scannerHighlightsVisible = useScannerUiStore((state) => state.scannerHighlightsVisible);
  const toggleBacktestStats = useScannerUiStore((state) => state.toggleBacktestStats);
  const toggleScannerHighlights = useScannerUiStore((state) => state.toggleScannerHighlights);
  const setActiveWatchlistId = useScannerUiStore((state) => state.setActiveWatchlistId);
  const setWatchlistPanelOpen = useScannerUiStore((state) => state.setWatchlistPanelOpen);
  const setPanelMode = useScannerUiStore((state) => state.setPanelMode);
  const setActiveSegmentCode = useScannerUiStore((state) => state.setActiveSegmentCode);

  
  
  
  
  const symbolParam = searchParams.get("symbol")?.trim().toUpperCase() ?? "";
  const exchangeParam = searchParams.get("exchange")?.trim().toUpperCase() ?? "";
  const lookbackParam = searchParams.get("lookback")?.trim();
  const hasStockInUrl = Boolean(symbolParam) && Boolean(exchangeParam);

  const selectedStock = useMemo<Stock | null>(() => {
    if (!hasStockInUrl) return null;
    if (isSameMarketStock(selectedStockSnapshot, symbolParam, exchangeParam)) {
      return selectedStockSnapshot;
    }
    
    
    
    
    return { ...buildEmptyStock(exchangeParam), symbol: symbolParam };
  }, [hasStockInUrl, symbolParam, exchangeParam, selectedStockSnapshot]);
  const symbolSyncOriginRef = useRef<"url" | "user" | null>(null);

  const handleSelectStock = (stock: Stock) => {
    symbolSyncOriginRef.current = "user";
    setSelectedStock(stock);
  };

  
  
  
  
  
  
  // Explicit Watchlist-origin navigation (?panel=watchlist, optionally with
  // &watchlist=<id>, built by buildWatchlistChartsHref) opens the watchlist
  // sidebar deterministically - never inferred from referrer/history, and
  // never triggered by symbol links from Dashboard/Global Search/Stock
  // Detail, which don't set `panel`. Re-applies only when the (panel, id)
  // pair actually changes (a new watchlist link was clicked), not on every
  // unrelated URL update (e.g. the symbol/exchange sync below) - so
  // manually closing the sidebar afterward sticks instead of being
  // reopened on the next render, and reloading/forward-navigating back to
  // the same URL reliably reopens it (fresh mount resets the ref).
  const appliedWatchlistPanelKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (searchParams.get("panel") !== "watchlist") return;

    const watchlistIdFromUrl = searchParams.get("watchlist");
    const key = watchlistIdFromUrl ?? "";
    if (appliedWatchlistPanelKeyRef.current === key) return;

    appliedWatchlistPanelKeyRef.current = key;
    setPanelMode("watchlist");
    if (watchlistIdFromUrl) setActiveWatchlistId(watchlistIdFromUrl);
    setWatchlistPanelOpen(true);
  }, [searchParams, setActiveWatchlistId, setWatchlistPanelOpen, setPanelMode]);

  // Same deterministic-URL pattern as the watchlist panel above, for a Widget's Segment context (?panel=segment&segment=<code>, built by buildSegmentChartsHref).
  const appliedSegmentPanelKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (searchParams.get("panel") !== "segment") return;

    const segmentCodeFromUrl = searchParams.get("segment");
    const key = segmentCodeFromUrl ?? "";
    if (appliedSegmentPanelKeyRef.current === key) return;

    appliedSegmentPanelKeyRef.current = key;
    setPanelMode("segment");
    if (segmentCodeFromUrl) setActiveSegmentCode(segmentCodeFromUrl);
    setWatchlistPanelOpen(true);
  }, [searchParams, setActiveSegmentCode, setWatchlistPanelOpen, setPanelMode]);

  // Zustand's persist middleware rehydrates lookbackMultiplier from
  // localStorage asynchronously after mount - on first render the store
  // still holds its pre-hydration default, so a "does this already match
  // the URL?" check can trivially (and misleadingly) pass before the real
  // persisted value has loaded, then get silently overwritten by
  // rehydration a moment later with no re-check. Tracking which lookback
  // param value has already been applied (same ref pattern as the segment
  // panel param above) forces the URL to win exactly once per distinct
  // value, regardless of what the store happens to hold at the time.
  const appliedLookbackParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (!lookbackParam || !SCANNER_LOOKBACK_VALUES.has(lookbackParam)) return;
    if (appliedLookbackParamRef.current === lookbackParam) return;
    appliedLookbackParamRef.current = lookbackParam;
    setLookbackMultiplier(lookbackParam as ScannerLookbackMultiplier);
  }, [lookbackParam, setLookbackMultiplier]);

  
  
  
  
  
  
  
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
        "grid h-dvh w-screen place-items-center bg-(--scanner-shell-bg) text-foreground"
      )}
    >
      <div
        className={cn(
          getScannerThemeClass(theme),
          "flex h-dvh w-screen flex-col overflow-hidden bg-(--scanner-shell-bg) text-foreground",
          SCANNER_GUTTER
        )}
      >
        <AdsenseScript placementKeys={["scanner_bottom"]} />
        <TopToolbar
          stock={selectedStock ?? buildEmptyStock(selectedExchange)}
          chartType={chartType}
          timeframe={timeframe}
          lookbackMultiplier={lookbackMultiplier}
          onChartTypeChange={setChartType}
          onTimeframeChange={setTimeframe}
          onLookbackMultiplierChange={setLookbackMultiplier}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
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
            />
          ) : (
            <ScannerEmptyState onOpenSearch={() => openSearchModal()} />
          )}
          
          <ScannerWatchlistSidebar
            selectedSymbol={selectedStock?.symbol ?? ""}
            selectedExchange={selectedStock?.exchange ?? ""}
            onSelectStock={handleSelectStock}
          />
        </div>
      </div>
    </AuthGuard>
  );
}





function ScannerEmptyState({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <EmptyState
          illustration={<ChartsEmptyIllustration />}
          title="Select a stock to start reviewing."
          primaryAction={{
            label: "Search stocks",
            icon: Search,
            onClick: onOpenSearch,
          }}
        />
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
}: ScannerDrawingWorkspaceProps) {
  const queryClient = useQueryClient();
  const drawing = useScannerDrawingState(stock.symbol, timeframe);
  const chartFocusMode = useScannerUiStore((state) => state.chartFocusMode);
  const setChartFocusMode = useScannerUiStore((state) => state.setChartFocusMode);

  useEffect(() => {
    if (!chartFocusMode) return;
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChartFocusMode(false);
    };
    window.addEventListener("keydown", exitOnEscape);
    return () => window.removeEventListener("keydown", exitOnEscape);
  }, [chartFocusMode, setChartFocusMode]);
  const authStatus = useSessionStore((state) => state.status);
  const historyRangeQuery = useScannerHistoryRange(stock.symbol, "1D", stock.exchange);
  const historyMetadataRange = useMemo<AvailableHistoryRange | null>(() => {
    const range = historyRangeQuery.data;
    if (!range?.from || !range.to) return null;
    return { from: range.from, to: range.to };
  }, [historyRangeQuery.data]);
  const candleQuery = useProgressiveScannerCandles(stock.symbol, timeframe, stock.exchange);
  const candles = useMemo(
    () =>
      candleQuery.data && candleQuery.data.length > 0
        ? candleQuery.data
        : [],
    [candleQuery.data]
  );
  const currentDayCandleQuery = useCurrentDayCandle(
    { symbol: stock.symbol, exchange: stock.exchange },
    { enabled: Boolean(stock.symbol) && stock.exchange === "BSE" && (timeframe === "1D" || timeframe === "1W" || timeframe === "1M") }
  );
  // Chart display only. Scan verdicts (which weeks matched and per-symbol
  // pass/fail) come from the separate completed-week scanner endpoint;
  // neither these chart candles nor their provisional prices are used to
  // calculate them. mapScanBandsToDisplayTimeframe takes displayCandles
  // only to locate real chart bucket times. Hold off merging today's
  // snapshot until historical candles have loaded at least once -
  // the current-day snapshot query is a single lightweight round trip and
  // routinely resolves before the historical ensure-fresh repair does, so
  // without this the chart would flash "just today's candle" before the
  // history pops in behind it.
  const displayCandles = useMemo(() => {
    if (candleQuery.isLoading) return candles;
    return mergeProvisionalCandleForDisplay(
      candles,
      currentDayCandleQuery.candle,
      timeframe,
      candleQuery.dataThrough
    );
  }, [
    candles,
    candleQuery.dataThrough,
    candleQuery.isLoading,
    currentDayCandleQuery.candle,
    timeframe,
  ]);
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
  // Fires as soon as symbol/exchange are known, in parallel with the candle
  // fetch(es) above - not gated on candleQuery/analysisCandleQuery finishing.
  // The backend computes scan results straight from whatever's already in
  // the DB, independent of the client's own ensure-fresh repair, so there
  // was no correctness reason to wait; waiting only stacked this request's
  // full round trip on top of the (often slower, ensure-fresh-gated) candle
  // fetch, which is why the yellow highlight bands took so long to appear.
  // baseScanBands below still only produces visible bands once `candles`
  // has loaded, since it maps highlight times onto actual candle positions.
  const scannerResultsQuery = useScannerResults(
    stock.symbol,
    SCANNER_ANALYSIS_TIMEFRAME,
    true,
    stock.exchange,
    lookbackMultiplier
  );
  const backtestQuery = useScannerBacktest(
    stock.symbol,
    true,
    stock.exchange,
    lookbackMultiplier
  );
  const visibleBacktestStats = backtestQuery.stats;
  const scannerAnalysisReady =
    !scannerResultsQuery.isPending && !backtestQuery.isPending;
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
      if (event.type === "market.symbol.refreshed") {
        if (event.data.exchange !== stock.exchange || event.data.symbol !== stock.symbol) return;
        void queryClient.invalidateQueries({
          predicate: (query) => {
            const [namespace, resource, input] = query.queryKey;
            if (namespace !== "market-data" || resource !== "candles") return false;
            const candleInput = input as { symbol?: string; exchange?: string } | undefined;
            return candleInput?.symbol === stock.symbol && candleInput?.exchange === stock.exchange;
          },
        });
        return;
      }

      if (event.type !== "market.candle.update") return;
      if (event.data.exchange !== stock.exchange || event.data.symbol !== stock.symbol) return;
      if (event.data.timeframe === "1D") {
        queryClient.setQueryData(
          queryKeys.marketData.currentDayCandle({
            symbol: stock.symbol,
            exchange: stock.exchange,
          }),
          {
            candle: {
              time: event.data.time,
              open: event.data.open,
              high: event.data.high,
              low: event.data.low,
              close: event.data.close,
              volume: event.data.volume ?? null,
              lastUpdatedAt: event.data.lastUpdatedAt ?? event.data.time,
              provisional: true,
            },
          }
        );
      }
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

  const weeklyScanBands = useMemo(
    () => {
      const backendBandsWithHighlights = scannerResultsQuery.scanBands.filter(
        (band) => (band.highlightTimes?.length ?? 0) > 0
      );

      if (backendBandsWithHighlights.length > 0) {
        return backendBandsWithHighlights;
      }

      return scannerResultsQuery.isError ? mockScanBands : [];
    },
    [scannerResultsQuery.isError, scannerResultsQuery.scanBands]
  );

  // Scan bands can reach back as far as the selected lookback multiplier
  // (1x/3x/5x = 50/150/250 weeks), but progressive loading only fetches
  // PROGRESSIVE_CANDLE_PAGE_SIZE candles up front. mapScanBandsToDisplayTimeframe
  // can only place a band on a candle that's already loaded, so without this,
  // 3x/5x bands older than the initial page silently disappear until the user
  // manually pans back far enough to trigger more pages. Auto-fetch older
  // pages until loaded history reaches the oldest band we need to place, or
  // the provider has no more to give.
  const oldestRequiredBandTime = useMemo(() => {
    let oldest: string | null = null;
    for (const band of weeklyScanBands) {
      const candidate = band.highlightTimes?.[0] ?? band.startTime;
      if (!candidate) continue;
      if (!oldest || candidate < oldest) oldest = candidate;
    }
    return oldest;
  }, [weeklyScanBands]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = candleQuery;
  useEffect(() => {
    if (!oldestRequiredBandTime) return;
    if (!hasNextPage || isFetchingNextPage) return;
    const earliestLoadedTime = candles[0]?.time;
    if (earliestLoadedTime && earliestLoadedTime <= oldestRequiredBandTime) return;
    void fetchNextPage();
  }, [oldestRequiredBandTime, candles, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // displayCandles, not candles - mapScanBandsToDisplayTimeframe only ever
  // reads .time from this array (which real calendar days already exist on
  // the chart), never price, so including the provisional/delayed candle
  // here can't fabricate a signal. Without it, the "carry a confirmed PASS
  // onto the current week's real candles" logic (see that file's own
  // comments) could only ever reach as far as the DB's last completed
  // candle - stopping the highlight one day short of the chart's actual
  // latest (delayed) candle whenever today hasn't synced to the DB yet.
  const baseScanBands = useMemo(
    () => mapScanBandsToDisplayTimeframe(weeklyScanBands, displayCandles, timeframe),
    [displayCandles, timeframe, weeklyScanBands]
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
    
    
    
    
    
    <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden", SCANNER_GUTTER)}>
      <ChartToolsBar
        drawing={drawing}
        stock={stock}
        chartType={chartType}
        onChartTypeChange={onChartTypeChange}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className={cn(
          "relative min-h-0 min-w-0 flex-1 overflow-hidden",
          SCANNER_GUTTER_B,
          chartFocusMode && "fixed inset-0 z-100 bg-(--scanner-shell-bg)"
        )}>
          {chartFocusMode && (
            <button
              type="button"
              onClick={() => setChartFocusMode(false)}
              className="absolute top-2 right-2 z-50 inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur hover:bg-muted"
              aria-label="Exit full chart view"
              title="Exit full chart view"
            >
              <Minimize2 className="size-4" />
            </button>
          )}
          <ScannerChart
            stock={stock}
            candles={displayCandles}
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
            analysisReady={scannerAnalysisReady}
            hasMoreCandles={candleQuery.hasNextPage}
            loadingMoreCandles={candleQuery.isFetchingNextPage}
            onLoadMoreCandles={() => {
              if (candleQuery.hasNextPage && !candleQuery.isFetchingNextPage) {
                void candleQuery.fetchNextPage();
              }
            }}
          />
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

















