import { useEffect, useRef, type RefObject } from "react";
import NextImage from "next/image";
import type { Candle, ScanBand, Stock } from "@/types/market";
import { getBrandLogoPath } from "@/components/ui/brand-logo-paths";
import { Spinner } from "@/components/ui/spinner";
import { useCurrency } from "@/features/currency";
import { formatCompactVolume, formatSignedChange } from "@/utils/formatters";
import type { ScannerChartHandles } from "../hooks/use-lightweight-candlestick-chart";
import type { ScannerBacktestStats } from "../api/scanner-api.types";
import { getScannerChartTheme } from "../lib/scanner-chart-config";
import { getChartCursorCss } from "../tools/cursor-tool-config";
import type {
  ChartCaptureRequest,
  DrawingController,
  ScannerTheme,
  Timeframe,
} from "../types";
import { ChartInfoOverlay } from "./ChartInfoOverlay";
import { ScanBandOverlay } from "./ScanBandOverlay";
import { ScannerBacktestStatsOverlay } from "./ScannerBacktestStatsOverlay";
import { DrawingOverlay } from "./DrawingOverlay";

type ScannerChartStageProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  chartHandles: ScannerChartHandles | null;
  stock: Stock;
  timeframe: Timeframe;
  candles: Candle[];
  candleTimes: string[];
  scanBands: ScanBand[];
  loading: boolean;
  captureRequest: ChartCaptureRequest | null;
  drawing: DrawingController;
  theme: ScannerTheme;
  backtestStats: ScannerBacktestStats | null;
};

