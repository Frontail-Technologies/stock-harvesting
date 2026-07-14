import type { Candle } from "@/types/market";

const LOOKBACK_WEEKS = 250;
const THRESHOLD_MULTIPLIER = 0.85;

export type NearHighSignal = {
  matched: boolean;
  symbol: string;
  timeframe: "1W";
  currentClose: number;
  highestHigh250: number;
  threshold85: number;
  currentVsHighPct: number;
  distanceAboveThresholdPct: number;
  lookbackWeeks: number;
  signalTime: string;
  reason: string;
};

export function calculateNear250WeekHighSignal(
  symbol: string,
  candles: Candle[]
): NearHighSignal | null {
  if (candles.length < LOOKBACK_WEEKS) return null;

  const lookback = candles.slice(-LOOKBACK_WEEKS);
  const highestHigh250 = Math.max(...lookback.map((candle) => candle.high));
  const threshold85 = highestHigh250 * THRESHOLD_MULTIPLIER;

  const latest = candles[candles.length - 1];
  const currentClose = latest.close;
  const matched = currentClose > threshold85;

  const currentVsHighPct = (currentClose / highestHigh250) * 100;
  const distanceAboveThresholdPct = ((currentClose - threshold85) / threshold85) * 100;

  const reason = matched
    ? `Weekly close Rs ${currentClose.toFixed(2)} is ${distanceAboveThresholdPct.toFixed(
        1
      )}% above the 85% threshold (Rs ${threshold85.toFixed(
        2
      )}) of the 250-week high (Rs ${highestHigh250.toFixed(2)}).`
    : `Weekly close Rs ${currentClose.toFixed(2)} is still ${Math.abs(
        distanceAboveThresholdPct
      ).toFixed(1)}% below the 85% threshold (Rs ${threshold85.toFixed(
        2
      )}) of the 250-week high (Rs ${highestHigh250.toFixed(2)}).`;

  return {
    matched,
    symbol,
    timeframe: "1W",
    currentClose,
    highestHigh250,
    threshold85,
    currentVsHighPct,
    distanceAboveThresholdPct,
    lookbackWeeks: LOOKBACK_WEEKS,
    signalTime: latest.time,
    reason,
  };
}

export function findRecentActiveWindowStart(
  candles: Candle[],
  threshold: number
): string | null {
  if (candles.length === 0) return null;

  let index = candles.length - 1;
  while (index > 0 && candles[index - 1].close > threshold) {
    index--;
  }

  return candles[index].time;
}
