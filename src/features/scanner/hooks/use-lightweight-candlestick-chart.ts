"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  PriceScaleMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import {
  SCANNER_CHART_LAYOUT,
  createScannerBarSeriesOptions,
  createScannerCandleSeriesOptions,
  createScannerChartOptions,
  createScannerHlcBarSeriesOptions,
  createScannerHollowCandleSeriesOptions,
  createScannerLineSeriesOptions,
  createScannerLineWithMarkersSeriesOptions,
  createScannerSeriesOptions,
  createScannerStepLineSeriesOptions,
  scannerCrosshairOptions,
  scannerVolumeSeriesOptions,
  type ScannerPriceFormatter,
} from "../lib/scanner-chart-config";
import type { ScannerChartData } from "../lib/build-scanner-chart-data";
import type { ScannerChartType, ScannerTheme } from "../types";

export type ScannerPriceSeries =
  | ISeriesApi<"Candlestick">
  | ISeriesApi<"Bar">
  | ISeriesApi<"Line">;

export type ScannerChartHandles = {
  chart: IChartApi;
  series: ScannerPriceSeries;
};

function getInitialScannerTheme(fallbackTheme: ScannerTheme): ScannerTheme {
  if (typeof document === "undefined") return fallbackTheme;
  return document.documentElement.classList.contains("dark") ? "dark" : fallbackTheme;
}

type UseLightweightCandlestickChartArgs = {
  data: ScannerChartData;
  chartType: ScannerChartType;
  crosshairActive: boolean;
  priceFormatter: ScannerPriceFormatter;
  theme: ScannerTheme;
  autoScale: boolean;
  percentageScale: boolean;
  // Identifies "this is logically a different chart" (symbol/timeframe/range
  // filter changed) as opposed to "the same chart's data was patched" (a
  // live tick updating/appending a candle). Only the former should snap the
  // visible range back to the default — otherwise every live price update
  // yanks the user back to the latest bar mid-scroll.
  viewResetKey: string;
};

