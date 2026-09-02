"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import type { Candle } from "@/types/market";
import { cn } from "@/utils/cn";
import { StockSectionCard } from "./StockSectionCard";

type PublicChartRange = "1M" | "6M" | "1Y" | "5Y" | "MAX";

const RANGE_OPTIONS: PublicChartRange[] = ["1M", "6M", "1Y", "5Y", "MAX"];
const RANGE_DAYS: Partial<Record<PublicChartRange, number>> = {
  "1M": 30,
  "6M": 182,
  "1Y": 365,
  "5Y": 1825,
};

const VIEWBOX_WIDTH = 880;
const VIEWBOX_HEIGHT = 260;
const VIEWBOX_PADDING_X = 4;
const Y_AXIS_TICK_COUNT = 5;
const X_AXIS_TICK_COUNT = 6;

type StockDetailChartProps = {
  symbol: string;
  exchange: string;
  currency: string;
  candles: Candle[];
  fullChartHref: string;
};

function sliceByRange(candles: Candle[], range: PublicChartRange): Candle[] {
  if (range === "MAX" || candles.length === 0) return candles;

  const days = RANGE_DAYS[range] ?? candles.length;
  const latestTime = new Date(`${candles[candles.length - 1].time}T00:00:00Z`).getTime();
  const cutoff = latestTime - days * 86_400_000;
  const startIndex = candles.findIndex(
    (candle) => new Date(`${candle.time}T00:00:00Z`).getTime() >= cutoff,
  );

  return startIndex >= 0 ? candles.slice(startIndex) : candles;
}

