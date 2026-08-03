import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Time } from "lightweight-charts";
import NextImage from "next/image";
import type { Candle, ScanBand, Stock } from "@/types/market";
import { getBrandLogoPath } from "@/components/ui/brand-logo-paths";
import { Spinner } from "@/components/ui/spinner";
import { useCurrency } from "@/features/currency";
import { useDelayedFlag } from "@/hooks/use-delayed-flag";
import { formatCompactVolume, formatSignedChange } from "@/utils/formatters";
import type { ScannerChartHandles } from "../hooks/use-lightweight-candlestick-chart";
import type { ScannerBacktestStats } from "../api/scanner-api.types";
import { getScannerChartTheme } from "../lib/scanner-chart-config";
import { getChartCursorCss } from "../tools/cursor-tool-config";
import { TIMEFRAME_LABEL } from "../types";
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
  const [hoveredCandleTime, setHoveredCandleTime] = useState<string | null>(
    null,
  );
  const latestSignalActive = scanBands.some(
    (band) => band.latestMatched === true,
  );
  const candleByTime = useMemo(
    () => new Map(candles.map((candle) => [candle.time, candle])),
    [candles],
  );
  const hoveredCandle = hoveredCandleTime
    ? (candleByTime.get(hoveredCandleTime) ?? null)
    : null;
  // Most candle fetches are cache hits (10min+ staleTime) — only show the
  // loading card if it's genuinely still fetching after a beat, so a
  // symbol/timeframe switch doesn't flash a spinner it doesn't need to.
  const showChartLoading = useDelayedFlag(loading && candles.length === 0);

  useEffect(() => {
    if (!captureRequest || !stageRef.current) return;

    void captureStageImage(
      stageRef.current,
      `${stock.symbol}-${timeframe}-scanner.jpg`,
      captureRequest.mode,
      theme,
      buildShareText(stock, timeframe, candles, formatStockCurrency),
      stock,
      timeframe,
      candles,
      latestSignalActive,
      backtestStats,
      formatStockCurrency,
    );
  }, [
    backtestStats,
    candles,
    captureRequest,
    formatStockCurrency,
    latestSignalActive,
    stock,
    theme,
    timeframe,
  ]);

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
      container.querySelectorAll<HTMLElement>("canvas").forEach((element) => {
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
        const overPriceAxis =
          priceScaleWidth > 0 && x >= rect.width - priceScaleWidth;
        const overTimeAxis =
          timeScaleHeight > 0 && y >= rect.height - timeScaleHeight;

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
      container.querySelectorAll<HTMLElement>("canvas").forEach((element) => {
        element.style.cursor = "";
      });
    };
  }, [chartCursor, chartHandles, containerRef]);

  useEffect(() => {
    const chart = chartHandles?.chart;
    if (!chart) return;

    const handleCrosshairMove = (param: { time?: Time }) => {
      const nextTime = normalizeChartTime(param.time);
      setHoveredCandleTime((current) =>
        current === nextTime ? current : nextTime,
      );
    };

    try {
      chart.subscribeCrosshairMove(handleCrosshairMove);
    } catch {
      return;
    }

    return () => {
      try {
        chart.unsubscribeCrosshairMove(handleCrosshairMove);
      } catch {}
    };
  }, [chartHandles]);

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
      <div className="pointer-events-none absolute bottom-9 right-20 z-20 flex max-w-27.5 select-none justify-end bg-transparent opacity-80 sm:bottom-10 sm:right-20 sm:max-w-45">
        <NextImage
          src={getBrandLogoPath(theme)}
          alt=""
          width={220}
          height={70}
          className="h-6 w-auto object-contain sm:h-9"
          unoptimized
        />
      </div>
      <ChartInfoOverlay
        stock={stock}
        timeframe={timeframe}
        candles={candles}
        activeCandle={hoveredCandle}
        latestSignalActive={latestSignalActive}
      />
      <ScannerBacktestStatsOverlay stats={backtestStats} />
      {showChartLoading && (
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
            series={chartHandles.series}
            bands={scanBands}
            candleTimes={candleTimes}
            theme={theme}
          />
          <DrawingOverlay
            chart={chartHandles.chart}
            series={chartHandles.series}
            containerRef={containerRef}
            candleTimes={candleTimes}
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
  shareText: string,
  stock: Stock,
  timeframe: Timeframe,
  candles: Candle[],
  latestSignalActive: boolean,
  backtestStats: ScannerBacktestStats | null,
  formatStockCurrency: (value: number, exchange: string) => string,
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
      canvasRect.height,
    );
  }

  for (const band of Array.from(
    stage.querySelectorAll<HTMLElement>("[data-scan-band]"),
  )) {
    const bandRect = band.getBoundingClientRect();
    context.fillStyle = window.getComputedStyle(band).backgroundColor;
    context.fillRect(
      bandRect.left - rect.left,
      bandRect.top - rect.top,
      bandRect.width,
      bandRect.height,
    );
  }

  for (const svg of Array.from(
    stage.querySelectorAll<SVGSVGElement>("[data-drawing-overlay]"),
  )) {
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
      svgRect.height,
    );
    URL.revokeObjectURL(url);
  }

  await drawCenteredScreenshotWatermark(context, rect, theme);
  await drawBottomRightScreenshotLogo(context, rect, theme);
  drawChartInfoScreenshotOverlay(
    context,
    stock,
    timeframe,
    candles,
    latestSignalActive,
    theme,
    formatStockCurrency,
  );
  drawBacktestStatsScreenshotOverlay(context, backtestStats, rect, theme);

  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) return;

  // Sharing must never silently fall back to downloading the file — a user
  // picking "Share via device" only expects the native share sheet to open,
  // not an unprompted download if that sheet fails or isn't actually
  // supported. Download is its own explicit menu action (mode === "download").
  if (mode === "share") {
    const file = new File([blob], filename, { type: "image/jpeg" });
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
      } catch {
      }
    }

    return;
  }

  downloadBlob(blob, filename);
}