export function ScannerChartStage({
  containerRef,
  chartHandles,
  stock,
  timeframe,
  candles,
  candleTimes,
  scanBands,
  loading,
  captureRequest,
  drawing,
  theme,
  backtestStats,
}: ScannerChartStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const chartCursor = getChartCursorCss(drawing.activeTool);
  const chartTheme = getScannerChartTheme(theme);
  const { formatStockCurrency } = useCurrency();
  const latestSignalActive = scanBands.some(
    (band) => band.latestMatched === true
  );

  useEffect(() => {
    if (!captureRequest || !stageRef.current) return;

    void captureStageImage(
      stageRef.current,
        `${stock.symbol}-${timeframe}-scanner.png`,
        captureRequest.mode,
        theme,
        buildShareText(stock, timeframe, candles, formatStockCurrency)
      );
  }, [candles, captureRequest, formatStockCurrency, stock, theme, timeframe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Hovering the price scale (right strip) or time scale (bottom strip)
    // shows a resize/"stretch" cursor, since dragging there scales that axis
    // (lightweight-charts' own axisPressedMouseMove behavior) — everywhere
    // else keeps the active drawing tool's cursor. A MutationObserver keeps
    // re-applying the current cursor to newly (re)created canvases, since
    // lightweight-charts recreates its canvas elements on internal updates.
    let activeCursor = chartCursor;

    const applyCursor = () => {
      container.style.cursor = activeCursor;
      container
        .querySelectorAll<HTMLElement>("canvas")
        .forEach((element) => {
          element.style.cursor = activeCursor;
        });
    };

    const resolveCursorForPoint = (clientX: number, clientY: number) => {
      const chart = chartHandles?.chart;
      if (!chart) return chartCursor;

      try {
        const rect = container.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const priceScaleWidth = chart.priceScale("right").width();
        const timeScaleHeight = chart.timeScale().height();
        const overPriceAxis = priceScaleWidth > 0 && x >= rect.width - priceScaleWidth;
        const overTimeAxis = timeScaleHeight > 0 && y >= rect.height - timeScaleHeight;

        if (overPriceAxis && overTimeAxis) return "nwse-resize";
        if (overPriceAxis) return "ns-resize";
        if (overTimeAxis) return "ew-resize";
      } catch {
        // Chart may be mid-teardown; fall through to the default cursor.
      }

      return chartCursor;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const nextCursor = resolveCursorForPoint(event.clientX, event.clientY);
      if (nextCursor === activeCursor) return;
      activeCursor = nextCursor;
      applyCursor();
    };

    const handlePointerLeave = () => {
      if (activeCursor === chartCursor) return;
      activeCursor = chartCursor;
      applyCursor();
    };

    applyCursor();
    const observer = new MutationObserver(applyCursor);
    observer.observe(container, { childList: true, subtree: true });
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      observer.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.style.cursor = "";
      container
        .querySelectorAll<HTMLElement>("canvas")
        .forEach((element) => {
          element.style.cursor = "";
        });
    };
  }, [chartCursor, chartHandles, containerRef]);

  return (
    <div
      ref={stageRef}
      className="relative h-full min-h-0 w-full min-w-0 overflow-hidden"
      style={{
        backgroundColor: chartTheme.panelBackground,
        cursor: chartCursor,
      }}
    >
      <div ref={containerRef} className="relative z-10 h-full w-full" />
      <div className="pointer-events-none absolute bottom-12 right-14 z-20 flex max-w-[160px] select-none justify-end opacity-45 sm:bottom-10 sm:right-16">
        <NextImage
          src={getBrandLogoPath(theme)}
          alt=""
          width={220}
          height={70}
          className="h-7 w-auto object-contain sm:h-8"
          unoptimized
        />
      </div>
      <ChartInfoOverlay
        stock={stock}
        timeframe={timeframe}
        candles={candles}
        latestSignalActive={latestSignalActive}
      />
      <ScannerBacktestStatsOverlay stats={backtestStats} />
      {loading && candles.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-background/35">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-popover/90 px-4 py-3 text-sm font-medium text-foreground shadow-lg">
            <Spinner size="sm" />
            Loading {stock.symbol} {timeframe} candles...
          </div>
        </div>
      )}

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
            exchange={stock.exchange}
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
  theme: ScannerTheme,
  shareText: string
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

  await drawCenteredScreenshotWatermark(context, rect, theme);
  await drawScreenshotWatermark(context, rect, theme);

  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, "image/png")
  );
  if (!blob) return;

  if (mode === "share") {
    const file = new File([blob], filename, { type: "image/png" });
    const shareData = {
      title: "Stock Harvesting Chart",
      text: shareText,
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

function buildShareText(
  stock: Stock,
  timeframe: Timeframe,
  candles: Candle[],
  formatStockCurrency: (value: number, exchange: string) => string
) {
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2] ?? latest;

  if (!latest) {
    return `Stock Harvesting scanner snapshot\n${stock.symbol} (${stock.exchange}) - ${timeframe}`;
  }

  const change = latest.close - previous.close;
  const changePct = previous.close ? (change / previous.close) * 100 : 0;
  const { text: changeText } = formatSignedChange(change, changePct);

  return [
    `Stock Harvesting scanner snapshot`,
    `${stock.symbol} (${stock.exchange}) - ${timeframe}`,
    `Close: ${formatStockCurrency(latest.close, stock.exchange)}`,
    `Change: ${changeText}`,
    `Open: ${formatStockCurrency(latest.open, stock.exchange)}`,
    `High: ${formatStockCurrency(latest.high, stock.exchange)}`,
    `Low: ${formatStockCurrency(latest.low, stock.exchange)}`,
    `Volume: ${formatCompactVolume(latest.volume)}`,
  ].join("\n");
}

async function drawCenteredScreenshotWatermark(
  context: CanvasRenderingContext2D,
  rect: DOMRect,
  theme: ScannerTheme
) {
  try {
    const image = await loadImage(getBrandLogoPath(theme));
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const maxWidth = Math.min(rect.width * 0.34, 420);
    const maxHeight = Math.min(rect.height * 0.22, 180);
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    const x = (rect.width - width) / 2;
    const y = (rect.height - height) / 2;

    context.save();
    context.globalAlpha = 0.12;
    context.drawImage(image, x, y, width, height);
    context.restore();
  } catch {
  }
}

async function drawScreenshotWatermark(
  context: CanvasRenderingContext2D,
  rect: DOMRect,
  theme: ScannerTheme
) {
  const padding = 10;

  context.save();
  const logoWidth = Math.min(160, Math.max(110, rect.width * 0.13));
  let logoHeight = 34;

  try {
    const image = await loadImage(getBrandLogoPath(theme));
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    logoHeight = logoWidth * (imageHeight / imageWidth);

    const width = logoWidth + padding * 2;
    const height = logoHeight + padding * 2;
    const x = Math.max(10, rect.width - width - 14);
    const y = Math.max(10, rect.height - height - 12);

    context.globalAlpha = 0.92;
    context.fillStyle =
      theme === "dark" ? "rgba(8,13,18,0.72)" : "rgba(255,255,255,0.78)";
    context.strokeStyle =
      theme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.12)";
    roundedRect(context, x, y, width, height, 7);
    context.fill();
    context.stroke();

    context.drawImage(
      image,
      x + padding,
      y + padding,
      logoWidth,
      logoHeight
    );
  } catch {
    const font = "600 12px Arial, sans-serif";
    const text = "Stock Harvesting";
    context.font = font;
    const width = context.measureText(text).width + padding * 2;
    const height = 34;
    const x = Math.max(10, rect.width - width - 14);
    const y = Math.max(10, rect.height - height - 12);

    context.globalAlpha = 0.92;
    context.fillStyle =
      theme === "dark" ? "rgba(8,13,18,0.72)" : "rgba(255,255,255,0.78)";
    context.strokeStyle =
      theme === "dark" ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.12)";
    roundedRect(context, x, y, width, height, 7);
    context.fill();
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = "#F5B800";
    context.fillText(text, x + padding, y + 21);
  }
  context.restore();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
