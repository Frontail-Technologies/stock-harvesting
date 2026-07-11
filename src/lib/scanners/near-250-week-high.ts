import type { Candle } from "@/types/market";

const LOOKBACK_WEEKS = 250;
const THRESHOLD_MULTIPLIER = 0.85;
const TARGET2_MULTIPLIER = 1.15;

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

export type TradeLevels = {
  entry: number;
  stopLoss: number;
  target1: number;
  target2: number;
  risk: number;
  rewardToTarget1: number;
  riskRewardToTarget1: number | null;
};

export function calculateNear250WeekHighSignal(
  symbol: string,
  candles: Candle[]
): NearHighSignal | null {
  if (candles.length < LOOKBACK_WEEKS) return null;

  const lookback = candles.slice(-LOOKBACK_WEEKS);
  const highestHigh250 = Math.max(...lookback.map((c) => c.high));
  const threshold85 = highestHigh250 * THRESHOLD_MULTIPLIER;

  const latest = candles[candles.length - 1];
  const currentClose = latest.close;
  const matched = currentClose > threshold85;

  const currentVsHighPct = (currentClose / highestHigh250) * 100;
  const distanceAboveThresholdPct = ((currentClose - threshold85) / threshold85) * 100;

  const reason = matched
    ? `Weekly close ₹${currentClose.toFixed(2)} is ${distanceAboveThresholdPct.toFixed(
        1
      )}% above the 85% threshold (₹${threshold85.toFixed(
        2
      )}) of the 250-week high (₹${highestHigh250.toFixed(2)}).`
    : `Weekly close ₹${currentClose.toFixed(2)} is still ${Math.abs(
        distanceAboveThresholdPct
      ).toFixed(1)}% below the 85% threshold (₹${threshold85.toFixed(
        2
      )}) of the 250-week high (₹${highestHigh250.toFixed(2)}).`;

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

// Finds the start time of the first candle in the most recent contiguous run
// where close stayed above `threshold` — i.e. exactly where the condition
// became (and has stayed) true. This is for VISUAL highlighting only; it must
// never be confused with the full 250-week lookback used to *compute*
// threshold85/highestHigh250 in calculateNear250WeekHighSignal — that
// lookback is for calculation, not for what gets highlighted on the chart.
export function findRecentActiveWindowStart(candles: Candle[], threshold: number): string | null {
  if (candles.length === 0) return null;

  let index = candles.length - 1;
  while (index > 0 && candles[index - 1].close > threshold) {
    index--;
  }

  return candles[index].time;
}

export function calculateTradeLevels(signal: NearHighSignal): TradeLevels {
  const entry = signal.currentClose;
  const stopLoss = signal.threshold85;
  const target1 = signal.highestHigh250;
  const target2 = signal.highestHigh250 * TARGET2_MULTIPLIER;

  const risk = entry - stopLoss;
  const rewardToTarget1 = target1 - entry;
  const riskRewardToTarget1 = risk > 0 ? rewardToTarget1 / risk : null;

  return {
    entry,
    stopLoss,
    target1,
    target2,
    risk,
    rewardToTarget1,
    riskRewardToTarget1,
  };
}
