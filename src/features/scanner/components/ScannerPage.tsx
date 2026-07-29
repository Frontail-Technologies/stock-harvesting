"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import type { Stock } from "@/types/market";
import { AuthGuard, useSessionStore } from "@/features/auth";
import { useMarketStream, type MarketStreamEvent } from "@/features/market-stream";
import {
  DEFAULT_MARKET_EXCHANGE,
  isEnabledMarketExchange,
  useMarketStore,
  type MarketExchangeCode,
} from "@/features/market";
import { useTheme } from "@/features/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { mockScanBands } from "@/mocks/market/candles";
import { mockStocks } from "@/mocks/market/stocks";
import { cn } from "@/utils/cn";
import { findStockBySymbol } from "@/utils/stock-search";
import { useScannerDrawingState } from "../hooks/use-scanner-drawing-state";
import {
  useExchangeDefaultStock,
  useSaveScannerDrawings,
  useScannerCandles,
  useScannerResults,
  useScannerWorkspaceDrawings,
} from "../hooks/use-scanner-data";
import { buildNear250WeekHighScanBand } from "../lib/near-250-week-high-scan";
import { getScannerThemeClass } from "../lib/scanner-chart-config";
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
import { TopToolbar } from "./TopToolbar";

const DEFAULT_STOCK: Stock =
  findStockBySymbol(mockStocks, "AAPL") ??
  ({
    symbol: "AAPL",
    name: "Apple Inc.",
    exchange: "US",
    close: 224.31,
    changePct: 0.84,
    volume: 52_814_300,
  } satisfies Stock);

const DEFAULT_STOCK_BY_EXCHANGE: Record<MarketExchangeCode, Stock> = {
  US: DEFAULT_STOCK,
  NSE: {
    symbol: "RELIANCE",
    name: "Reliance Industries Limited",
    exchange: "NSE",
    close: 0,
    changePct: 0,
    volume: 0,
    hasMarketData: false,
  },
};

// Only US/NSE have a curated mock default — every other exchange (all of
// EODHD's ~70) falls back to a generic empty placeholder instead of a
// hand-picked one; real data fills in once a symbol is actually selected.
function getDefaultStock(exchange: MarketExchangeCode): Stock {
  return (
    DEFAULT_STOCK_BY_EXCHANGE[exchange] ?? {
      symbol: "",
      name: "",
      exchange,
      close: 0,
      changePct: 0,
      volume: 0,
      hasMarketData: false,
    }
  );
}

function getFallbackStock(symbol: string, exchange: MarketExchangeCode) {
  return (
    mockStocks.find(
      (stock) => stock.symbol === symbol && stock.exchange === exchange
    ) ?? {
      ...getDefaultStock(exchange),
      symbol,
      exchange,
    }
  );
}

function isMarketExchangeCode(value: string): value is MarketExchangeCode {
  return value.trim().length > 0;
}

function normalizeExchange(exchange: string): MarketExchangeCode {
  const trimmed = exchange.trim().toUpperCase();
  return isMarketExchangeCode(trimmed) && isEnabledMarketExchange(trimmed)
    ? trimmed
    : DEFAULT_MARKET_EXCHANGE;
}

function isSameMarketStock(
  stock: Stock | null,
  symbol: string,
  exchange: string
): stock is Stock {
  return Boolean(
    stock &&
      stock.symbol === symbol &&
      normalizeExchange(stock.exchange) === exchange
  );
}

function setSymbolParam({
  pathname,
  router,
  searchParams,
  symbol,
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  searchParams: { toString: () => string };
  symbol: string;
}) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("symbol", symbol);
  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
}