export function useLightweightCandlestickChart({
  data,
  chartType,
  crosshairActive,
  priceFormatter,
  theme,
  autoScale,
  percentageScale,
  viewResetKey,
}: UseLightweightCandlestickChartArgs) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ScannerPriceSeries | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const initialChartTypeRef = useRef(chartType);
  const latestDataRef = useRef(data);
  const latestPriceFormatterRef = useRef(priceFormatter);
  const latestThemeRef = useRef(theme);
  const latestCrosshairRef = useRef(crosshairActive);
  const latestAutoScaleRef = useRef(autoScale);
  const latestPercentageScaleRef = useRef(percentageScale);
  const appliedChartTypeRef = useRef<ScannerChartType | null>(null);
  const appliedPriceFormatterRef = useRef<ScannerPriceFormatter | null>(null);
  const appliedThemeRef = useRef<ScannerTheme | null>(null);
  const appliedCrosshairRef = useRef<boolean | null>(null);
  const appliedAutoScaleRef = useRef<boolean | null>(null);
  const appliedPercentageScaleRef = useRef<boolean | null>(null);
  const appliedViewResetKeyRef = useRef<string | null>(null);
  const [chartHandles, setChartHandles] = useState<ScannerChartHandles | null>(null);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    latestPriceFormatterRef.current = priceFormatter;
  }, [priceFormatter]);

  useEffect(() => {
    latestThemeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    latestCrosshairRef.current = crosshairActive;
  }, [crosshairActive]);

  useEffect(() => {
    latestAutoScaleRef.current = autoScale;
  }, [autoScale]);

  useEffect(() => {
    latestPercentageScaleRef.current = percentageScale;
  }, [percentageScale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;

    const initialTheme = getInitialScannerTheme(latestThemeRef.current);
    const initialCrosshairActive = latestCrosshairRef.current;
    const chartOptions = createScannerChartOptions(initialTheme);
    const chart = createChart(container, {
      ...chartOptions,
      crosshair: scannerCrosshairOptions(initialCrosshairActive, initialTheme),
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const initialData = latestDataRef.current;
    const initialChartType = initialChartTypeRef.current;
    const initialPriceFormatter = latestPriceFormatterRef.current;
    const priceSeries = createPriceSeries(
      chart,
      initialData,
      initialChartType,
      initialPriceFormatter
    );
    const initialAutoScale = latestAutoScaleRef.current;
    const initialPercentageScale = latestPercentageScaleRef.current;
    chart.priceScale("right").applyOptions({
      scaleMargins: SCANNER_CHART_LAYOUT.candleScaleMargins,
      autoScale: initialAutoScale,
      mode: initialPercentageScale ? PriceScaleMode.Percentage : PriceScaleMode.Normal,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, scannerVolumeSeriesOptions);
    chart.priceScale("volume").applyOptions({
      scaleMargins: SCANNER_CHART_LAYOUT.volumeScaleMargins,
    });

    volumeSeries.setData(initialData.volumeRenderData);
    // setVisibleRange pins a manual range, which fights the autoScale option
    // at the engine level regardless of what that option is set to — only
    // call it when auto-fitting is actually off; otherwise let the library
    // compute the range itself so autoScale:true works from first render.
    if (!initialAutoScale) {
      chart.priceScale("right").setVisibleRange(initialData.priceRange);
    }

    chart.timeScale().applyOptions({
      rightOffset: 0,
      barSpacing: SCANNER_CHART_LAYOUT.barSpacing,
      minBarSpacing: SCANNER_CHART_LAYOUT.minBarSpacing,
      timeVisible: true,
      secondsVisible: false,
      borderColor: chartOptions.timeScale.borderColor,
    });

    chart.timeScale().setVisibleLogicalRange(initialData.visibleLogicalRange);

    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;
    volumeSeriesRef.current = volumeSeries;
    appliedChartTypeRef.current = initialChartType;
    appliedPriceFormatterRef.current = initialPriceFormatter;
    appliedThemeRef.current = initialTheme;
    appliedCrosshairRef.current = initialCrosshairActive;
    appliedAutoScaleRef.current = initialAutoScale;
    appliedPercentageScaleRef.current = initialPercentageScale;
    appliedViewResetKeyRef.current = viewResetKey;
    setChartHandles({ chart, series: priceSeries });

    const resizeChart = () => {
      if (disposed || !chartRef.current || !containerRef.current) return;
      try {
        chartRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      } catch {
      }
    };

    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(container);
    window.addEventListener("resize", resizeChart);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeChart);
      chartRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setChartHandles((current) => (current?.chart === chart ? null : current));
      removeChartAfterPendingFrames(chart);
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || appliedChartTypeRef.current === chartType) return;

    try {
      if (priceSeriesRef.current) {
        chart.removeSeries(priceSeriesRef.current);
      }

      const priceSeries = createPriceSeries(
        chart,
        latestDataRef.current,
        chartType,
        latestPriceFormatterRef.current
      );
      priceSeriesRef.current = priceSeries;
      appliedChartTypeRef.current = chartType;
      appliedPriceFormatterRef.current = latestPriceFormatterRef.current;
      setChartHandles({ chart, series: priceSeries });
    } catch {
    }
  }, [chartType]);

  useEffect(() => {
    const priceSeries = priceSeriesRef.current;
    if (!priceSeries || appliedPriceFormatterRef.current === priceFormatter) return;

    try {
      priceSeries.applyOptions(
        createScannerSeriesOptions(theme, chartType, priceFormatter)
      );
      appliedPriceFormatterRef.current = priceFormatter;
    } catch {
    }
  }, [chartType, priceFormatter, theme]);

  useEffect(() => {
    const chart = chartRef.current;
    const priceSeries = priceSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !priceSeries || !volumeSeries) return;

    try {
      const chartOptions = createScannerChartOptions(latestThemeRef.current);
      chart.applyOptions({ grid: chartOptions.grid });
      setPriceSeriesData(priceSeries, data, chartType);
      volumeSeries.setData(data.volumeRenderData);

      // Only snap the viewport back to the default range when this is
      // actually a new chart (symbol/timeframe/range-filter changed) — a
      // live-tick data patch should update in place without moving the
      // user's current scroll/zoom position.
      if (appliedViewResetKeyRef.current !== viewResetKey) {
        if (!latestAutoScaleRef.current) {
          chart.priceScale("right").setVisibleRange(data.priceRange);
        }
        chart.timeScale().setVisibleLogicalRange(data.visibleLogicalRange);
        appliedViewResetKeyRef.current = viewResetKey;
      }
    } catch {
    }
  }, [chartType, data, viewResetKey]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (
      appliedThemeRef.current === theme &&
      appliedCrosshairRef.current === crosshairActive
    ) {
      return;
    }

    try {
      const chartOptions = createScannerChartOptions(theme);
      chart.applyOptions({
        layout: chartOptions.layout,
        grid: chartOptions.grid,
        rightPriceScale: chartOptions.rightPriceScale,
        timeScale: chartOptions.timeScale,
        crosshair: scannerCrosshairOptions(crosshairActive, theme),
      });

      if (!crosshairActive) {
        chart.clearCrosshairPosition();
      }
      appliedThemeRef.current = theme;
      appliedCrosshairRef.current = crosshairActive;
    } catch {
    }
  }, [crosshairActive, theme]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (
      appliedAutoScaleRef.current === autoScale &&
      appliedPercentageScaleRef.current === percentageScale
    ) {
      return;
    }

    try {
      chart.priceScale("right").applyOptions({
        autoScale,
        mode: percentageScale ? PriceScaleMode.Percentage : PriceScaleMode.Normal,
      });
      appliedAutoScaleRef.current = autoScale;
      appliedPercentageScaleRef.current = percentageScale;
    } catch {
    }
  }, [autoScale, percentageScale]);

  return { containerRef, chartHandles };
}

