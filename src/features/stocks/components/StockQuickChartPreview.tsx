"use client";

import { useMemo } from "react";
import type { Candle, Stock } from "@/types/market";
import { useCurrency } from "@/features/currency";
import { useCandles } from "@/features/market-data";
import { formatCompactVolume } from "@/utils/formatters";
import { Spinner } from "@/components/ui/spinner";

type StockQuickChartPreviewProps = {
  stock: Stock;
  x: number;
  rowTop: number;
  rowBottom: number;
};

const PREVIEW_WIDTH = 320;
const PREVIEW_ESTIMATED_HEIGHT = 270;
const PREVIEW_GAP = 8;
const VIEWPORT_PADDING = 12;

export function StockQuickChartPreview({
  stock,
  x,
  rowTop,
  rowBottom,
}: StockQuickChartPreviewProps) {
  const { formatStockCurrency } = useCurrency();
  const candleQuery = useCandles({
    symbol: stock.symbol,
    timeframe: "1W",
    exchange: stock.exchange,
  });
  const candles = useMemo(() => candleQuery.data ?? [], [candleQuery.data]);
  const sparkline = useMemo(() => buildSparkline(candles.slice(-48)), [candles]);
  const displayPrice = stock.hasMarketData ? stock.close : undefined;
  const displayVolume = stock.hasMarketData ? stock.volume : undefined;
  const change = stock.hasMarketData && stock.changePct !== null ? stock.changePct : 0;
  const positive = change >= 0;
  const viewportWidth =
    typeof document === "undefined"
      ? PREVIEW_WIDTH
      : document.documentElement.clientWidth;
  const viewportHeight =
    typeof window === "undefined" ? PREVIEW_ESTIMATED_HEIGHT : window.innerHeight;
  const showBelow =
    rowTop < PREVIEW_ESTIMATED_HEIGHT + VIEWPORT_PADDING ||
    viewportHeight - rowBottom > PREVIEW_ESTIMATED_HEIGHT + PREVIEW_GAP;
  const preferredLeft = x + 18;
  const anchorFromRight =
    preferredLeft + PREVIEW_WIDTH > viewportWidth - VIEWPORT_PADDING;
  const left = anchorFromRight
    ? undefined
    : Math.max(preferredLeft, VIEWPORT_PADDING);
  const right = anchorFromRight ? VIEWPORT_PADDING : undefined;
  const top = showBelow
    ? Math.min(rowBottom + PREVIEW_GAP, viewportHeight - VIEWPORT_PADDING)
    : Math.max(rowTop - PREVIEW_GAP, VIEWPORT_PADDING);

  return (
    <div
      className="pointer-events-none fixed z-70 w-80 max-w-[calc(100vw-24px)] rounded-lg border border-border bg-popover/95 p-3 text-popover-foreground shadow-2xl backdrop-blur"
      style={{
        left,
        right,
        top,
        transform: showBelow ? undefined : "translateY(-100%)",
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {stock.symbol}
          </div>
          <div className="truncate text-xs text-muted-foreground">{stock.name}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">
            {displayPrice !== undefined
              ? formatStockCurrency(displayPrice, stock.exchange)
              : "-"}
          </div>
          {stock.hasMarketData ? (
            <div className={positive ? "text-xs text-success" : "text-xs text-danger"}>
              {positive ? "+" : ""}
              {change.toFixed(2)}%
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No market data</div>
          )}
        </div>
      </div>

      <div className="h-28 rounded-md border border-border bg-background/60 p-2">
        {candleQuery.isPending ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : sparkline ? (
          <svg viewBox="0 0 280 88" className="h-full w-full" role="img">
            <path
              d={sparkline.areaPath}
              className={positive ? "fill-success/10" : "fill-danger/10"}
            />
            <polyline
              points={sparkline.points}
              fill="none"
              stroke={positive ? "rgb(34 197 94)" : "rgb(239 68 68)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No chart data
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Exchange" value={stock.exchange} />
        <Metric
          label="Volume"
          value={displayVolume !== undefined ? formatCompactVolume(displayVolume) : "-"}
        />
        <Metric label="Bars" value={candles.length ? `${candles.length}` : "-"} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-medium text-foreground">{value}</div>
    </div>
  );
}

function buildSparkline(candles: Candle[]) {
  if (candles.length < 2) return null;

  const width = 280;
  const height = 88;
  const closes = candles.map((candle) => candle.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = closes.map((close, index) => {
    const x = (index / (closes.length - 1)) * width;
    const y = height - ((close - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPath = `M 0 ${height} L ${points.join(" L ")} L ${width} ${height} Z`;

  return {
    points: points.join(" "),
    areaPath,
  };
}
