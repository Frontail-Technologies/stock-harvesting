"use client";

import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { NearHighSignal } from "@/lib/scanners/near-250-week-high";
import { toScanDisplayInfo } from "@/lib/scanners/scan-display";
import { formatCurrency } from "@/lib/formatters";

const FALLBACK_TOOLTIP_WIDTH = 170;
const FALLBACK_TOOLTIP_HEIGHT = 118;
const MARKER_SIZE_PX = 8;
const VOLUME_AREA_START_RATIO = 0.86;

const LINE_COLOR = "rgba(234, 179, 8, 0.85)";
const CLOSE_LINE_COLOR = "rgba(180, 83, 9, 0.85)";
const TOOLTIP_BORDER = "rgba(245, 158, 11, 0.75)";
const TOOLTIP_TITLE_COLOR = "#D97706";
const TOOLTIP_TEXT_COLOR = "#334155";

// Lines/marker/badge/tooltip only span this recent, narrow window — never
// the full 250-week calculation lookback used to derive
// threshold85/highestHigh250.
type Near250WeekHighOverlayProps = {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
  containerRef: React.RefObject<HTMLDivElement | null>;
  signal: NearHighSignal;
  activeWindowStartTime: string;
};

export function Near250WeekHighOverlay({
  chart,
  series,
  containerRef,
  signal,
  activeWindowStartTime,
}: Near250WeekHighOverlayProps) {
  const lineHighRef = useRef<HTMLDivElement>(null);
  const lineThresholdRef = useRef<HTMLDivElement>(null);
  const lineCloseRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const hoverCatcherRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafScheduled = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!signal.matched) return;

    const recalculate = () => {
      const container = containerRef.current;
      const lineHigh = lineHighRef.current;
      const lineThreshold = lineThresholdRef.current;
      const lineClose = lineCloseRef.current;
      const marker = markerRef.current;
      const badge = badgeRef.current;
      const hoverCatcher = hoverCatcherRef.current;
      const tooltip = tooltipRef.current;
      if (
        !container ||
        !lineHigh ||
        !lineThreshold ||
        !lineClose ||
        !marker ||
        !badge ||
        !hoverCatcher
      ) {
        return;
      }

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const volumeAreaTop = containerHeight * VOLUME_AREA_START_RATIO;

      const x1 = chart.timeScale().timeToCoordinate(activeWindowStartTime);
      const x2 = chart.timeScale().timeToCoordinate(signal.signalTime);
      const yHigh = series.priceToCoordinate(signal.highestHigh250);
      const yThreshold = series.priceToCoordinate(signal.threshold85);
      const yClose = series.priceToCoordinate(signal.currentClose);

      const elements = [lineHigh, lineThreshold, lineClose, marker, badge, hoverCatcher];

      if (x1 === null || x2 === null || yHigh === null || yThreshold === null || yClose === null) {
        for (const el of elements) el.style.display = "none";
        if (tooltip) tooltip.style.display = "none";
        return;
      }

      const left = Math.min(x1, x2);
      const width = Math.max(Math.abs(x2 - x1), 1);

      for (const [line, y] of [
        [lineHigh, yHigh],
        [lineThreshold, yThreshold],
        [lineClose, yClose],
      ] as const) {
        line.style.display = "block";
        line.style.left = `${left}px`;
        line.style.width = `${width}px`;
        line.style.top = `${y}px`;
      }

      marker.style.display = "block";
      marker.style.left = `${x2 - MARKER_SIZE_PX / 2}px`;
      marker.style.top = `${yClose - MARKER_SIZE_PX / 2}px`;

      // Invisible hover target spanning the same time range as the active
      // yellow band (rendered separately by ScanBandOverlay), so hovering
      // anywhere on that band also reveals the tooltip.
      hoverCatcher.style.display = "block";
      hoverCatcher.style.left = `${left}px`;
      hoverCatcher.style.width = `${width}px`;
      hoverCatcher.style.top = "0px";
      hoverCatcher.style.height = `${containerHeight}px`;

      badge.style.display = "block";
      const badgeLeft = Math.max(4, Math.min(left + 6, containerWidth - 100));
      const badgeTop = Math.max(4, containerHeight - 26);
      badge.style.left = `${badgeLeft}px`;
      badge.style.top = `${badgeTop}px`;

      if (tooltip && isHovered) {
        tooltip.style.display = "block";
        const tooltipWidth = tooltip.offsetWidth || FALLBACK_TOOLTIP_WIDTH;
        const tooltipHeight = tooltip.offsetHeight || FALLBACK_TOOLTIP_HEIGHT;

        let tooltipLeft = left + 6;
        tooltipLeft = Math.max(4, Math.min(tooltipLeft, containerWidth - tooltipWidth - 4));

        let tooltipTop = badgeTop - tooltipHeight - 6;
        if (tooltipTop < 4) tooltipTop = badgeTop + 22;
        tooltipTop = Math.min(tooltipTop, volumeAreaTop - tooltipHeight - 4);
        tooltipTop = Math.max(4, tooltipTop);

        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.top = `${tooltipTop}px`;
      } else if (tooltip) {
        tooltip.style.display = "none";
      }
    };

    const scheduleRecalculate = () => {
      if (rafScheduled.current) return;
      rafScheduled.current = true;
      requestAnimationFrame(() => {
        rafScheduled.current = false;
        recalculate();
      });
    };

    recalculate();

    // Synchronous on pan/zoom (no rAF) — keeps lines/marker/badge/tooltip
    // locked to the chart's own coordinate updates with zero added lag.
    chart.timeScale().subscribeVisibleTimeRangeChange(recalculate);
    chart.timeScale().subscribeVisibleLogicalRangeChange(recalculate);

    const container = containerRef.current;
    const resizeObserver = new ResizeObserver(scheduleRecalculate);
    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", scheduleRecalculate);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(recalculate);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(recalculate);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleRecalculate);
    };
  }, [chart, series, signal, activeWindowStartTime, containerRef, isHovered]);

  if (!signal.matched) return null;

  const display = toScanDisplayInfo(signal);
  const handleEnter = () => setIsHovered(true);
  const handleLeave = () => setIsHovered(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div
        ref={lineHighRef}
        className="pointer-events-none absolute h-0"
        style={{ borderTop: `1px dashed ${LINE_COLOR}` }}
      >
        <span
          className="pointer-events-none absolute -top-2.25 left-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium text-white"
          style={{ backgroundColor: LINE_COLOR }}
        >
          {display.upperZoneLabel}
        </span>
      </div>

      <div
        ref={lineThresholdRef}
        className="pointer-events-none absolute h-0"
        style={{ borderTop: `1px dashed ${LINE_COLOR}` }}
      >
        <span
          className="pointer-events-none absolute -top-2.25 left-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-medium text-white"
          style={{ backgroundColor: LINE_COLOR }}
        >
          {display.baseZoneLabel}
        </span>
      </div>

      <div
        ref={lineCloseRef}
        className="pointer-events-none absolute h-0"
        style={{ borderTop: `1px solid ${CLOSE_LINE_COLOR}` }}
      />

      <div
        ref={markerRef}
        className="pointer-events-none absolute rounded-full border-2 border-white shadow"
        style={{ width: MARKER_SIZE_PX, height: MARKER_SIZE_PX, backgroundColor: CLOSE_LINE_COLOR }}
      />

      {/* Hover target matching the active band's full extent — hovering the
          band itself (not just the badge) reveals the tooltip too. */}
      <div
        ref={hoverCatcherRef}
        className="pointer-events-auto absolute cursor-help"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />

      <div
        ref={badgeRef}
        className="pointer-events-auto absolute w-max cursor-help rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold shadow-sm"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          border: `1px solid ${TOOLTIP_BORDER}`,
          color: TOOLTIP_TITLE_COLOR,
        }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {display.signalLabel} ✓
      </div>

      {isHovered && (
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute w-max max-w-48 rounded-md border bg-white px-2 py-1.5 text-[11px] leading-snug shadow-md"
          style={{ borderColor: TOOLTIP_BORDER, color: TOOLTIP_TEXT_COLOR }}
        >
          <div className="font-semibold" style={{ color: TOOLTIP_TITLE_COLOR }}>
            {display.signalLabel}
          </div>
          <div>Signal: Matched</div>
          <div>Signal Strength: {display.signalStrengthLabel}</div>
          <div>Entry Zone: {formatCurrency(display.entryZoneValue)}</div>
          <div>Risk Zone: {formatCurrency(display.baseZoneValue)}</div>
          <div>Target Zone: {formatCurrency(display.upperZoneValue)}</div>
        </div>
      )}
    </div>
  );
}
