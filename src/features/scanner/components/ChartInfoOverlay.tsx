"use client";

import type { Candle, Stock } from "@/types/market";
import { useCurrency } from "@/features/currency";
import {
  changeColorClass,
  formatCompactVolume,
  formatSignedChange,
} from "@/utils/formatters";
import { TIMEFRAME_LABEL, type Timeframe } from "../types";

type ChartInfoOverlayProps = {
  stock: Stock;
  timeframe: Timeframe;
  candles: Candle[];
  latestSignalActive: boolean;
};

export function ChartInfoOverlay({
  stock,
  timeframe,
  candles,
  latestSignalActive,
}: ChartInfoOverlayProps) {
  const { formatStockCurrency } = useCurrency();
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;

  if (!last) return null;

  const change = last.close - prev.close;
  const changePct = (change / prev.close) * 100;
  const { text: changeText, isPositive } = formatSignedChange(change, changePct);

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-30 max-w-[calc(100%-1rem)] select-none sm:left-3">
      <div className="pointer-events-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:gap-2">
        <span className="text-xs font-semibold text-foreground sm:text-sm">{stock.symbol}</span>
        <span className="text-[0.6875rem] text-muted-foreground sm:text-xs">
          {TIMEFRAME_LABEL[timeframe]} - {stock.exchange}
        </span>
        {latestSignalActive && (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary">
            Signal
          </span>
        )}
      </div>

      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.6875rem] sm:mt-1 sm:gap-x-3 sm:text-xs">
        <span className="text-muted-foreground">
          O <span className="text-foreground">{formatStockCurrency(last.open, stock.exchange)}</span>
        </span>
        <span className="text-muted-foreground">
          H <span className="text-foreground">{formatStockCurrency(last.high, stock.exchange)}</span>
        </span>
        <span className="text-muted-foreground">
          L <span className="text-foreground">{formatStockCurrency(last.low, stock.exchange)}</span>
        </span>
        <span className="text-muted-foreground">
          C <span className="text-foreground">{formatStockCurrency(last.close, stock.exchange)}</span>
        </span>
        <span className={changeColorClass(isPositive)}>{changeText}</span>
        <span className="text-muted-foreground">
          V <span className="text-foreground">{formatCompactVolume(last.volume)}</span>
        </span>
      </div>
    </div>
  );
}