function computeNiceAxisTicks(min: number, max: number, targetCount: number): number[] {
  if (min === max) return [min];

  const range = max - min;
  const roughStep = range / Math.max(1, targetCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceNormalized * magnitude;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return ticks;
}

function formatAxisDate(time: string, range: PublicChartRange) {
  const date = new Date(`${time}T00:00:00Z`);
  if (range === "1M") {
    return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(date);
}

function formatTooltipDate(time: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${time}T00:00:00Z`),
  );
}

export function StockDetailChart({
  symbol,
  exchange,
  currency,
  candles,
  fullChartHref,
}: StockDetailChartProps) {
  const [range, setRange] = useState<PublicChartRange>("1Y");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const visibleCandles = useMemo(() => sliceByRange(candles, range), [candles, range]);

  const chart = useMemo(() => {
    if (visibleCandles.length < 2) return null;

    const closes = visibleCandles.map((candle) => candle.close);
    const rawMin = Math.min(...closes);
    const rawMax = Math.max(...closes);
    const yTicks = computeNiceAxisTicks(rawMin, rawMax, Y_AXIS_TICK_COUNT);
    const domainMin = yTicks[0];
    const domainMax = yTicks[yTicks.length - 1];
    const domainSpan = domainMax - domainMin || 1;
    const innerWidth = VIEWBOX_WIDTH - VIEWBOX_PADDING_X * 2;

    const yFor = (value: number) =>
      VIEWBOX_HEIGHT - ((value - domainMin) / domainSpan) * VIEWBOX_HEIGHT;

    const points = closes.map((close, index) => {
      const x = VIEWBOX_PADDING_X + (index / (closes.length - 1)) * innerWidth;
      return { x, y: yFor(close) };
    });

    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
    const areaPath = `${linePath} L${points[points.length - 1].x},${VIEWBOX_HEIGHT} L${points[0].x},${VIEWBOX_HEIGHT} Z`;
    const isPositive = closes[closes.length - 1] >= closes[0];

    const gridLines = yTicks.map((tick) => ({
      value: tick,
      y: yFor(tick),
      topPct: (yFor(tick) / VIEWBOX_HEIGHT) * 100,
    }));

    const xTickStep = Math.max(1, Math.floor((visibleCandles.length - 1) / (X_AXIS_TICK_COUNT - 1)));
    const xTicks: Array<{ time: string; leftPct: number }> = [];
    for (let index = 0; index < visibleCandles.length; index += xTickStep) {
      xTicks.push({
        time: visibleCandles[index].time,
        leftPct: (points[index].x / VIEWBOX_WIDTH) * 100,
      });
    }
    const lastIndex = visibleCandles.length - 1;
    const lastTick = { time: visibleCandles[lastIndex].time, leftPct: (points[lastIndex].x / VIEWBOX_WIDTH) * 100 };
    const priorTick = xTicks[xTicks.length - 1];
    const MIN_TICK_GAP_PCT = 8;
    if (!priorTick || lastTick.leftPct - priorTick.leftPct >= MIN_TICK_GAP_PCT) {
      xTicks.push(lastTick);
    } else {
      xTicks[xTicks.length - 1] = lastTick;
    }

    return { points, linePath, areaPath, isPositive, gridLines, xTicks };
  }, [visibleCandles]);

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!chart || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (chart.points.length - 1));
    setHoverIndex(index);
  };

  const hoveredCandle = hoverIndex !== null ? visibleCandles[hoverIndex] : null;
  const lineColorClass = chart?.isPositive ? "text-success" : "text-danger";

  return (
    <section>
    <StockSectionCard className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={cn(
                "h-7 shrink-0 cursor-pointer rounded px-2.5 text-xs font-medium transition-colors",
                range === option
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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

      {chart ? (
        <div className="flex h-72 w-full sm:h-96">
          <div className="relative min-w-0 flex-1">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="none"
              className={cn("h-[calc(100%-1.5rem)] w-full cursor-crosshair", lineColorClass)}
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
              role="img"
              aria-label={`${symbol} (${exchange}) price chart, ${range}`}
            >
              {chart.gridLines.map((line) => (
                <line
                  key={line.value}
                  x1={0}
                  x2={VIEWBOX_WIDTH}
                  y1={line.y}
                  y2={line.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  className="text-border"
                />
              ))}
              <path d={chart.areaPath} fill="currentColor" opacity="0.07" />
              <path d={chart.linePath} fill="none" stroke="currentColor" strokeWidth="2" />
              {hoverIndex !== null && chart.points[hoverIndex] && (
                <>
                  <line
                    x1={chart.points[hoverIndex].x}
                    x2={chart.points[hoverIndex].x}
                    y1={0}
                    y2={VIEWBOX_HEIGHT}
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={chart.points[hoverIndex].x}
                    cy={chart.points[hoverIndex].y}
                    r={4}
                    fill="currentColor"
                  />
                </>
              )}
            </svg>

            <div className="relative h-6 w-full">
              {chart.xTicks.map((tick) => (
                <span
                  key={tick.time}
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[0.6875rem] text-muted-foreground first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${tick.leftPct}%` }}
                >
                  {formatAxisDate(tick.time, range)}
                </span>
              ))}
            </div>

            {hoveredCandle && (
              <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                <div className="font-semibold text-foreground">
                  {formatCurrencyValue(hoveredCandle.close, currency)}
                </div>
                <div className="text-muted-foreground">{formatTooltipDate(hoveredCandle.time)}</div>
              </div>
            )}
          </div>

          <div className="relative w-16 shrink-0 sm:w-20">
            <div className="relative h-[calc(100%-1.5rem)] w-full">
              {chart.gridLines.map((line) => (
                <span
                  key={line.value}
                  className="absolute right-0 -translate-y-1/2 whitespace-nowrap pl-2 text-[0.6875rem] tabular-nums text-muted-foreground"
                  style={{ top: `${line.topPct}%` }}
                >
                  {formatCurrencyValue(line.value, currency)}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-72 flex-col items-center justify-center px-6 sm:h-96">
          <EmptyState
            size="compact"
            title="Price history unavailable"
            description={`Open the full Charts workspace to view ${symbol}'s complete history.`}
          />
        </div>
      )}
    </StockSectionCard>
    </section>
  );
}
