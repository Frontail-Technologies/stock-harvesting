"use client";

import type { Candle, Stock } from "@/types/market";
import { useCurrency } from "@/features/currency";
import {
  changeColorClass,
  formatCompactVolume,
  formatSignedChange,
} from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { TIMEFRAME_LABEL, type Timeframe } from "../types";

type ChartInfoOverlayProps = {
  stock: Stock;
  timeframe: Timeframe;
  candles: Candle[];
  activeCandle?: Candle | null;
  latestSignalActive: boolean;
};

export function ChartInfoOverlay({
  stock,
  timeframe,
  candles,
  activeCandle,
  latestSignalActive,
}: ChartInfoOverlayProps) {
  const { formatStockCurrency } = useCurrency();
  const activeIndex = activeCandle
    ? candles.findIndex((candle) => candle.time === activeCandle.time)
    : candles.length - 1;
  const last = activeIndex >= 0 ? candles[activeIndex] : candles[candles.length - 1];
  const prev = candles[Math.max(0, activeIndex - 1)] ?? last;

  if (!last) return null;

  const change = last.close - prev.close;
  const changePct = (change / prev.close) * 100;
  const { text: changeText, isPositive } = formatSignedChange(change, changePct);

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-30 max-w-[calc(100%-4.5rem)] select-none sm:left-3">
      {/* Primary: symbol. Secondary: timeframe/exchange, visibly dimmer. */}
      <div className="pointer-events-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:gap-2">
        <span className="text-sm font-bold tracking-tight text-foreground sm:text-base">
          {stock.symbol}
        </span>
        <span className="text-[0.6875rem] text-muted-foreground/80 sm:text-xs">
          {TIMEFRAME_LABEL[timeframe]} · {stock.exchange}
        </span>
        {latestSignalActive && (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary">
            Signal
          </span>
        )}
      </div>

      {/* Primary: last price + change, the largest numbers in the block. */}
      <div className="pointer-events-auto mt-0.5 flex items-baseline gap-2 tabular-nums">
        <span className="text-base font-bold text-foreground sm:text-lg">
          {formatStockCurrency(last.close, stock.exchange)}
        </span>
        <span className={cn("text-xs font-semibold sm:text-sm", changeColorClass(isPositive))}>
          {changeText}
        </span>
      </div>

      {/* Tertiary: OHLC + volume, technical metadata — smallest and most muted. */}
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.625rem] tabular-nums text-muted-foreground/70 sm:gap-x-3 sm:text-[0.6875rem]">
        <span>
          O <span className="text-muted-foreground">{formatStockCurrency(last.open, stock.exchange)}</span>
        </span>
        <span>
          H <span className="text-muted-foreground">{formatStockCurrency(last.high, stock.exchange)}</span>
        </span>
        <span>
          L <span className="text-muted-foreground">{formatStockCurrency(last.low, stock.exchange)}</span>
        </span>
        <span>
          C <span className="text-muted-foreground">{formatStockCurrency(last.close, stock.exchange)}</span>
        </span>
        <span>
          V <span className="text-muted-foreground">{formatCompactVolume(last.volume)}</span>
        </span>
      </div>
    </div>
  );
}
