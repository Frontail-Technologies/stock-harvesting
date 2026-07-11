"use client";

import type { Stock } from "@/types/market";
import { mockWeeklyCandles } from "@/lib/mock-candles";
import {
  changeColorClass,
  formatCompactVolume,
  formatCurrency,
  formatSignedChange,
} from "@/lib/formatters";
import { TIMEFRAME_LABEL, type Timeframe } from "@/components/scanner/TimeframeSelector";

type ChartInfoOverlayProps = {
  stock: Stock;
  timeframe: Timeframe;
};

export function ChartInfoOverlay({ stock, timeframe }: ChartInfoOverlayProps) {
  const last = mockWeeklyCandles[mockWeeklyCandles.length - 1];
  const prev = mockWeeklyCandles[mockWeeklyCandles.length - 2];
  const change = last.close - prev.close;
  const changePct = (change / prev.close) * 100;
  const { text: changeText, isPositive } = formatSignedChange(change, changePct);

  return (
    <div className="pointer-events-none absolute left-3 top-2 z-20 select-none">
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{stock.symbol}</span>
        <span className="text-xs text-muted-foreground">
          {TIMEFRAME_LABEL[timeframe]} · {stock.exchange}
        </span>
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          Scan link
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
        <span className="text-muted-foreground">
          O <span className="text-foreground">{formatCurrency(last.open)}</span>
        </span>
        <span className="text-muted-foreground">
          H <span className="text-foreground">{formatCurrency(last.high)}</span>
        </span>
        <span className="text-muted-foreground">
          L <span className="text-foreground">{formatCurrency(last.low)}</span>
        </span>
        <span className="text-muted-foreground">
          C <span className="text-foreground">{formatCurrency(last.close)}</span>
        </span>
        <span className={changeColorClass(isPositive)}>{changeText}</span>
        <span className="text-muted-foreground">
          V <span className="text-foreground">{formatCompactVolume(last.volume)}</span>
        </span>
      </div>
    </div>
  );
}