function buildShareText(
  stock: Stock,
  timeframe: Timeframe,
  candles: Candle[],
  formatStockCurrency: (value: number, exchange: string) => string,
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

function getScreenshotTextColors(theme: ScannerTheme) {
  return theme === "dark"
    ? {
        text: "#d8e2f0",
        muted: "#91a3ba",
        panel: "rgba(15, 23, 42, 0.9)",
        border: "rgba(148, 163, 184, 0.28)",
        primary: "#f8b800",
        success: "#00d084",
        danger: "#ff4d67",
      }
    : {
        text: "#172033",
        muted: "#51627a",
        panel: "rgba(255, 255, 255, 0.92)",
        border: "rgba(88, 103, 125, 0.22)",
        primary: "#f8b800",
        success: "#008f5d",
        danger: "#e3344f",
      };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function normalizeChartTime(time: Time | undefined) {
  if (!time) return null;
  if (typeof time === "string") return time;
  if (typeof time === "number") return String(time);
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
}

function drawChartInfoScreenshotOverlay(
  context: CanvasRenderingContext2D,
  stock: Stock,
  timeframe: Timeframe,
  candles: Candle[],
  latestSignalActive: boolean,
  theme: ScannerTheme,
  formatStockCurrency: (value: number, exchange: string) => string,
) {
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;
  if (!last || !prev) return;

  const colors = getScreenshotTextColors(theme);
  const change = last.close - prev.close;
  const changePct = prev.close ? (change / prev.close) * 100 : 0;
  const { text: changeText, isPositive } = formatSignedChange(
    change,
    changePct,
  );
  const x = 14;
  const y = 19;

  context.save();
  context.font = "700 15px Arial, sans-serif";
  context.fillStyle = colors.text;
  context.fillText(stock.symbol, x, y);
  const symbolWidth = context.measureText(stock.symbol).width;

  context.font = "12px Arial, sans-serif";
  context.fillStyle = colors.muted;
  const metaText = `${TIMEFRAME_LABEL[timeframe]} - ${stock.exchange}`;
  const metaX = x + symbolWidth + 8;
  context.fillText(metaText, metaX, y);
  const metaWidth = context.measureText(metaText).width;

  if (latestSignalActive) {
    const badgeX = metaX + metaWidth + 10;
    drawRoundedRect(context, badgeX, y - 14, 44, 19, 4);
    context.fillStyle = "rgba(248, 184, 0, 0.16)";
    context.fill();
    context.fillStyle = colors.primary;
    context.font = "700 10px Arial, sans-serif";
    context.fillText("Signal", badgeX + 7, y);
  }

  const detailY = y + 25;
  const details = [
    ["O", formatStockCurrency(last.open, stock.exchange), colors.text],
    ["H", formatStockCurrency(last.high, stock.exchange), colors.text],
    ["L", formatStockCurrency(last.low, stock.exchange), colors.text],
    ["C", formatStockCurrency(last.close, stock.exchange), colors.text],
    ["", changeText, isPositive ? colors.success : colors.danger],
    ["V", formatCompactVolume(last.volume), colors.text],
  ];
  let cursorX = x;

  context.font = "12px Arial, sans-serif";
  for (const [label, value, color] of details) {
    context.fillStyle = label ? colors.muted : color;
    if (label) {
      context.fillText(label, cursorX, detailY);
      cursorX += context.measureText(label).width + 4;
    }
    context.fillStyle = color;
    context.fillText(value, cursorX, detailY);
    cursorX += context.measureText(value).width + 15;
  }
  context.restore();
}

function drawBacktestStatsScreenshotOverlay(
  context: CanvasRenderingContext2D,
  stats: ScannerBacktestStats | null,
  rect: DOMRect,
  theme: ScannerTheme,
) {
  if (!stats) return;

  const colors = getScreenshotTextColors(theme);
  const rows = [
    ["Hit Ratio", `${stats.hitRatePct.toFixed(1)}%`, colors.text],
    [
      "Total Return",
      `${stats.totalReturnPct >= 0 ? "+" : ""}${stats.totalReturnPct.toFixed(1)}%`,
      stats.totalReturnPct >= 0 ? colors.success : colors.danger,
    ],
    ["Max Drawdown", `${stats.maxDrawdownPct.toFixed(1)}%`, colors.danger],
    [
      "Profit Factor",
      stats.profitFactor === null ? "inf" : stats.profitFactor.toFixed(2),
      colors.text,
    ],
    ["Signals Generated", String(stats.signalsGenerated), colors.text],
    ["Avg Holding", `${Math.round(stats.avgHoldingDays)} Days`, colors.text],
    [
      "Largest Winner",
      `+${stats.largestWinnerPct.toFixed(1)}%`,
      colors.success,
    ],
    ["Largest Loser", `${stats.largestLoserPct.toFixed(1)}%`, colors.danger],
  ];

  const width = 236;
  const rowHeight = 21;
  const paddingX = 14;
  const topPadding = 22;
  const height = topPadding + rows.length * rowHeight + 10;
  const x = 14;
  const y = Math.max(
    76,
    Math.min(rect.height - height - 80, rect.height / 2 - height / 2),
  );

  context.save();
  drawRoundedRect(context, x, y, width, height, 8);
  context.fillStyle = colors.panel;
  context.fill();
  context.strokeStyle = colors.border;
  context.lineWidth = 1;
  context.stroke();

  rows.forEach(([label, value, valueColor], index) => {
    const rowY = y + topPadding + index * rowHeight;
    context.textAlign = "left";
    context.font = "12px Arial, sans-serif";
    context.fillStyle = colors.muted;
    context.fillText(`${label}:`, x + paddingX, rowY);

    context.textAlign = "right";
    context.font = "700 12px Arial, sans-serif";
    context.fillStyle = valueColor;
    context.fillText(value, x + width - paddingX, rowY);
  });
  context.textAlign = "left";
  context.restore();
}

async function drawCenteredScreenshotWatermark(
  context: CanvasRenderingContext2D,
  rect: DOMRect,
  theme: ScannerTheme,
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
    context.globalAlpha = 0.22;
    context.drawImage(image, x, y, width, height);
    context.restore();
  } catch {}
}

async function drawBottomRightScreenshotLogo(
  context: CanvasRenderingContext2D,
  rect: DOMRect,
  theme: ScannerTheme,
) {
  try {
    const image = await loadImage(getBrandLogoPath(theme));
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const maxWidth = Math.min(rect.width * 0.13, 210);
    const maxHeight = Math.min(rect.height * 0.07, 58);
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    const x = rect.width - width - 72;
    const y = rect.height - height - 42;

    context.save();
    context.globalAlpha = 0.92;
    context.drawImage(image, x, y, width, height);
    context.restore();
  } catch {}
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
