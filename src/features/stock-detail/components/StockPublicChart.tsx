"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { ExternalLink, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useSessionStore } from "@/features/auth";
import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import {
  createScannerCandleSeriesOptions,
  createScannerChartOptions,
} from "@/features/scanner/lib/scanner-chart-config";
import { useTheme } from "@/features/theme";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Candle } from "@/types/market";
import { cn } from "@/utils/cn";
import { StockSectionCard } from "./StockSectionCard";

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

// Public-safe reuse of the product chart's low-level visual primitives
// (colors/layout/series styling from scanner-chart-config.ts) so this looks
// like a real StockHarvesting chart - but with none of the authenticated
// Scanner workspace wired in: no drawing overlays, no scan-band/evaluator
// highlights, no persisted workspace state. Just candles, a price scale,
// and a time scale, built directly from the same publicly-fetched daily
// candles the old SVG chart used - no new provider/data-fetch path.
type PublicChartRange = "1M" | "6M" | "1Y" | "5Y" | "MAX";

const RANGE_OPTIONS: PublicChartRange[] = ["1M", "6M", "1Y", "5Y", "MAX"];
const RANGE_DAYS: Partial<Record<PublicChartRange, number>> = {
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  "5Y": 1825,
};

function sliceByRange(candles: Candle[], range: PublicChartRange): Candle[] {
  if (range === "MAX" || candles.length === 0) return candles;

  const days = RANGE_DAYS[range] ?? candles.length;
  const latestTime = new Date(`${candles[candles.length - 1].time}T00:00:00Z`).getTime();
  const cutoff = latestTime - days * 86_400_000;
  const startIndex = candles.findIndex(
    (candle) => new Date(`${candle.time}T00:00:00Z`).getTime() >= cutoff
  );

  return startIndex >= 0 ? candles.slice(startIndex) : candles;
}

type StockPublicChartProps = {
  symbol: string;
  exchange: string;
  currency: string;
  candles: Candle[];
  fullChartHref: string;
};

export function StockPublicChart({
  symbol,
  exchange,
  currency,
  candles,
  fullChartHref,
}: StockPublicChartProps) {
  const { theme } = useTheme();
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const authStatus = useSessionStore((state) => state.status);
  const [range, setRange] = useState<PublicChartRange>("1Y");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const visibleCandles = useMemo(() => sliceByRange(candles, range), [candles, range]);
  const renderData = useMemo<CandlestickData[]>(
    () =>
      visibleCandles.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    [visibleCandles]
  );
  const hasChart = renderData.length >= 2;

  // Recreated (not incrementally patched) on theme change - a public
  // teaser chart toggles theme rarely, so a clean rebuild is simpler and
  // safer than granular applyOptions bookkeeping.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasChart) return;

    const chartOptions = createScannerChartOptions(theme);
    const chart = createChart(container, {
      ...chartOptions,
      layout: {
        ...chartOptions.layout,
        fontSize: isMobile ? 10 : 12,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });
    const series = chart.addSeries(
      CandlestickSeries,
      createScannerCandleSeriesOptions((price) => formatCurrencyValue(price, currency))
    );
    series.setData(renderData);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = series;

    const resizeChart = () => {
      if (!containerRef.current) return;
      chart.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chartRef.current = null;
      seriesRef.current = null;
      chart.remove();
    };
    // renderData intentionally excluded - handled by the effect below so a
    // range change doesn't tear down and rebuild the whole chart instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, currency, hasChart, isMobile]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !chartRef.current) return;
    series.setData(renderData);
    chartRef.current.timeScale().fitContent();
  }, [renderData]);

  return (
    <section className="flex flex-col gap-3">
      <StockSectionCard className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 sm:gap-3 sm:pb-3">
          <div className="flex min-w-0 flex-1 items-center gap-px overflow-x-auto sm:gap-0.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "h-6 shrink-0 cursor-pointer rounded px-2 text-[0.7rem] font-medium transition-colors sm:h-7 sm:px-2.5 sm:text-xs",
                  range === option
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <Link
            href={fullChartHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5")}
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">Open full chart</span>
          </Link>
        </div>

        {hasChart ? (
          <div
            ref={containerRef}
            role="img"
            aria-label={`${symbol} (${exchange}) price chart, ${range}`}
            className="h-80 w-full sm:h-104"
          />
        ) : (
          <div className="flex h-80 flex-col items-center justify-center px-6 sm:h-104">
            <EmptyState
              size="compact"
              title="Price history unavailable"
              description={`Open the full Charts workspace to view ${symbol}'s complete history.`}
            />
          </div>
        )}
      </StockSectionCard>

      {authStatus !== "authenticated" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />
            Want drawing tools, alerts and advanced analysis?
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Login
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "default", size: "sm" })}>
              Create Free Account
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