export function ScannerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const storedExchange = useMarketStore((state) => state.selectedExchange);
  const selectedExchange = normalizeExchange(storedExchange);
  const selectedSymbol = useScannerUiStore((state) => state.selectedSymbol);
  const selectedStockSnapshot = useScannerUiStore((state) => state.selectedStock);
  const setSelectedSymbol = useScannerUiStore((state) => state.setSelectedSymbol);
  const setSelectedStock = useScannerUiStore((state) => state.setSelectedStock);
  const chartType = useScannerUiStore((state) => state.chartType);
  const setChartType = useScannerUiStore((state) => state.setChartType);
  const lookbackMultiplier = useScannerUiStore((state) => state.lookbackMultiplier);
  const setLookbackMultiplier = useScannerUiStore((state) => state.setLookbackMultiplier);
  const rangeFilter = useScannerUiStore((state) => state.rangeFilter);
  const setRangeFilter = useScannerUiStore((state) => state.setRangeFilter);
  const timeframe = useScannerUiStore((state) => state.timeframe);
  const captureRequest = useScannerUiStore((state) => state.captureRequest);
  const requestCapture = useScannerUiStore((state) => state.requestCapture);
  const autoScale = useScannerUiStore((state) => state.autoScale);
  const percentageScale = useScannerUiStore((state) => state.percentageScale);
  const toggleAutoScale = useScannerUiStore((state) => state.toggleAutoScale);
  const togglePercentageScale = useScannerUiStore((state) => state.togglePercentageScale);
  const selectedStock = useMemo<Stock>(() => {
    if (isSameMarketStock(selectedStockSnapshot, selectedSymbol, selectedExchange)) {
      return selectedStockSnapshot;
    }

    return getFallbackStock(selectedSymbol, selectedExchange);
  }, [selectedExchange, selectedStockSnapshot, selectedSymbol]);
  const symbolSyncOriginRef = useRef<"url" | "user" | null>(null);

  // Only US/NSE have a hand-picked default symbol — every other exchange
  // resolves to the empty placeholder from getDefaultStock() first, then
  // gets backfilled here once a real symbol for that exchange loads.
  const hasCuratedDefault = Boolean(DEFAULT_STOCK_BY_EXCHANGE[selectedExchange]);
  const fetchedDefaultStock = useExchangeDefaultStock(selectedExchange, !hasCuratedDefault);

  useEffect(() => {
    const symbolInUrl = searchParams.get("symbol")?.trim();
    if (symbolInUrl) return;
    if (isSameMarketStock(selectedStockSnapshot, selectedSymbol, selectedExchange)) {
      return;
    }

    const nextStock = getDefaultStock(selectedExchange);
    symbolSyncOriginRef.current = "user";
    setSelectedStock(nextStock);
  }, [
    searchParams,
    selectedExchange,
    selectedStockSnapshot,
    selectedSymbol,
    setSelectedStock,
  ]);

  useEffect(() => {
    if (!fetchedDefaultStock) return;
    if (selectedStock.symbol !== "" || selectedStock.exchange !== selectedExchange) return;

    symbolSyncOriginRef.current = "user";
    setSelectedStock(fetchedDefaultStock);
    setSymbolParam({
      pathname,
      router,
      searchParams,
      symbol: fetchedDefaultStock.symbol,
    });
  }, [fetchedDefaultStock, pathname, router, searchParams, selectedExchange, selectedStock, setSelectedStock]);

  const handleSelectStock = (stock: Stock) => {
    symbolSyncOriginRef.current = "user";
    setSelectedStock(stock);
  };

  const handleExchangeChange = (exchange: MarketExchangeCode) => {
    const nextStock = getDefaultStock(exchange);
    symbolSyncOriginRef.current = "user";
    setSelectedStock(nextStock);
    setSymbolParam({
      pathname,
      router,
      searchParams,
      symbol: nextStock.symbol,
    });
  };

  useEffect(() => {
    const symbol = searchParams.get("symbol")?.trim().toUpperCase();
    if (!symbol || symbol === selectedSymbol) return;

    if (symbolSyncOriginRef.current === "user") {
      return;
    }

    symbolSyncOriginRef.current = "url";
    setSelectedSymbol(symbol);
  }, [searchParams, selectedSymbol, setSelectedSymbol]);

  useEffect(() => {
    const symbolInUrl = searchParams.get("symbol")?.trim().toUpperCase();
    if (symbolInUrl === selectedSymbol) {
      symbolSyncOriginRef.current = null;
      return;
    }

    if (symbolSyncOriginRef.current === "url") {
      symbolSyncOriginRef.current = null;
      return;
    }

    symbolSyncOriginRef.current = "user";
    const params = new URLSearchParams(searchParams.toString());
    params.set("symbol", selectedSymbol);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, selectedSymbol]);

  return (
    <AuthGuard>
      <div
        className={cn(
          getScannerThemeClass(theme),
          "flex h-dvh w-screen flex-col overflow-hidden bg-background text-foreground"
        )}
      >
        <TopToolbar
          stock={selectedStock}
          chartType={chartType}
          lookbackMultiplier={lookbackMultiplier}
          timeframe={timeframe}
          exchange={selectedExchange}
          onChartTypeChange={setChartType}
          onLookbackMultiplierChange={setLookbackMultiplier}
          onExchangeChange={handleExchangeChange}
          onSelectStock={handleSelectStock}
          onScreenshot={() => requestCapture("download")}
          onSend={() => requestCapture("share")}
        />

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
          onScreenshot={() => requestCapture("download")}
          onSend={() => requestCapture("share")}
          onRangeFilterChange={setRangeFilter}
          onToggleAutoScale={toggleAutoScale}
          onTogglePercentageScale={togglePercentageScale}
        />
      </div>
    </AuthGuard>
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
  onScreenshot: () => void;
  onSend: () => void;
  onRangeFilterChange: (rangeFilter: ScannerRangeFilter) => void;
  onToggleAutoScale: () => void;
  onTogglePercentageScale: () => void;
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
  onScreenshot,
  onSend,
  onRangeFilterChange,
  onToggleAutoScale,
  onTogglePercentageScale,
}: ScannerDrawingWorkspaceProps) {
  const queryClient = useQueryClient();
  const drawing = useScannerDrawingState(stock.symbol, timeframe);
  const authStatus = useSessionStore((state) => state.status);
  const candleQuery = useScannerCandles(stock.symbol, timeframe, stock.exchange);
  const scannerResultsQuery = useScannerResults(
    stock.symbol,
    timeframe,
    !candleQuery.isPending,
    stock.exchange,
    lookbackMultiplier
  );
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

  const candles = useMemo(
    () =>
      candleQuery.data && candleQuery.data.length > 0
        ? candleQuery.data
        : [],
    [candleQuery.data]
  );
  const derivedScanBand = useMemo(
    () =>
      buildNear250WeekHighScanBand({
        symbol: stock.symbol,
        exchange: stock.exchange,
        timeframe,
        candles,
        lookbackWeeks: getScannerLookbackWeeks(lookbackMultiplier),
      }),
    [candles, lookbackMultiplier, stock.exchange, stock.symbol, timeframe]
  );
  const baseScanBands = useMemo(
    () => {
      const backendBandsWithHighlights = scannerResultsQuery.scanBands.filter(
        (band) => (band.highlightTimes?.length ?? 0) > 0
      );

      if (backendBandsWithHighlights.length > 0) {
        return backendBandsWithHighlights;
      }

      if (derivedScanBand) return [derivedScanBand];
      return scannerResultsQuery.isError ? mockScanBands : [];
    },
    [
      derivedScanBand,
      scannerResultsQuery.isError,
      scannerResultsQuery.scanBands,
    ]
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
        timeframe={timeframe}
        onScreenshot={onScreenshot}
        onSend={onSend}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <ScannerChart
            stock={stock}
            candles={candles}
            baseScanBands={baseScanBands}
            loading={candleQuery.isPending}
            chartType={chartType}
            rangeFilter={rangeFilter}
            theme={theme}
            timeframe={timeframe}
            crosshairActive={drawing.crosshairActive}
            captureRequest={captureRequest}
            drawing={drawing}
            autoScale={autoScale}
            percentageScale={percentageScale}
          />
        </div>
        <RangeFilterTabs
          value={rangeFilter}
          onChange={onRangeFilterChange}
          autoScale={autoScale}
          percentageScale={percentageScale}
          onToggleAutoScale={onToggleAutoScale}
          onTogglePercentageScale={onTogglePercentageScale}
        />
      </div>
    </div>
  );
}
