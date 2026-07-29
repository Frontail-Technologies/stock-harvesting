import type { Candle, ScanBand } from "@/types/market";
import { getEffectiveScannerLookbackWeeks } from "../constants/lookback-multipliers";
import type { Timeframe } from "../types";

const THRESHOLD_MULTIPLIER = 0.85;
const RULE_KEY = "near_250_week_high";

type BuildNear250WeekHighScanBandInput = {
  symbol: string;
  exchange: string;
  timeframe: Timeframe;
  candles: Candle[];
  lookbackWeeks: number;
};

export function buildNear250WeekHighScanBand({
  symbol,
  exchange,
  timeframe,
  candles,
  lookbackWeeks,
}: BuildNear250WeekHighScanBandInput): ScanBand | null {
  if (timeframe !== "1W") return null;

  const sortedCandles = [...candles].sort((a, b) => a.time.localeCompare(b.time));
  const effectiveLookbackWeeks = getEffectiveScannerLookbackWeeks(
    lookbackWeeks,
    sortedCandles.length
  );
  if (!effectiveLookbackWeeks) return null;

  const highlightTimes = getRollingHighlightTimes(sortedCandles, effectiveLookbackWeeks);
  if (highlightTimes.length === 0) return null;

  const latestWindow = sortedCandles.slice(-effectiveLookbackWeeks);
  const latest = latestWindow[latestWindow.length - 1];
  const highestClose = Math.max(...latestWindow.map((candle) => candle.close));
  const threshold85 = highestClose * THRESHOLD_MULTIPLIER;
  const latestMatched = latest.close >= threshold85;

  return {
    id: `${RULE_KEY}:${exchange}:${symbol}:${effectiveLookbackWeeks}:${latest.time}:local`,
    startTime: highlightTimes[0],
    endTime: latest.time,
    label: RULE_KEY,
    latestMatched,
    highlightTimes,
  };
}

function getRollingHighlightTimes(candles: Candle[], lookbackWeeks: number) {
  const highlightTimes: string[] = [];

  for (let index = lookbackWeeks - 1; index < candles.length; index++) {
    const window = candles.slice(index - lookbackWeeks + 1, index + 1);
    const highestClose = Math.max(...window.map((candle) => candle.close));
    const threshold = highestClose * THRESHOLD_MULTIPLIER;
    const candle = candles[index];

    if (candle.close >= threshold) {
      highlightTimes.push(candle.time);
    }
  }

  return highlightTimes;
}
