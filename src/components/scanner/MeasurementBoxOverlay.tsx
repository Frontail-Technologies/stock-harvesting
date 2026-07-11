"use client";

import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { MeasurementBox } from "@/types/market";

const FILL = "rgba(250, 204, 21, 0.10)";
const BORDER = "rgba(234, 179, 8, 0.75)";
const TOOLTIP_BORDER = "rgba(245, 158, 11, 0.75)";
const TOOLTIP_TITLE_COLOR = "#D97706";
const TOOLTIP_TEXT_COLOR = "#334155";
const MIN_TAG_WIDTH_PX = 24;
const MIN_TAG_HEIGHT_PX = 20;
const FALLBACK_TOOLTIP_WIDTH = 140;
const FALLBACK_TOOLTIP_HEIGHT = 60;
const VOLUME_AREA_START_RATIO = 0.86;

type MeasurementBoxOverlayProps = {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
  boxes: MeasurementBox[];
  containerRef: React.RefObject<HTMLDivElement | null>;
};

type BoxRefs = {
  box: HTMLDivElement | null;
  tag: HTMLDivElement | null;
  tooltip: HTMLDivElement | null;
};

function setBoxRef(
  map: Map<string, BoxRefs>,
  boxId: string,
  key: keyof BoxRefs,
  el: HTMLDivElement | null
) {
  const existing = map.get(boxId) ?? { box: null, tag: null, tooltip: null };
  map.set(boxId, { ...existing, [key]: el });
}

export function MeasurementBoxOverlay({
  chart,
  series,
  boxes,
  containerRef,
}: MeasurementBoxOverlayProps) {
  const boxRefs = useRef<Map<string, BoxRefs>>(new Map());
  const rafScheduled = useRef(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const recalculate = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const volumeAreaTop = containerHeight * VOLUME_AREA_START_RATIO;

      for (const measurementBox of boxes) {
        const refs = boxRefs.current.get(measurementBox.id);
        if (!refs?.box || !refs.tag) continue;

        const x1 = chart.timeScale().timeToCoordinate(measurementBox.startTime);
        const x2 = chart.timeScale().timeToCoordinate(measurementBox.endTime);
        const y1 = series.priceToCoordinate(measurementBox.highPrice);
        const y2 = series.priceToCoordinate(measurementBox.lowPrice);

        if (x1 === null || x2 === null || y1 === null || y2 === null) {
          refs.box.style.display = "none";
          refs.tag.style.display = "none";
          if (refs.tooltip) refs.tooltip.style.display = "none";
          continue;
        }

        const left = Math.min(x1, x2);
        const width = Math.max(Math.abs(x2 - x1), 1);
        const top = Math.min(y1, y2);
        const height = Math.max(Math.abs(y2 - y1), 1);

        refs.box.style.display = "block";
        refs.box.style.left = `${left}px`;
        refs.box.style.width = `${width}px`;
        refs.box.style.top = `${top}px`;
        refs.box.style.height = `${height}px`;

        if (width < MIN_TAG_WIDTH_PX || height < MIN_TAG_HEIGHT_PX) {
          // Box stays visible; only the tag (which wouldn't fit legibly) hides.
          refs.tag.style.display = "none";
        } else {
          refs.tag.style.display = "block";
          const tagLeft = Math.max(4, Math.min(left + 4, containerWidth - 40));
          const tagTop = Math.max(4, top - 18);
          refs.tag.style.left = `${tagLeft}px`;
          refs.tag.style.top = `${tagTop}px`;
        }

        if (refs.tooltip && hoveredId === measurementBox.id) {
          refs.tooltip.style.display = "block";
          const tooltipWidth = refs.tooltip.offsetWidth || FALLBACK_TOOLTIP_WIDTH;
          const tooltipHeight = refs.tooltip.offsetHeight || FALLBACK_TOOLTIP_HEIGHT;

          let tooltipLeft = left + 4;
          tooltipLeft = Math.max(4, Math.min(tooltipLeft, containerWidth - tooltipWidth - 4));

          let tooltipTop = top - tooltipHeight - 6;
          if (tooltipTop < 4) tooltipTop = top + 4;
          // Never let the tooltip land inside the volume histogram strip.
          tooltipTop = Math.min(tooltipTop, volumeAreaTop - tooltipHeight - 4);
          tooltipTop = Math.max(4, tooltipTop);

          refs.tooltip.style.left = `${tooltipLeft}px`;
          refs.tooltip.style.top = `${tooltipTop}px`;
        } else if (refs.tooltip) {
          refs.tooltip.style.display = "none";
        }
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

    // Synchronous on pan/zoom (no rAF) so the box/tag/tooltip stay locked to
    // the chart's own coordinate updates with zero added lag.
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
  }, [chart, series, boxes, containerRef, hoveredId]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {boxes.map((measurementBox) => {
        const isHovered = hoveredId === measurementBox.id;
        const handleEnter = () => setHoveredId(measurementBox.id);
        const handleLeave = () => setHoveredId(null);

        return (
          <div key={measurementBox.id} className="pointer-events-none">
            <div
              ref={(el) => setBoxRef(boxRefs.current, measurementBox.id, "box", el)}
              className="pointer-events-auto absolute cursor-help border border-dashed"
              style={{ backgroundColor: FILL, borderColor: BORDER }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            />
            <div
              ref={(el) => setBoxRef(boxRefs.current, measurementBox.id, "tag", el)}
              className="pointer-events-auto absolute w-max cursor-help rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold shadow-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                border: `1px solid ${BORDER}`,
                color: TOOLTIP_TITLE_COLOR,
              }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              {measurementBox.label}
            </div>
            {isHovered && (
              <div
                ref={(el) => setBoxRef(boxRefs.current, measurementBox.id, "tooltip", el)}
                className="pointer-events-none absolute w-max max-w-44 rounded-md border bg-white px-2 py-1.5 text-[11px] leading-snug shadow-md"
                style={{ borderColor: TOOLTIP_BORDER, color: TOOLTIP_TEXT_COLOR }}
              >
                <div className="font-semibold" style={{ color: TOOLTIP_TITLE_COLOR }}>
                  {measurementBox.label}
                </div>
                <div>{measurementBox.percent}</div>
                <div className="text-slate-500">{measurementBox.bars}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
