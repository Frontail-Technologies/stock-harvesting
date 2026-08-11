import type { Candle, ScanBand } from "@/types/market";
import type { Timeframe } from "../types";

export function mapScanBandsToDisplayTimeframe(
  bands: ScanBand[],
  displayCandles: Candle[],
  displayTimeframe: Timeframe
) {
  if (displayTimeframe === "1W") return bands;
  if (bands.length === 0 || displayCandles.length === 0) return bands;

  return bands
    .map((band) => {
      const sourceHighlightTimes =
        band.highlightTimes && band.highlightTimes.length > 0
          ? band.highlightTimes
          : [band.startTime, band.endTime];
      const sourceKeys = new Set(
        sourceHighlightTimes.map((time) => getDisplayBucketKey(time, displayTimeframe))
      );
      const highlightTimes = displayCandles
        .filter((candle) => sourceKeys.has(getDisplayBucketKey(candle.time, displayTimeframe)))
        .map((candle) => candle.time);

      return {
        ...band,
        startTime: highlightTimes[0] ?? band.startTime,
        endTime: highlightTimes[highlightTimes.length - 1] ?? band.endTime,
        highlightTimes,
      };
    })
    .filter((band) => (band.highlightTimes?.length ?? 0) > 0);
}

function getDisplayBucketKey(time: string, displayTimeframe: Timeframe) {
  if (displayTimeframe === "1D") return getIsoWeekKey(time);
  if (displayTimeframe === "1M") return time.slice(0, 7);
  return time.slice(0, 10);
}

function getIsoWeekKey(time: string) {
  const date = new Date(`${time.slice(0, 10)}T00:00:00.000Z`);
  const value = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((value.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
