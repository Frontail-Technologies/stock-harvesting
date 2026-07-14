import { useEffect, useRef, type RefObject } from "react";
import type { ScanBand, Stock } from "@/types/market";
import type { ScannerChartHandles } from "../hooks/use-lightweight-candlestick-chart";
import { getScannerChartTheme } from "../lib/scanner-chart-config";
import { getChartCursorCss } from "../tools/cursor-tool-config";
import type {
  ChartCaptureRequest,
  DrawingController,
  ScannerTheme,
  Timeframe,
} from "../types";
import { ChartInfoOverlay } from "./ChartInfoOverlay";
import { CustomChartGrid } from "./CustomChartGrid";
import { ScanBandOverlay } from "./ScanBandOverlay";
import { DrawingOverlay } from "./DrawingOverlay";

type ScannerChartStageProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  chartHandles: ScannerChartHandles | null;
  stock: Stock;
  timeframe: Timeframe;
  candleTimes: string[];
  scanBands: ScanBand[];
  captureRequest: ChartCaptureRequest | null;
  drawing: DrawingController;
  theme: ScannerTheme;
};

export function ScannerChartStage({
  containerRef,
  chartHandles,
  stock,
  timeframe,
  candleTimes,
  scanBands,
  captureRequest,
  drawing,
  theme,
}: ScannerChartStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const chartCursor = getChartCursorCss(drawing.activeTool);
  const chartTheme = getScannerChartTheme(theme);

  useEffect(() => {
    if (!captureRequest || !stageRef.current) return;

    void captureStageImage(
      stageRef.current,
      `${stock.symbol}-${timeframe}-scanner.png`,
      captureRequest.mode,
      theme
    );
  }, [captureRequest, stock.symbol, theme, timeframe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const applyCursor = () => {
      container.style.cursor = chartCursor;
      container
        .querySelectorAll<HTMLElement>("canvas")
        .forEach((element) => {
          element.style.cursor = chartCursor;
        });
    };

    applyCursor();
    const observer = new MutationObserver(applyCursor);
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      container.style.cursor = "";
      container
        .querySelectorAll<HTMLElement>("canvas")
        .forEach((element) => {
          element.style.cursor = "";
        });
    };
  }, [chartCursor, containerRef]);

  return (
    <div
      ref={stageRef}
      className="relative h-full min-h-0 w-full min-w-0 overflow-hidden"
      style={{
        backgroundColor: chartTheme.panelBackground,
        cursor: chartCursor,
      }}
    >
      <div
        ref={containerRef}
        className="relative z-10 h-full w-full"
        style={{ cursor: chartCursor }}
      />
      <CustomChartGrid />
      <div className="pointer-events-none absolute bottom-2 right-16 z-20 select-none text-[0.625rem] text-[var(--scanner-watermark)]">
        Stock Harvesting
      </div>
      <ChartInfoOverlay stock={stock} timeframe={timeframe} />

      {chartHandles && (
        <>
          <ScanBandOverlay
            chart={chartHandles.chart}
            series={chartHandles.series}
            bands={scanBands}
            candleTimes={candleTimes}
            containerRef={containerRef}
          />
          <DrawingOverlay
            chart={chartHandles.chart}
            series={chartHandles.series}
            containerRef={containerRef}
            drawing={drawing}
          />
        </>
      )}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function captureStageImage(
  stage: HTMLDivElement,
  filename: string,
  mode: ChartCaptureRequest["mode"],
  theme: ScannerTheme
) {
  const rect = stage.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(rect.width * ratio));
  output.height = Math.max(1, Math.round(rect.height * ratio));

  const context = output.getContext("2d");
  if (!context) return;

  context.scale(ratio, ratio);
  context.fillStyle = getScannerChartTheme(theme).panelBackground;
  context.fillRect(0, 0, rect.width, rect.height);

  for (const band of Array.from(stage.querySelectorAll<HTMLElement>("[data-scan-band]"))) {
    const bandRect = band.getBoundingClientRect();
    context.fillStyle = window.getComputedStyle(band).backgroundColor;
    context.fillRect(
      bandRect.left - rect.left,
      bandRect.top - rect.top,
      bandRect.width,
      bandRect.height
    );
  }

  for (const canvas of Array.from(stage.querySelectorAll("canvas"))) {
    const canvasRect = canvas.getBoundingClientRect();
    context.drawImage(
      canvas,
      canvasRect.left - rect.left,
      canvasRect.top - rect.top,
      canvasRect.width,
      canvasRect.height
    );
  }

  for (const svg of Array.from(stage.querySelectorAll<SVGSVGElement>("[data-drawing-overlay]"))) {
    const svgRect = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", `${svgRect.width}`);
    clone.setAttribute("height", `${svgRect.height}`);

    const text = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = url;
    });

    context.drawImage(
      image,
      svgRect.left - rect.left,
      svgRect.top - rect.top,
      svgRect.width,
      svgRect.height
    );
    URL.revokeObjectURL(url);
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, "image/png")
  );
  if (!blob) return;

  if (mode === "share") {
    const file = new File([blob], filename, { type: "image/png" });
    const shareData = {
      title: "Stock Harvesting Chart",
      text: "Scanner chart snapshot",
      files: [file],
    };
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };

    if (nav.share && (!nav.canShare || nav.canShare(shareData))) {
      try {
        await nav.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
  }

  downloadBlob(blob, filename);
}
