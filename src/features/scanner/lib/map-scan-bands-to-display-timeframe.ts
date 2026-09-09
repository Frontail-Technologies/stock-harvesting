import type { Candle, ScanBand } from "@/types/market";
import type { Timeframe } from "../types";

export function mapScanBandsToDisplayTimeframe(
  bands: ScanBand[],
  displayCandles: Candle[],
  displayTimeframe: Timeframe
) {
  if (bands.length === 0 || displayCandles.length === 0) return bands;

  // The backend evaluator never scores the current, still-forming ISO week
  // (excludeIncompleteTradingWeek trims it before evaluation runs) - so no
  // band's highlightTimes can ever contain a time in that week, on its own.
  // The latest real candle's week is that current week.
  const currentWeekKey = getIsoWeekKey(displayCandles[displayCandles.length - 1].time);

  if (displayTimeframe === "1W") {
    // The rendered weekly candles already include one bar for the current,
    // still-forming week (aggregateWeeklyCandles produces it from whatever
    // daily bars exist so far - it's a real, already-displayed candle, not
    // something invented here). The evaluator never scores that week
    // (excludeIncompleteTradingWeek, unchanged), so a band's highlightTimes
    // can only ever reach as far as the latest COMPLETED week
    // (band.endTime). If that latest completed week was a confirmed PASS,
    // carry it forward onto that one current-week candle only - never onto
    // anything past it, since no later real weekly candle can exist yet.
    // A FAIL (or unknown) leaves the current week untouched, same as today.
    return bands.map((band) => {
      if (band.latestMatched !== true) return band;

      const latestCompletedWeekKey = getIsoWeekKey(band.endTime);
      if (latestCompletedWeekKey === currentWeekKey) return band; // already the latest completed week itself - nothing newer to extend onto

      const latestDisplayCandle = displayCandles[displayCandles.length - 1];
      const highlightTimes =
        band.highlightTimes && band.highlightTimes.length > 0 ? [...band.highlightTimes] : [band.endTime];
      if (!highlightTimes.includes(latestDisplayCandle.time)) {
        highlightTimes.push(latestDisplayCandle.time);
      }

      return {
        ...band,
        endTime: latestDisplayCandle.time,
        highlightTimes,
      };
    });
  }

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

      // Carry a confirmed PASS on the latest COMPLETED week forward onto the
      // real daily candles of the current, still-forming week. Without this,
      // the highlight always stops at the end of the last completed week -
      // 1 to 5 real trading days short of the chart's actual latest candle -
      // even though that latest completed week already confirmed a PASS.
      // Daily display only: a monthly candle doesn't correspond to a single
      // ISO week, so this concept doesn't translate there and 1M is left as
      // it already was. Only ever appends candle times that are already in
      // displayCandles - it can never invent a future timestamp - and it
      // never fires when the latest completed week didn't pass
      // (band.latestMatched is false/undefined), so a FAIL correctly leaves
      // the current week unhighlighted.
      if (displayTimeframe === "1D" && band.latestMatched === true) {
        const latestCompletedWeekKey = getIsoWeekKey(band.endTime);
        if (latestCompletedWeekKey !== currentWeekKey) {
          const alreadyHighlighted = new Set(highlightTimes);
          for (const candle of displayCandles) {
            if (getIsoWeekKey(candle.time) !== currentWeekKey) continue;
            if (alreadyHighlighted.has(candle.time)) continue;
            highlightTimes.push(candle.time);
          }
        }
      }

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