function createPriceSeries(
  chart: IChartApi,
  data: ScannerChartData,
  chartType: ScannerChartType,
  priceFormatter: ScannerPriceFormatter
): ScannerPriceSeries {
  if (chartType === "bar-ohlc") {
    const series = chart.addSeries(
      BarSeries,
      createScannerBarSeriesOptions(priceFormatter)
    );
    series.setData(data.barRenderData);
    return series;
  }

  if (chartType === "bar-hlc") {
    const series = chart.addSeries(
      BarSeries,
      createScannerHlcBarSeriesOptions(priceFormatter)
    );
    series.setData(data.hlcBarRenderData);
    return series;
  }

  if (chartType === "line") {
    const series = chart.addSeries(
      LineSeries,
      createScannerLineSeriesOptions(priceFormatter)
    );
    series.setData(data.lineRenderData);
    return series;
  }

  if (chartType === "line-markers") {
    const series = chart.addSeries(
      LineSeries,
      createScannerLineWithMarkersSeriesOptions(priceFormatter)
    );
    series.setData(data.lineRenderData);
    return series;
  }

  if (chartType === "step-line") {
    const series = chart.addSeries(
      LineSeries,
      createScannerStepLineSeriesOptions(priceFormatter)
    );
    series.setData(data.lineRenderData);
    return series;
  }

  if (chartType === "hollow-candles") {
    const series = chart.addSeries(
      CandlestickSeries,
      createScannerHollowCandleSeriesOptions(priceFormatter)
    );
    series.setData(data.hollowCandleRenderData);
    return series;
  }

  const series = chart.addSeries(
    CandlestickSeries,
    createScannerCandleSeriesOptions(priceFormatter)
  );
  series.setData(data.candleRenderData);
  return series;
}

function setPriceSeriesData(
  series: ScannerPriceSeries,
  data: ScannerChartData,
  chartType: ScannerChartType
) {
  if (chartType === "bar-ohlc") {
    series.setData(data.barRenderData);
    return;
  }

  if (chartType === "bar-hlc") {
    series.setData(data.hlcBarRenderData);
    return;
  }

  if (
    chartType === "line" ||
    chartType === "line-markers" ||
    chartType === "step-line"
  ) {
    series.setData(data.lineRenderData);
    return;
  }

  if (chartType === "hollow-candles") {
    series.setData(data.hollowCandleRenderData);
    return;
  }

  series.setData(data.candleRenderData);
}

function removeChartAfterPendingFrames(chart: IChartApi) {
  window.setTimeout(() => {
    requestAnimationFrame(() => {
      try {
        chart.remove();
      } catch {
      }
    });
  }, 250);
}
