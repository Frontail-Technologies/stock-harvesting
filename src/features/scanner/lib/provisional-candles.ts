import type { CurrentDayDelayedCandle } from "@/features/market-data";
import type { Candle } from "@/types/market";
import type { Timeframe } from "../types";

export function getIsoWeekEndingFriday(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const isoDay = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (isoDay - 1));
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  return friday.toISOString().slice(0, 10);
}

function getMonthStart(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

function toDisplayCandle(provisional: CurrentDayDelayedCandle, time: string): Candle {
  return {
    time,
    open: provisional.open,
    high: provisional.high,
    low: provisional.low,
    close: provisional.close,
    volume: provisional.volume ?? 0,
  };
}

export function mergeProvisionalCandleForDisplay(
  candles: Candle[],
  provisional: CurrentDayDelayedCandle | null,
  timeframe: Timeframe
) {
  if (!provisional) return candles;

  if (timeframe === "1D") {
    const last = candles[candles.length - 1];
    if (last && last.time >= provisional.time) return candles;
    return [...candles, toDisplayCandle(provisional, provisional.time)];
  }

  if (timeframe === "1W") {
    const bucketLabel = getIsoWeekEndingFriday(provisional.time);
    // Only today's Friday session (the day that actually completes this
    // week) is eligible to appear here - Mon-Thu must never show under the
    // Friday label, since that week genuinely has no candle yet (matches
    // the completed-week-only rule already enforced for stored 1W data).
    if (provisional.time !== bucketLabel) return candles;
    const last = candles[candles.length - 1];
    if (last && last.time >= bucketLabel) return candles;
    return [...candles, toDisplayCandle(provisional, bucketLabel)];
  }

  if (timeframe === "1M") {
    const bucketLabel = getMonthStart(provisional.time);
    const existingIndex = candles.findIndex((candle) => candle.time === bucketLabel);
    if (existingIndex === -1) return [...candles, toDisplayCandle(provisional, bucketLabel)];

    return candles.map((candle, index) =>
      index === existingIndex
        ? {
            ...candle,
            high: Math.max(candle.high, provisional.high),
            low: Math.min(candle.low, provisional.low),
            close: provisional.close,
            volume: candle.volume + (provisional.volume ?? 0),
          }
        : candle
    );
  }

  return candles;
}
