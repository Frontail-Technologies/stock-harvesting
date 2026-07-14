"use client";

import { useEffect, useMemo, useRef } from "react";
import type { IChartApi } from "lightweight-charts";
import type { ScanBand } from "@/types/market";
import type { ScannerPriceSeries } from "../hooks/use-lightweight-candlestick-chart";

const WIDTH_MULTIPLIER = 0.92;

type ScanBandOverlayProps = {
  chart: IChartApi;
  series: ScannerPriceSeries;
  bands: ScanBand[];
  candleTimes: string[];
  containerRef: React.RefObject<HTMLDivElement | null>;
};

type HighlightColumn = {
  id: string;
  time: string;
};

export function ScanBandOverlay({
  chart,
  bands,
  candleTimes,
  containerRef,
}: ScanBandOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const rafScheduled = useRef(false);
  const candleIndexByTime = useMemo(
    () => new Map(candleTimes.map((time, index) => [time, index])),
    [candleTimes]
  );
  const highlightColumns = useMemo<HighlightColumn[]>(() => {
    const seen = new Set<string>();

    return bands.flatMap((scanBand) => {
      const times = scanBand.highlightTimes ?? [];

      return times
        .filter((time) => {
          if (seen.has(time)) return false;
          seen.add(time);
          return true;
        })
        .map((time) => ({
          id: `${scanBand.id}:${time}`,
          time,
        }));
    });
  }, [bands]);

  useEffect(() => {
    let disposed = false;
    let animationFrameId: number | null = null;

    const recalculate = () => {
      if (disposed) return;
      const container = containerRef.current;
      if (!container) return;
      const paneSize = getPaneSize(chart);
      if (!paneSize) return;
      const plotWidth = paneSize.width;
      const plotHeight = paneSize.height;
      const overlay = overlayRef.current;

      if (overlay) {
        overlay.style.width = `${plotWidth}px`;
        overlay.style.height = `${plotHeight}px`;
      }

      for (const column of highlightColumns) {
        const element = columnRefs.current.get(column.id);
        if (!element) continue;

        const x = safeTimeToCoordinate(chart, column.time);

        if (x === null) {
          element.style.display = "none";
          continue;
        }

        const width = getColumnWidth(chart, candleTimes, candleIndexByTime, column.time, x);
        const rawLeft = x - width / 2;
        const left = Math.max(rawLeft, 0);
        const right = Math.min(rawLeft + width, plotWidth);
        const visibleWidth = right - left;

        if (visibleWidth <= 0) {
          element.style.display = "none";
          continue;
        }

        element.style.display = "block";
        element.style.left = `${left}px`;
        element.style.width = `${visibleWidth}px`;
        element.style.top = "0px";
        element.style.height = `${plotHeight}px`;
      }
    };

    const scheduleRecalculate = () => {
      if (disposed || rafScheduled.current) return;
      rafScheduled.current = true;
      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        rafScheduled.current = false;
        recalculate();
      });
    };

    scheduleRecalculate();

    try {
      chart.timeScale().subscribeVisibleTimeRangeChange(scheduleRecalculate);
      chart.timeScale().subscribeVisibleLogicalRangeChange(scheduleRecalculate);
    } catch {
    }

    const container = containerRef.current;
    const resizeObserver = new ResizeObserver(scheduleRecalculate);
    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", scheduleRecalculate);

    return () => {
      disposed = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      try {
        chart.timeScale().unsubscribeVisibleTimeRangeChange(scheduleRecalculate);
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(scheduleRecalculate);
      } catch {
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleRecalculate);
    };
  }, [candleIndexByTime, candleTimes, chart, containerRef, highlightColumns]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute left-0 top-0 overflow-hidden"
      style={{ zIndex: 2 }}
    >
      {highlightColumns.map((column) => (
        <div
          key={column.id}
          data-scan-band="true"
          ref={(el) => {
            columnRefs.current.set(column.id, el);
          }}
          className="pointer-events-none absolute"
          style={{
            backgroundColor: "var(--scanner-highlight-fill)",
            backgroundImage:
              "linear-gradient(var(--scanner-highlight-grid) 1px, transparent 1px), linear-gradient(90deg, var(--scanner-highlight-grid) 1px, transparent 1px)",
            backgroundSize: "72px 54px",
            boxShadow:
              "inset 1px 0 0 var(--scanner-highlight-edge), inset -1px 0 0 var(--scanner-highlight-edge)",
          }}
        />
      ))}
    </div>
  );
}

function getColumnWidth(
  chart: IChartApi,
  candleTimes: string[],
  candleIndexByTime: Map<string, number>,
  time: string,
  coordinate: number
) {
  const index = candleIndexByTime.get(time);
  const neighborDistances: number[] = [];

  if (index !== undefined) {
    const previousTime = candleTimes[index - 1];
    const nextTime = candleTimes[index + 1];
    const previousCoordinate = previousTime
      ? safeTimeToCoordinate(chart, previousTime)
      : null;
    const nextCoordinate = nextTime ? safeTimeToCoordinate(chart, nextTime) : null;

    if (previousCoordinate !== null) {
      neighborDistances.push(Math.abs(coordinate - previousCoordinate));
    }
    if (nextCoordinate !== null) {
      neighborDistances.push(Math.abs(nextCoordinate - coordinate));
    }
  }

  const candleSpacing =
    neighborDistances.length > 0 ? Math.min(...neighborDistances) : 8;

  return Math.max(candleSpacing * WIDTH_MULTIPLIER, 1);
}

function getPaneSize(chart: IChartApi) {
  try {
    const paneSize = chart.paneSize();
    const width = paneSize.width;
    const height = paneSize.height;

    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    if (width <= 0 || height <= 0) return null;

    return { width, height };
  } catch {
    return null;
  }
}

function safeTimeToCoordinate(chart: IChartApi, time: string) {
  try {
    return chart.timeScale().timeToCoordinate(time);
  } catch {
    return null;
  }
}
