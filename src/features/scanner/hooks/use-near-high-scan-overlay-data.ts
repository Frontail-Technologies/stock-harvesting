"use client";

import { useMemo } from "react";
import type { Candle, ScanBand } from "@/types/market";
import {
  calculateNear250WeekHighSignal,
  findRecentActiveWindowStart,
} from "../lib/scanners/near-250-week-high";

type UseNearHighScanOverlayDataArgs = {
  symbol: string;
  candles: Candle[];
  baseScanBands: ScanBand[];
};

export function useNearHighScanOverlayData({
  symbol,
  candles,
  baseScanBands,
}: UseNearHighScanOverlayDataArgs) {
  const nearHighSignal = useMemo(
    () => calculateNear250WeekHighSignal(symbol, candles),
    [symbol, candles]
  );

  const activeWindowStartTime = useMemo(() => {
    if (!nearHighSignal?.matched) return null;
    return findRecentActiveWindowStart(candles, nearHighSignal.threshold85);
  }, [candles, nearHighSignal]);

  const activeHighlightTimes = useMemo(() => {
    if (!nearHighSignal?.matched || !activeWindowStartTime) return [];

    const startIndex = candles.findIndex(
      (candle) => candle.time === activeWindowStartTime
    );
    const endIndex = candles.findIndex(
      (candle) => candle.time === nearHighSignal.signalTime
    );

    if (startIndex === -1 || endIndex === -1) return [];

    return candles
      .slice(startIndex, endIndex + 1)
      .filter((candle) => candle.close > nearHighSignal.threshold85)
      .map((candle) => candle.time);
  }, [activeWindowStartTime, candles, nearHighSignal]);

  const scanBands = useMemo<ScanBand[]>(() => {
    if (nearHighSignal?.matched && activeWindowStartTime) {
      return [
        ...baseScanBands,
        {
          id: "near-250-high-active",
          startTime: activeWindowStartTime,
          endTime: nearHighSignal.signalTime,
          label: "Scan Match",
          highlightTimes: activeHighlightTimes,
        },
      ];
    }

    return baseScanBands;
  }, [activeHighlightTimes, activeWindowStartTime, baseScanBands, nearHighSignal]);

  return {
    nearHighSignal,
    activeWindowStartTime,
    scanBands,
  };
}
