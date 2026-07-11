"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, ISeriesApi } from "lightweight-charts";
import type { ScanBand } from "@/types/market";

const FILL = "rgba(250, 204, 21, 0.12)";
const BORDER = "rgba(234, 179, 8, 0.45)";
const MIN_LABEL_WIDTH_PX = 28;
const FALLBACK_LABEL_WIDTH = 90;

type ScanBandOverlayProps = {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
  bands: ScanBand[];
  containerRef: React.RefObject<HTMLDivElement | null>;
};

type BandRefs = {
  band: HTMLDivElement | null;
  label: HTMLDivElement | null;
};

function setBandRef(
  map: Map<string, BandRefs>,
  bandId: string,
  key: keyof BandRefs,
  el: HTMLDivElement | null
) {
  const existing = map.get(bandId) ?? { band: null, label: null };
  map.set(bandId, { ...existing, [key]: el });
}

export function ScanBandOverlay({ chart, series, bands, containerRef }: ScanBandOverlayProps) {
  const bandRefs = useRef<Map<string, BandRefs>>(new Map());
  const rafScheduled = useRef(false);

  useEffect(() => {
    const recalculate = () => {
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      for (const scanBand of bands) {
        const refs = bandRefs.current.get(scanBand.id);
        if (!refs?.band || !refs.label) continue;

        const x1 = chart.timeScale().timeToCoordinate(scanBand.startTime);
        const x2 = chart.timeScale().timeToCoordinate(scanBand.endTime);

        if (x1 === null || x2 === null) {
          refs.band.style.display = "none";
          refs.label.style.display = "none";
          continue;
        }

        const left = Math.min(x1, x2);
        const width = Math.max(Math.abs(x2 - x1), 1);

        refs.band.style.display = "block";
        refs.band.style.left = `${left}px`;
        refs.band.style.width = `${width}px`;
        refs.band.style.top = "0px";
        refs.band.style.height = `${containerHeight}px`;

        if (width < MIN_LABEL_WIDTH_PX) {
          refs.label.style.display = "none";
        } else {
          refs.label.style.display = "block";
          const labelWidth = refs.label.offsetWidth || FALLBACK_LABEL_WIDTH;
          let labelLeft = left + width / 2 - labelWidth / 2;
          labelLeft = Math.max(4, Math.min(labelLeft, containerWidth - labelWidth - 4));
          refs.label.style.left = `${labelLeft}px`;
          refs.label.style.top = "6px";
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

    // Pan/zoom callbacks fire synchronously as the chart's own coordinate
    // system updates; recalculating synchronously here (not via rAF) keeps
    // the overlay in the same paint as the chart, eliminating any 1-frame
    // lag that reads as "drift" during fast panning. Resize is throttled
    // separately since it isn't latency-sensitive in the same way.
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
  }, [chart, series, bands, containerRef]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {bands.map((scanBand) => (
        <div key={scanBand.id} className="pointer-events-none">
          <div
            ref={(el) => setBandRef(bandRefs.current, scanBand.id, "band", el)}
            className="pointer-events-none absolute"
            style={{
              backgroundColor: FILL,
              borderLeft: `1px solid ${BORDER}`,
              borderRight: `1px solid ${BORDER}`,
            }}
          />
          <div
            ref={(el) => setBandRef(bandRefs.current, scanBand.id, "label", el)}
            className="pointer-events-none absolute w-max rounded px-1.5 py-1 text-[10px] leading-none font-medium"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#A16207" }}
          >
            {scanBand.label}
          </div>
        </div>
      ))}
    </div>
  );
}
