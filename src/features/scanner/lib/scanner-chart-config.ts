import { ColorType, CrosshairMode, LineStyle, LineType } from "lightweight-charts";
import type { ScannerChartType, ScannerTheme } from "../types";

export const SCANNER_CHART_COLORS = {
  green: "#22C55E",
  red: "#EF4444",
  gold: "#F5B800",
  panelBackground: "#080D12",
  text: "#94A3B8",
  scaleBorder: "rgba(255,255,255,0.08)",
  volumeGreen: "rgba(34,197,94,0.38)",
  volumeRed: "rgba(239,68,68,0.34)",
} as const;

export const SCANNER_CHART_THEMES: Record<
  ScannerTheme,
  {
    panelBackground: string;
    text: string;
    scaleBorder: string;
    crosshair: string;
    volumeGreen: string;
    volumeRed: string;
  }
> = {
  dark: {
    panelBackground: "#080D12",
    text: "#94A3B8",
    scaleBorder: "rgba(255,255,255,0.08)",
    crosshair: "rgba(226,232,240,0.58)",
    volumeGreen: "rgba(34,197,94,0.38)",
    volumeRed: "rgba(239,68,68,0.34)",
  },
  light: {
    panelBackground: "#FFFFFF",
    text: "#475569",
    scaleBorder: "rgba(15,23,42,0.14)",
    crosshair: "rgba(51,65,85,0.58)",
    volumeGreen: "rgba(22,163,74,0.28)",
    volumeRed: "rgba(220,38,38,0.24)",
  },
};

export const SCANNER_CHART_LAYOUT = {
  futureWhitespaceBars: 24,
  visibleBarsTarget: 185,
  barSpacing: 8,
  minBarSpacing: 4,
  candleScaleMargins: { top: 0.04, bottom: 0.13 },
  volumeScaleMargins: { top: 0.91, bottom: 0 },
} as const;

export function getScannerThemeClass(theme: ScannerTheme) {
  return `scanner-shell ${theme === "dark" ? "scanner-dark" : "scanner-light"}`;
}

export function getScannerChartTheme(theme: ScannerTheme) {
  return SCANNER_CHART_THEMES[theme];
}

export function scannerCrosshairOptions(
  visible: boolean,
  theme: ScannerTheme = "dark"
) {
  return {
    mode: CrosshairMode.Normal,
    vertLine: {
      visible,
      color: getScannerChartTheme(theme).crosshair,
      width: 1 as const,
      style: LineStyle.Dashed,
    },
    horzLine: {
      visible,
      color: getScannerChartTheme(theme).crosshair,
      width: 1 as const,
      style: LineStyle.Dashed,
    },
  };
}

export function createScannerChartOptions(theme: ScannerTheme = "dark") {
  const colors = getScannerChartTheme(theme);

  return {
    layout: {
      background: {
        type: ColorType.Solid,
        color: "rgba(0,0,0,0)",
      },
      textColor: colors.text,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
    },
    rightPriceScale: { borderColor: colors.scaleBorder },
    timeScale: { borderColor: colors.scaleBorder },
    crosshair: scannerCrosshairOptions(true, theme),
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: {
        time: true,
        price: true,
      },
      axisDoubleClickReset: {
        time: true,
        price: false,
      },
    },
  };
}

export const scannerChartOptions = createScannerChartOptions("dark");

export function createScannerCandleSeriesOptions() {
  return {
    upColor: SCANNER_CHART_COLORS.green,
    downColor: SCANNER_CHART_COLORS.red,
    borderVisible: false,
    wickUpColor: SCANNER_CHART_COLORS.green,
    wickDownColor: SCANNER_CHART_COLORS.red,
    priceLineVisible: true,
    priceLineColor: SCANNER_CHART_COLORS.gold,
    priceLineStyle: LineStyle.Dashed,
  };
}

export const scannerCandleSeriesOptions = createScannerCandleSeriesOptions();

export function createScannerHollowCandleSeriesOptions() {
  return {
    ...createScannerCandleSeriesOptions(),
    upColor: "rgba(255,255,255,0)",
    borderVisible: true,
    borderUpColor: SCANNER_CHART_COLORS.green,
    borderDownColor: SCANNER_CHART_COLORS.red,
  };
}

export const scannerHollowCandleSeriesOptions =
  createScannerHollowCandleSeriesOptions();

export function createScannerBarSeriesOptions() {
  return {
    upColor: SCANNER_CHART_COLORS.green,
    downColor: SCANNER_CHART_COLORS.red,
    openVisible: true,
    thinBars: false,
    priceLineVisible: true,
    priceLineColor: SCANNER_CHART_COLORS.gold,
    priceLineStyle: LineStyle.Dashed,
  };
}

export const scannerBarSeriesOptions = createScannerBarSeriesOptions();

export function createScannerHlcBarSeriesOptions() {
  return {
    ...createScannerBarSeriesOptions(),
    openVisible: false,
  };
}

export const scannerHlcBarSeriesOptions = createScannerHlcBarSeriesOptions();

export function createScannerLineSeriesOptions() {
  return {
    color: SCANNER_CHART_COLORS.gold,
    lineWidth: 2 as const,
    lineType: LineType.Simple,
    pointMarkersVisible: false,
    crosshairMarkerVisible: true,
    priceLineVisible: true,
    priceLineColor: SCANNER_CHART_COLORS.gold,
    priceLineStyle: LineStyle.Dashed,
  };
}

export const scannerLineSeriesOptions = createScannerLineSeriesOptions();

export function createScannerLineWithMarkersSeriesOptions() {
  return {
    ...createScannerLineSeriesOptions(),
    pointMarkersVisible: true,
    pointMarkersRadius: 3,
  };
}

export const scannerLineWithMarkersSeriesOptions =
  createScannerLineWithMarkersSeriesOptions();

export function createScannerStepLineSeriesOptions() {
  return {
    ...createScannerLineSeriesOptions(),
    lineType: LineType.WithSteps,
  };
}

export const scannerStepLineSeriesOptions = createScannerStepLineSeriesOptions();

export function createScannerSeriesOptions(
  _theme: ScannerTheme,
  chartType: ScannerChartType
) {
  if (chartType === "bar-ohlc") return createScannerBarSeriesOptions();
  if (chartType === "bar-hlc") return createScannerHlcBarSeriesOptions();
  if (chartType === "line") return createScannerLineSeriesOptions();
  if (chartType === "line-markers") {
    return createScannerLineWithMarkersSeriesOptions();
  }
  if (chartType === "step-line") return createScannerStepLineSeriesOptions();
  if (chartType === "hollow-candles") {
    return createScannerHollowCandleSeriesOptions();
  }
  return createScannerCandleSeriesOptions();
}

export const scannerVolumeSeriesOptions = {
  priceFormat: { type: "volume" as const },
  priceScaleId: "volume",
  lastValueVisible: false,
  priceLineVisible: false,
};
