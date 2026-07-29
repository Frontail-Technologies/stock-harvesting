import type {
  BarData,
  CandlestickData,
  HistogramData,
  LineData,
  WhitespaceData,
} from "lightweight-charts";
import type { Candle } from "@/types/market";
import { generateFutureWhitespaceBars } from "@/utils/chart-whitespace";
import type { ScannerRangeFilter, ScannerTheme } from "../types";
import {
  SCANNER_CHART_COLORS,
  SCANNER_CHART_LAYOUT,
  getScannerChartTheme,
} from "./scanner-chart-config";

export type ScannerChartData = {
  candleRenderData: Array<CandlestickData | WhitespaceData>;
  hollowCandleRenderData: Array<CandlestickData | WhitespaceData>;
  barRenderData: Array<BarData | WhitespaceData>;
  hlcBarRenderData: Array<BarData | WhitespaceData>;
  lineRenderData: Array<LineData | WhitespaceData>;
  volumeRenderData: Array<HistogramData | WhitespaceData>;
  priceRange: {
    from: number;
    to: number;
  };
  visibleLogicalRange: {
    from: number;
    to: number;
  };
};

const RANGE_FILTER_DAYS: Record<Exclude<ScannerRangeFilter, "ALL">, number> = {
  "1D": 1,
  "2D": 2,
  "3D": 3,
  "5D": 5,
  "10D": 10,
  "1M": 30,
  "2M": 60,
  "3M": 90,
  "4M": 120,
  "6M": 182,
  "9M": 273,
  "1Y": 365,
  "2Y": 730,
  "3Y": 1095,
  "5Y": 1825,
  "8Y": 2920,
};

export function buildScannerChartData(
  candles: Candle[],
  rangeFilter: ScannerRangeFilter = "ALL",
  theme: ScannerTheme = "dark"
): ScannerChartData {
  const chartTheme = getScannerChartTheme(theme);

  if (candles.length === 0) {
    return {
      candleRenderData: [],
      hollowCandleRenderData: [],
      barRenderData: [],
      hlcBarRenderData: [],
      lineRenderData: [],
      volumeRenderData: [],
      priceRange: {
        from: 0,
        to: 1,
      },
      visibleLogicalRange: {
        from: 0,
        to: 1,
      },
    };
  }

  const lastRealCandle = candles[candles.length - 1];
  const futureWhitespace = generateFutureWhitespaceBars(
    lastRealCandle.time,
    SCANNER_CHART_LAYOUT.futureWhitespaceBars,
    "1W"
  );

  const candleRenderData = [
    ...candles.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })),
    ...futureWhitespace,
  ];

  const hollowCandleRenderData = [
    ...candles.map((candle) => {
      const isUp = candle.close >= candle.open;

      return {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        color: isUp ? "rgba(8, 13, 18, 0)" : SCANNER_CHART_COLORS.red,
        borderColor: isUp ? SCANNER_CHART_COLORS.green : SCANNER_CHART_COLORS.red,
        wickColor: isUp ? SCANNER_CHART_COLORS.green : SCANNER_CHART_COLORS.red,
      };
    }),
    ...futureWhitespace,
  ];

  const barRenderData = [
    ...candles.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })),
    ...futureWhitespace,
  ];

  const hlcBarRenderData = [
    ...candles.map((candle, index) => ({
      time: candle.time,
      open: candles[index - 1]?.close ?? candle.close,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })),
    ...futureWhitespace,
  ];

  const lineRenderData = [
    ...candles.map((candle) => ({
      time: candle.time,
      value: candle.close,
    })),
    ...futureWhitespace,
  ];

  const volumeRenderData = [
    ...candles.map((candle) => ({
      time: candle.time,
      value: candle.volume,
      color:
        candle.close >= candle.open
          ? chartTheme.volumeGreen
          : chartTheme.volumeRed,
    })),
    ...futureWhitespace,
  ];

  const totalBars = candleRenderData.length;
  const visibleLogicalRange = getVisibleLogicalRange(
    candles,
    totalBars,
    futureWhitespace.length,
    rangeFilter
  );
  const low = Math.min(...candles.map((candle) => candle.low));
  const high = Math.max(...candles.map((candle) => candle.high));
  const pricePadding = Math.max((high - low) * 0.08, high * 0.01);

  return {
    candleRenderData,
    hollowCandleRenderData,
    barRenderData,
    hlcBarRenderData,
    lineRenderData,
    volumeRenderData,
    priceRange: {
      from: Math.max(0, low - pricePadding),
      to: high + pricePadding,
    },
    visibleLogicalRange,
  };
}

function getVisibleLogicalRange(
  candles: Candle[],
  totalBars: number,
  futureWhitespaceBars: number,
  rangeFilter: ScannerRangeFilter
) {
  if (rangeFilter === "ALL") {
    return {
      from: 0,
      to: totalBars - 1,
    };
  }

  const latestCandleTime = new Date(`${candles[candles.length - 1].time}T00:00:00Z`).getTime();
  const cutoffTime = latestCandleTime - RANGE_FILTER_DAYS[rangeFilter] * 86_400_000;
  const firstVisibleCandleIndex = candles.findIndex((candle) => {
    const candleTime = new Date(`${candle.time}T00:00:00Z`).getTime();
    return candleTime >= cutoffTime;
  });
  const from = firstVisibleCandleIndex >= 0 ? firstVisibleCandleIndex : candles.length - 1;
  const realVisibleBars = candles.length - from;
  const futurePadding = Math.min(
    futureWhitespaceBars,
    Math.max(2, Math.round(realVisibleBars * 0.12))
  );

  return {
    from: Math.max(0, from),
    to: Math.min(totalBars - 1, candles.length - 1 + futurePadding),
  };
}
