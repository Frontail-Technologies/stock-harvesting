"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { IChartApi, Logical, Time } from "lightweight-charts";
import type { ScanBand } from "@/types/market";
import type { ScannerPriceSeries } from "../hooks/use-lightweight-candlestick-chart";

const WIDTH_MULTIPLIER = 0.92;
const MIN_COLUMN_WIDTH = 1;
const DEFAULT_COLUMN_WIDTH = 8;

type ScanBandOverlayProps = {
  chart: IChartApi;
  series: ScannerPriceSeries;
  bands: ScanBand[];
  candleTimes: string[];
  containerRef: RefObject<HTMLDivElement | null>;
};

type HighlightColumn = {
  time: string;
  logicalIndex: number;
};

type HighlightRun = {
  id: string;
  startIndex: number;
  endIndex: number;
};

type VisibleRun = {
  id: string;
  left: number;
  width: number;
};

type OverlayFrame = {
  width: number;
  height: number;
};

export function ScanBandOverlay({
  chart,
  bands,
  candleTimes,
  containerRef,
}: ScanBandOverlayProps) {
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [overlayFrame, setOverlayFrame] = useState<OverlayFrame>({
    height: 0,
    width: 0,
  });
  const candleIndexByTime = useMemo(
    () => new Map(candleTimes.map((time, index) => [time, index])),
    [candleTimes]
  );
  const candleTimeByDate = useMemo(
    () => new Map(candleTimes.map((time) => [toDateKey(time), time])),
    [candleTimes]
  );
  const highlightColumns = useMemo<HighlightColumn[]>(() => {
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
        })
        .map((time) => ({
          time,
          logicalIndex: candleIndexByTime.get(time) ?? 0,
        }));
    });
  }, [bands, candleIndexByTime, candleTimeByDate, candleTimes]);

  // Highlighted candles are merged into contiguous runs so a multi-week
  // signal renders as one clean band instead of one bordered/textured box
  // per candle — per-candle boxes each tiled their own background pattern
  // from their own left edge, so adjacent boxes fell out of phase with each
  // other and with the chart as it panned, producing a shimmering, glitchy
  // strip of seams instead of a single steady highlight.
  const highlightRuns = useMemo<HighlightRun[]>(() => {
    const sortedIndexes = [...new Set(highlightColumns.map((column) => column.logicalIndex))].sort(
      (a, b) => a - b
    );
    const runs: HighlightRun[] = [];

    for (const index of sortedIndexes) {
      const lastRun = runs[runs.length - 1];
      if (lastRun && index === lastRun.endIndex + 1) {
        lastRun.endIndex = index;
      } else {
        runs.push({ id: `run:${index}`, startIndex: index, endIndex: index });
      }
    }

    return runs;
  }, [highlightColumns]);

  useEffect(() => {
    let disposed = false;
    let frameId = 0;

    const queueLayoutUpdate = () => {
      if (disposed || frameId) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        if (!disposed) {
          setOverlayFrame(getOverlayFrame(chart, containerRef.current));
          setLayoutVersion((version) => version + 1);
        }
      });
    };

    queueLayoutUpdate();
    const timeoutId = window.setTimeout(queueLayoutUpdate, 80);

    try {
      chart.timeScale().subscribeVisibleLogicalRangeChange(queueLayoutUpdate);
    } catch {
    }

    const container = containerRef.current;
    const resizeObserver = container ? new ResizeObserver(queueLayoutUpdate) : null;
    if (container && resizeObserver) resizeObserver.observe(container);
    window.addEventListener("resize", queueLayoutUpdate);

    return () => {
      disposed = true;
      if (frameId) window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", queueLayoutUpdate);
      try {
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(queueLayoutUpdate);
      } catch {
      }
    };
  }, [chart, containerRef]);

  const visibleRuns = useMemo<VisibleRun[]>(() => {
    void layoutVersion;

    if (overlayFrame.width <= 0 || overlayFrame.height <= 0) return [];

    const candleCoordinates = candleTimes.map((time, index) => ({
      index,
      x: timeToCoordinate(chart, time, index),
    }));
    const fallbackWidth = getFallbackColumnWidth(candleCoordinates);

    return highlightRuns
      .map((run) => {
        const startX = candleCoordinates[run.startIndex]?.x ?? null;
        const endX = candleCoordinates[run.endIndex]?.x ?? null;
        if (startX === null || endX === null) return null;

        const startHalfWidth =
          (Math.max(
            getNearestCandleDistance(candleCoordinates, run.startIndex, fallbackWidth) *
              WIDTH_MULTIPLIER,
            MIN_COLUMN_WIDTH
          )) / 2;
        const endHalfWidth =
          (Math.max(
            getNearestCandleDistance(candleCoordinates, run.endIndex, fallbackWidth) *
              WIDTH_MULTIPLIER,
            MIN_COLUMN_WIDTH
          )) / 2;

        const left = startX - startHalfWidth;
        const right = endX + endHalfWidth;

        if (right <= 0 || left >= overlayFrame.width) return null;

        return {
          id: run.id,
          left: Math.max(left, 0),
          width: Math.min(right, overlayFrame.width) - Math.max(left, 0),
        };
      })
      .filter((run): run is VisibleRun => Boolean(run));
  }, [candleTimes, chart, highlightRuns, layoutVersion, overlayFrame]);

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 overflow-hidden"
      style={{
        height: overlayFrame.height,
        width: overlayFrame.width,
        zIndex: 11,
      }}
    >
      {visibleRuns.map((run) => (
        <div
          key={run.id}
          data-scan-band="true"
          className="pointer-events-none absolute"
          style={{
            backgroundColor: "var(--scanner-highlight-fill)",
            boxShadow:
              "inset 1px 0 0 var(--scanner-highlight-edge), inset -1px 0 0 var(--scanner-highlight-edge)",
            bottom: 0,
            left: run.left,
            top: 0,
            width: run.width,
          }}
        />
      ))}
    </div>
  );
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

