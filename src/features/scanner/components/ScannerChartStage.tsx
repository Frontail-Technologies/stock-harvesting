import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Time } from "lightweight-charts";
import NextImage from "next/image";
import type { Candle, ScanBand, Stock } from "@/types/market";
import { getBrandLogoPath } from "@/components/ui/brand-logo-paths";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useCurrency } from "@/features/currency";
import { useDelayedFlag } from "@/hooks/use-delayed-flag";
import { downloadBlob } from "@/utils/download-blob";
import { formatCompactVolume, formatSignedChange } from "@/utils/formatters";
import type { ScannerChartHandles } from "../hooks/use-lightweight-candlestick-chart";
import type { ScannerBacktestStats } from "../api/scanner-api.types";
import { getScannerChartTheme } from "../lib/scanner-chart-config";
import { useScannerUiStore } from "../stores/scanner-ui-store";
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

const WATERMARK_SAFE_GAP_PX = 18;

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
  scannerHighlightsVisible: boolean;
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
  scannerHighlightsVisible,
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

  const showChartLoading = useDelayedFlag(loading && candles.length === 0);

  const lastProcessedCaptureId = useScannerUiStore((state) => state.lastProcessedCaptureId);
  const markCaptureProcessed = useScannerUiStore((state) => state.markCaptureProcessed);

  useEffect(() => {
    preloadBrandLogo("dark").catch(() => {});
    preloadBrandLogo("light").catch(() => {});
  }, []);

  const [priceScaleWidth, setPriceScaleWidth] = useState(0);

  useEffect(() => {
    const chart = chartHandles?.chart;
    const container = stageRef.current;
    if (!chart || !container) return;

    const updatePriceScaleWidth = () => {
      try {
        setPriceScaleWidth(chart.priceScale("right").width());
      } catch {
        // chart may be mid-teardown
      }
    };

    updatePriceScaleWidth();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updatePriceScaleWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [chartHandles, candles]);

  useEffect(() => {
    if (!captureRequest || !stageRef.current) return;

    if (lastProcessedCaptureId === captureRequest.id) return;
    markCaptureProcessed(captureRequest.id);

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
      captureRequest.targetWindow,
    );
  }, [
    backtestStats,
    candles,
    captureRequest,
    formatStockCurrency,
    lastProcessedCaptureId,
    latestSignalActive,
    markCaptureProcessed,
    stock,
    theme,
    timeframe,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
      <div
        className="pointer-events-none absolute bottom-9 z-20 flex select-none items-center gap-1 bg-transparent opacity-60 sm:bottom-10"
        style={{ right: priceScaleWidth + WATERMARK_SAFE_GAP_PX }}
      >
        <NextImage
          src={getBrandLogoPath(theme)}
          alt=""
          width={220}
          height={70}
          loading="eager"
          className="h-3.5 w-auto shrink-0 object-contain sm:h-4.5"
          unoptimized
        />
        <span
          className="flex shrink-0 items-baseline gap-1 whitespace-nowrap text-[0.6875rem] font-bold leading-none tracking-tight sm:text-sm"
          style={{ color: getScreenshotTextColors(theme).text }}
        >
          <span>Stock</span>
          <span style={{ color: getScreenshotTextColors(theme).primary }}>Harvesting</span>
        </span>
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
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-foreground sm:gap-2 sm:px-4 sm:py-3 sm:text-sm">
            <Spinner size="sm" />
            Loading {stock.symbol} {timeframe} candles...
          </div>
        </div>
      )}

      {chartHandles && (
        <>
          {scannerHighlightsVisible && (
            <ScanBandOverlay
              series={chartHandles.series}
              bands={scanBands}
              candleTimes={candleTimes}
              theme={theme}
              hoveredTime={hoveredCandleTime}
            />
          )}
          <DrawingOverlay
            chart={chartHandles.chart}
            series={chartHandles.series}
            containerRef={containerRef}
            candleTimes={candleTimes}
            candles={candles}
            drawing={drawing}
            exchange={stock.exchange}
          />
        </>
      )}
    </div>
  );
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
  targetWindow?: Window | null,
) {
  try {
    const rect = stage.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const output = document.createElement("canvas");
    output.width = Math.max(1, Math.round(rect.width * ratio));
    output.height = Math.max(1, Math.round(rect.height * ratio));

    const context = output.getContext("2d");
    if (!context) {
      console.warn("[scanner] screenshot capture aborted: no 2d context");
      toast.error("Unable to capture chart");
      return;
    }

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
      const svgBlob = new Blob([text], {
        type: "image/svg+xml;charset=utf-8",
      });
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
    if (!blob) {
      console.warn("[scanner] screenshot capture aborted: toBlob returned null");
      toast.error("Unable to capture chart");
      return;
    }

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

    if (mode === "copy") {
      const nav = navigator as Navigator & {
        clipboard?: { write?: (items: unknown[]) => Promise<void> };
      };

      if (!nav.clipboard?.write || typeof ClipboardItem === "undefined") {
        toast.error("Copy image is not supported in this browser.");
        return;
      }

      try {

        const pngBlob = await new Promise<Blob | null>((resolve) =>
          output.toBlob(resolve, "image/png"),
        );
        if (!pngBlob) {
          toast.error("Unable to copy image");
          return;
        }
        await nav.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
        toast.success("Chart image copied");
      } catch (error) {
        console.error("[scanner] copy image failed", error);
        toast.error("Unable to copy image");
      }

      return;
    }

    if (mode === "open-tab") {

      const url = URL.createObjectURL(blob);
      if (targetWindow && !targetWindow.closed) {
        targetWindow.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    downloadBlob(blob, filename);
  } catch (error) {

    console.error("[scanner] screenshot capture failed", error);
    toast.error("Unable to capture chart");
  }
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
  const metaText = stock.exchange;
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

  const priceY = y + 24;
  const priceText = formatStockCurrency(last.close, stock.exchange);
  context.font = "700 17px Arial, sans-serif";
  context.fillStyle = colors.text;
  context.fillText(priceText, x, priceY);
  const priceWidth = context.measureText(priceText).width;

  context.font = "700 13px Arial, sans-serif";
  context.fillStyle = isPositive ? colors.success : colors.danger;
  context.fillText(changeText, x + priceWidth + 10, priceY);

  const detailY = priceY + 20;
  const details = [
    ["O", formatStockCurrency(last.open, stock.exchange)],
    ["H", formatStockCurrency(last.high, stock.exchange)],
    ["L", formatStockCurrency(last.low, stock.exchange)],
    ["C", formatStockCurrency(last.close, stock.exchange)],
    ["V", formatCompactVolume(last.volume)],
  ];
  let cursorX = x;

  context.font = "11px Arial, sans-serif";
  for (const [label, value] of details) {
    context.fillStyle = colors.muted;
    context.fillText(label, cursorX, detailY);
    cursorX += context.measureText(label).width + 4;
    context.fillText(value, cursorX, detailY);
    cursorX += context.measureText(value).width + 14;
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
  const headerHeight = 30;
  const topPadding = headerHeight + 12;
  const height = topPadding + rows.length * rowHeight + 10;
  const x = 14;
  const y = Math.max(
    76,
    Math.min(rect.height - height - 80, rect.height / 2 - height / 2),
  );

  context.save();
  drawRoundedRect(context, x, y, width, height, 6);
  context.fillStyle = colors.panel;
  context.fill();
  context.strokeStyle = colors.border;
  context.lineWidth = 1;
  context.stroke();

  context.textAlign = "left";
  context.font = "700 10px Arial, sans-serif";
  context.fillStyle = colors.muted;
  context.fillText("PERFORMANCE", x + paddingX, y + 19);
  context.strokeStyle = colors.border;
  context.beginPath();
  context.moveTo(x, y + headerHeight);
  context.lineTo(x + width, y + headerHeight);
  context.stroke();

  const dividerBeforeIndex = rows.length - 2;

  rows.forEach(([label, value, valueColor], index) => {
    const rowY = y + topPadding + index * rowHeight;

    if (index === dividerBeforeIndex) {
      context.strokeStyle = colors.border;
      context.beginPath();
      context.moveTo(x + paddingX, rowY - rowHeight / 2);
      context.lineTo(x + width - paddingX, rowY - rowHeight / 2);
      context.stroke();
    }

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
    const image = await preloadBrandLogo(theme);
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
    const image = await preloadBrandLogo(theme);
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const maxWidth = Math.min(rect.width * 0.13, 210);
    const maxHeight = Math.min(rect.height * 0.07, 58);
    const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;

    const colors = getScreenshotTextColors(theme);
    const gap = 10;

    const fontSize = Math.round(height * 0.75);
    context.font = `700 ${fontSize}px Arial, sans-serif`;
    const stockText = "Stock";
    const harvestingText = "Harvesting";
    const wordGap = fontSize * 0.18;
    const stockWidth = context.measureText(stockText).width;
    const harvestingWidth = context.measureText(harvestingText).width;
    const textWidth = stockWidth + wordGap + harvestingWidth;

    const totalWidth = width + gap + textWidth;
    const x = rect.width - totalWidth - 72;
    const y = rect.height - height - 42;

    context.save();
    context.globalAlpha = 0.92;
    context.drawImage(image, x, y, width, height);

    context.textBaseline = "alphabetic";
    const textY = y + height * 0.72;
    let textX = x + width + gap;
    context.fillStyle = colors.text;
    context.fillText(stockText, textX, textY);
    textX += stockWidth + wordGap;
    context.fillStyle = colors.primary;
    context.fillText(harvestingText, textX, textY);
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

const brandLogoCache = new Map<ScannerTheme, Promise<HTMLImageElement>>();

function preloadBrandLogo(theme: ScannerTheme) {
  let cached = brandLogoCache.get(theme);
  if (!cached) {
    cached = loadImage(getBrandLogoPath(theme));
    brandLogoCache.set(theme, cached);
    cached.catch(() => {
      if (brandLogoCache.get(theme) === cached) {
        brandLogoCache.delete(theme);
      }
    });
  }
  return cached;
}

