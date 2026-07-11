"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { ScanBand, Stock } from "@/types/market";
import { mockWeeklyCandles, mockScanBands, mockMeasurementBoxes } from "@/lib/mock-candles";
import {
  calculateNear250WeekHighSignal,
  calculateTradeLevels,
  findRecentActiveWindowStart,
} from "@/lib/scanners/near-250-week-high";
import { ScanBandOverlay } from "@/components/scanner/ScanBandOverlay";
import { MeasurementBoxOverlay } from "@/components/scanner/MeasurementBoxOverlay";
import { ChartInfoOverlay } from "@/components/scanner/ChartInfoOverlay";
import { MeasureToolOverlay } from "@/components/scanner/MeasureToolOverlay";
import { Near250WeekHighOverlay } from "@/components/scanner/Near250WeekHighOverlay";
import { TradeLevelsPanel } from "@/components/scanner/TradeLevelsPanel";
import type { Timeframe } from "@/components/scanner/TimeframeSelector";

const GREEN = "#22C55E";
const RED = "#EF4444";
const GOLD = "#F5B800";

type ScannerChartProps = {
  stock: Stock;
  timeframe: Timeframe;
  crosshairActive: boolean;
  measureActive: boolean;
  measureClearSignal: number;
};

export function ScannerChart({
  stock,
  timeframe,
  crosshairActive,
  measureActive,
  measureClearSignal,
}: ScannerChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const nearHighSignal = useMemo(
    () => calculateNear250WeekHighSignal(stock.symbol, mockWeeklyCandles),
    [stock.symbol]
  );
  const activeWindowStartTime = useMemo(() => {
    if (!nearHighSignal?.matched) return null;
    return findRecentActiveWindowStart(mockWeeklyCandles, nearHighSignal.threshold85);
  }, [nearHighSignal]);
  const tradeLevels = useMemo(
    () => (nearHighSignal?.matched ? calculateTradeLevels(nearHighSignal) : null),
    [nearHighSignal]
  );
  const allScanBands = useMemo<ScanBand[]>(() => {
    if (nearHighSignal?.matched && activeWindowStartTime) {
      return [
        ...mockScanBands,
        {
          id: "near-250-high-active",
          startTime: activeWindowStartTime,
          endTime: nearHighSignal.signalTime,
          label: "Scan Match",
        },
      ];
    }
    return mockScanBands;
  }, [nearHighSignal, activeWindowStartTime]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#FFFFFF" },
        textColor: "#64748B",
      },
      grid: {
        vertLines: { color: "rgba(15,23,42,0.06)" },
        horzLines: { color: "rgba(15,23,42,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(15,23,42,0.1)" },
      timeScale: { borderColor: "rgba(15,23,42,0.1)" },
      crosshair: { mode: CrosshairMode.Normal },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: GREEN,
      downColor: RED,
      borderVisible: false,
      wickUpColor: GREEN,
      wickDownColor: RED,
      priceLineVisible: true,
      priceLineColor: GOLD,
      priceLineStyle: LineStyle.Dashed,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.88, bottom: 0 },
    });

    candleSeries.setData(
      mockWeeklyCandles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    volumeSeries.setData(
      mockWeeklyCandles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
      }))
    );

    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    setIsChartReady(true);

    const resizeChart = () => {
      if (!chartRef.current || !containerRef.current) return;
      chartRef.current.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(container);
    window.addEventListener("resize", resizeChart);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeChart);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, []);

  useEffect(() => {
    chartRef.current?.applyOptions({
      crosshair: {
        vertLine: { visible: crosshairActive },
        horzLine: { visible: crosshairActive },
      },
    });
  }, [crosshairActive]);

  return (
    <div className="relative h-full w-full min-h-0 min-w-0">
      <div ref={containerRef} className="h-full w-full" />
      {/* Our own watermark, bottom-right — deliberately not bottom-left, where
          lightweight-charts' own TradingView attribution logo renders by
          default (attributionLogo defaults to true; we never disable it). */}
      <div className="pointer-events-none absolute bottom-2 right-16 z-5 select-none text-[10px] text-slate-400/60">
        Stock Harvesting
      </div>
      <ChartInfoOverlay stock={stock} timeframe={timeframe} />
      {isChartReady && chartRef.current && candleSeriesRef.current && (
        <>
          <ScanBandOverlay
            chart={chartRef.current}
            series={candleSeriesRef.current}
            bands={allScanBands}
            containerRef={containerRef}
          />
          <MeasurementBoxOverlay
            chart={chartRef.current}
            series={candleSeriesRef.current}
            boxes={mockMeasurementBoxes}
            containerRef={containerRef}
          />
          <MeasureToolOverlay
            chart={chartRef.current}
            series={candleSeriesRef.current}
            containerRef={containerRef}
            active={measureActive}
            clearSignal={measureClearSignal}
          />
          {nearHighSignal?.matched && activeWindowStartTime && (
            <>
              <Near250WeekHighOverlay
                chart={chartRef.current}
                series={candleSeriesRef.current}
                containerRef={containerRef}
                signal={nearHighSignal}
                activeWindowStartTime={activeWindowStartTime}
              />
              {tradeLevels && <TradeLevelsPanel tradeLevels={tradeLevels} />}
            </>
          )}
        </>
      )}
    </div>
  );
}