function getOverlayFrame(chart: IChartApi, container: HTMLDivElement | null): OverlayFrame {
  try {
    const paneSize = chart.paneSize();
    if (
      paneSize &&
      Number.isFinite(paneSize.width) &&
      Number.isFinite(paneSize.height) &&
      paneSize.width > 0 &&
      paneSize.height > 0
    ) {
      return paneSize;
    }
  } catch {
  }

  return {
    width: container?.clientWidth ?? 0,
    height: container?.clientHeight ?? 0,
  };
}

function timeToCoordinate(
  chart: IChartApi,
  time: string,
  logicalIndex: number
) {
  try {
    const x = chart.timeScale().timeToCoordinate(time as Time);
    if (x !== null && Number.isFinite(x)) return x;
  } catch {
  }

  try {
    const x = chart.timeScale().logicalToCoordinate(logicalIndex as Logical);
    if (x !== null && Number.isFinite(x)) return x;
  } catch {
  }

  return null;
}

function getFallbackColumnWidth(
  candleCoordinates: Array<{ index: number; x: number | null }>
) {
  const distances: number[] = [];

  for (let index = 1; index < candleCoordinates.length; index++) {
    const previous = candleCoordinates[index - 1];
    const current = candleCoordinates[index];

    if (previous.x === null || current.x === null) continue;

    const distance = Math.abs(current.x - previous.x);
    if (Number.isFinite(distance) && distance > 0) distances.push(distance);
  }

  if (distances.length === 0) return DEFAULT_COLUMN_WIDTH;
  distances.sort((a, b) => a - b);
  return distances[Math.floor(distances.length / 2)] ?? DEFAULT_COLUMN_WIDTH;
}

function getNearestCandleDistance(
  candleCoordinates: Array<{ index: number; x: number | null }>,
  logicalIndex: number,
  fallbackWidth: number
) {
  const current = candleCoordinates[logicalIndex];
  if (!current || current.x === null) return fallbackWidth;

  const previous = findCoordinate(candleCoordinates, logicalIndex, -1);
  const next = findCoordinate(candleCoordinates, logicalIndex, 1);
  const distances = [previous, next]
    .filter((coordinate): coordinate is number => coordinate !== null)
    .map((coordinate) => Math.abs(coordinate - current.x!))
    .filter((distance) => Number.isFinite(distance) && distance > 0);

  if (distances.length === 0) return fallbackWidth;
  return Math.min(...distances);
}

function findCoordinate(
  candleCoordinates: Array<{ index: number; x: number | null }>,
  startIndex: number,
  direction: -1 | 1
) {
  for (
    let index = startIndex + direction;
    index >= 0 && index < candleCoordinates.length;
    index += direction
  ) {
    const x = candleCoordinates[index]?.x;
    if (x !== null && x !== undefined) return x;
  }

  return null;
}
