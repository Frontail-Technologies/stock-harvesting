"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScanBand } from "@/types/market";
import type { ScannerPriceSeries } from "../hooks/use-lightweight-candlestick-chart";
import { ScanBandPrimitive } from "../lib/scan-band-primitive";
import { getScannerChartTheme } from "../lib/scanner-chart-config";
import type { ScannerTheme } from "../types";

type ScanBandOverlayProps = {
  series: ScannerPriceSeries;
  bands: ScanBand[];
  candleTimes: string[];
  theme: ScannerTheme;
};

// Renders nothing itself — highlighted candles are painted by ScanBandPrimitive
// directly onto the chart's own canvas (see that file for why: this used to be
// a <div>-per-candle DOM overlay, which was laggy on drag and shimmered as it
// panned). This component's only job is resolving which candle times are
// highlighted and handing that + the current theme colors to the primitive.
export function ScanBandOverlay({ series, bands, candleTimes, theme }: ScanBandOverlayProps) {
  const [primitive] = useState(() => new ScanBandPrimitive());

  const candleIndexByTime = useMemo(
    () => new Map(candleTimes.map((time, index) => [time, index])),
    [candleTimes]
  );
  const candleTimeByDate = useMemo(
    () => new Map(candleTimes.map((time) => [toDateKey(time), time])),
    [candleTimes]
  );

  const highlightedTimes = useMemo(() => {
    const seen = new Set<string>();

    return bands.flatMap((scanBand) => {
      const rawTimes =
        scanBand.highlightTimes && scanBand.highlightTimes.length > 0
          ? scanBand.highlightTimes
          : candleTimes.filter(
              (time) => time >= scanBand.startTime && time <= scanBand.endTime
            );

      return rawTimes
        .map((time) => resolveCandleTime(time, candleIndexByTime, candleTimeByDate))
        .filter((time): time is string => Boolean(time))
        .filter((time) => {
          if (seen.has(time)) return false;
          seen.add(time);
          return true;
        });
    });
  }, [bands, candleIndexByTime, candleTimeByDate, candleTimes]);

  useEffect(() => {
    try {
      series.attachPrimitive(primitive);
    } catch {
      return;
    }

    return () => {
      try {
        series.detachPrimitive(primitive);
      } catch {
      }
    };
  }, [primitive, series]);

  useEffect(() => {
    const chartTheme = getScannerChartTheme(theme);
    primitive.setData(highlightedTimes, {
      fill: chartTheme.highlightFill,
      edge: chartTheme.highlightEdge,
    });
  }, [highlightedTimes, primitive, theme]);

  return null;
}

function resolveCandleTime(
  time: string,
  candleIndexByTime: Map<string, number>,
  candleTimeByDate: Map<string, string>
) {
  if (candleIndexByTime.has(time)) return time;
  return candleTimeByDate.get(toDateKey(time)) ?? null;
}

function toDateKey(time: string) {
  return time.slice(0, 10);
}
