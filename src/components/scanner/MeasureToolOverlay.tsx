"use client";

import { useEffect, useRef, useState } from "react";
import type { BusinessDay, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { formatCurrency } from "@/lib/formatters";

const MIN_LABEL_DIMENSION_PX = 16;
const FALLBACK_LABEL_WIDTH = 170;
const FALLBACK_LABEL_HEIGHT = 54;

type Point = {
  x: number;
  y: number;
  time: Time;
  price: number;
};

type MeasureToolOverlayProps = {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
  containerRef: React.RefObject<HTMLDivElement | null>;
  active: boolean;
  clearSignal: number;
};

function timeToDate(time: Time): Date {
  if (typeof time === "number") {
    return new Date(time * 1000);
  }
  if (typeof time === "string") {
    return new Date(`${time}T00:00:00Z`);
  }
  const businessDay = time as BusinessDay;
  return new Date(Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day));
}

export function MeasureToolOverlay({
  chart,
  series,
  containerRef,
  active,
  clearSignal,
}: MeasureToolOverlayProps) {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);
  const isDraggingRef = useRef(false);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStart(null);
    setEnd(null);
    isDraggingRef.current = false;
  }, [active, clearSignal]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const getPoint = (clientX: number, clientY: number): Point | null => {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      if (time === null || price === null) return null;
      return { x, y, time, price };
    };

    const handleMouseDown = (event: MouseEvent) => {
      const point = getPoint(event.clientX, event.clientY);
      if (!point) return;
      isDraggingRef.current = true;
      setStart(point);
      setEnd(point);
      chart.applyOptions({ handleScroll: false, handleScale: false });
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const point = getPoint(event.clientX, event.clientY);
      if (!point) return;
      setEnd(point);
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      chart.applyOptions({ handleScroll: true, handleScale: true });
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      chart.applyOptions({ handleScroll: true, handleScale: true });
    };
  }, [active, chart, series, containerRef]);

  if (!active) return null;

  if (!start || !end) {
    return <div className="absolute inset-0 z-40 cursor-crosshair" />;
  }

  const left = Math.min(start.x, end.x);
  const width = Math.max(Math.abs(end.x - start.x), 1);
  const top = Math.min(start.y, end.y);
  const height = Math.max(Math.abs(end.y - start.y), 1);

  const priceDelta = end.price - start.price;
  const pct = start.price !== 0 ? (priceDelta / start.price) * 100 : 0;
  const isPositive = priceDelta >= 0;

  const days = Math.round(
    Math.abs(timeToDate(end.time).getTime() - timeToDate(start.time).getTime()) /
      86_400_000
  );
  const bars = Math.max(1, Math.round(days / 7));

  const color = isPositive ? "#22C55E" : "#EF4444";
  const containerWidth = containerRef.current?.clientWidth ?? left + width;
  const showLabel = width >= MIN_LABEL_DIMENSION_PX || height >= MIN_LABEL_DIMENSION_PX;

  const labelWidth = labelRef.current?.offsetWidth || FALLBACK_LABEL_WIDTH;
  const labelHeight = labelRef.current?.offsetHeight || FALLBACK_LABEL_HEIGHT;
  let labelLeft = left + width + 8;
  if (labelLeft + labelWidth > containerWidth - 4) {
    labelLeft = Math.max(4, left - labelWidth - 8);
  }
  let labelTop = top;
  if (labelTop + labelHeight > (containerRef.current?.clientHeight ?? labelTop + labelHeight) - 4) {
    labelTop = Math.max(4, top - labelHeight);
  }

  return (
    <div className="absolute inset-0 z-40 cursor-crosshair">
      <div
        className="pointer-events-none absolute border border-dashed"
        style={{
          left,
          top,
          width,
          height,
          borderColor: color,
          backgroundColor: isPositive ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        }}
      />

      {showLabel && (
        <div
          ref={labelRef}
          className="pointer-events-none absolute w-max max-w-[190px] rounded-md border border-border bg-white px-2.5 py-1.5 text-[11px] leading-tight shadow-md"
          style={{ left: labelLeft, top: labelTop }}
        >
          <div className="font-semibold" style={{ color }}>
            {isPositive ? "+" : ""}
            {formatCurrency(priceDelta)} ({isPositive ? "+" : ""}
            {pct.toFixed(2)}%)
          </div>
          <div className="text-muted-foreground">
            {bars} bars, {days}d
          </div>
        </div>
      )}
    </div>
  );
}
