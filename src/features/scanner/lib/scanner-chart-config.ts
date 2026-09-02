import { ColorType, CrosshairMode, LineStyle, LineType } from "lightweight-charts";
import type { ScannerChartType, ScannerTheme } from "../types";

export type ScannerPriceFormatter = (price: number) => string;

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
    gridLine: string;
    highlightFill: string;
    highlightEdge: string;
    highlightFillSelected: string;
    highlightEdgeSelected: string;
  }
> = {
  dark: {
    panelBackground: "#0B0E11",
    text: "#94A3B8",
    scaleBorder: "rgba(255,255,255,0.08)",
    crosshair: "rgba(226,232,240,0.5)",
    volumeGreen: "rgba(34,197,94,0.3)",
    volumeRed: "rgba(239,68,68,0.26)",
    gridLine: "rgba(255,255,255,0.028)",

    highlightFill: "rgba(250,240,88,0.22)",
    highlightEdge: "rgba(250,204,21,0.12)",
    highlightFillSelected: "rgba(250,240,88,0.32)",
    highlightEdgeSelected: "rgba(250,204,21,0.18)",
  },
  light: {

    panelBackground: "#FAFAF8",
    text: "#73736E",
    scaleBorder: "#DDDCD7",
    crosshair: "rgba(24,25,24,0.55)",
    volumeGreen: "rgba(22,163,74,0.24)",
    volumeRed: "rgba(220,38,38,0.2)",
    gridLine: "rgba(24,25,24,0.065)",
    highlightFill: "rgba(250,240,88,0.3)",
    highlightEdge: "rgba(217,119,6,0.16)",
    highlightFillSelected: "rgba(250,240,88,0.42)",
    highlightEdgeSelected: "rgba(217,119,6,0.22)",
  },
};

export const SCANNER_CHART_LAYOUT = {

  futureWhitespaceBars: 12,
  visibleBarsTarget: 185,
  barSpacing: 8,
  minBarSpacing: 0.2,
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

      visible: false,
      labelVisible: visible,
      color: getScannerChartTheme(theme).crosshair,
      width: 1 as const,
      style: LineStyle.Dashed,
    },
    horzLine: {
      visible: false,
      labelVisible: visible,
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
      vertLines: { visible: true, color: colors.gridLine, style: LineStyle.Solid },
      horzLines: { visible: true, color: colors.gridLine, style: LineStyle.Solid },
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

function createScannerPriceFormat(priceFormatter?: ScannerPriceFormatter) {
  if (!priceFormatter) {
    return { type: "price" as const, precision: 2, minMove: 0.01 };
  }

  return {
    type: "custom" as const,
    minMove: 0.01,
    formatter: priceFormatter,
  };
}

export function createScannerCandleSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    upColor: SCANNER_CHART_COLORS.green,
    downColor: SCANNER_CHART_COLORS.red,
    borderVisible: false,
    wickUpColor: SCANNER_CHART_COLORS.green,
    wickDownColor: SCANNER_CHART_COLORS.red,
    priceLineVisible: true,
    priceLineColor: SCANNER_CHART_COLORS.gold,
    priceLineStyle: LineStyle.Dashed,
    priceLineWidth: 1 as const,
    priceFormat: createScannerPriceFormat(priceFormatter),
  };
}

export const scannerCandleSeriesOptions = createScannerCandleSeriesOptions();

export function createScannerHollowCandleSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    ...createScannerCandleSeriesOptions(priceFormatter),
    upColor: "rgba(255,255,255,0)",
    borderVisible: true,
    borderUpColor: SCANNER_CHART_COLORS.green,
    borderDownColor: SCANNER_CHART_COLORS.red,
  };
}

export const scannerHollowCandleSeriesOptions =
  createScannerHollowCandleSeriesOptions();

export function createScannerBarSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    upColor: SCANNER_CHART_COLORS.green,
    downColor: SCANNER_CHART_COLORS.red,
    openVisible: true,
    thinBars: false,
    priceLineVisible: true,
    priceLineColor: SCANNER_CHART_COLORS.gold,
    priceLineStyle: LineStyle.Dashed,
    priceLineWidth: 1 as const,
    priceFormat: createScannerPriceFormat(priceFormatter),
  };
}

export const scannerBarSeriesOptions = createScannerBarSeriesOptions();

export function createScannerHlcBarSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    ...createScannerBarSeriesOptions(priceFormatter),
    openVisible: false,
  };
}

export const scannerHlcBarSeriesOptions = createScannerHlcBarSeriesOptions();

export function createScannerLineSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    color: SCANNER_CHART_COLORS.gold,
    lineWidth: 2 as const,
    lineType: LineType.Simple,
    pointMarkersVisible: false,
    crosshairMarkerVisible: true,
    priceLineVisible: true,
    priceLineColor: SCANNER_CHART_COLORS.gold,
    priceLineStyle: LineStyle.Dashed,
    priceLineWidth: 1 as const,
    priceFormat: createScannerPriceFormat(priceFormatter),
  };
}

export const scannerLineSeriesOptions = createScannerLineSeriesOptions();

export function createScannerLineWithMarkersSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    ...createScannerLineSeriesOptions(priceFormatter),
    pointMarkersVisible: true,
    pointMarkersRadius: 3,
  };
}

export const scannerLineWithMarkersSeriesOptions =
  createScannerLineWithMarkersSeriesOptions();

export function createScannerStepLineSeriesOptions(
  priceFormatter?: ScannerPriceFormatter
) {
  return {
    ...createScannerLineSeriesOptions(priceFormatter),
    lineType: LineType.WithSteps,
  };
}

export const scannerStepLineSeriesOptions = createScannerStepLineSeriesOptions();

export function createScannerSeriesOptions(
  _theme: ScannerTheme,
  chartType: ScannerChartType,
  priceFormatter?: ScannerPriceFormatter
) {
  if (chartType === "bar-ohlc") {
    return createScannerBarSeriesOptions(priceFormatter);
  }
  if (chartType === "bar-hlc") {
    return createScannerHlcBarSeriesOptions(priceFormatter);
  }
  if (chartType === "line") return createScannerLineSeriesOptions(priceFormatter);
  if (chartType === "line-markers") {
    return createScannerLineWithMarkersSeriesOptions(priceFormatter);
  }
  if (chartType === "step-line") {
    return createScannerStepLineSeriesOptions(priceFormatter);
  }
  if (chartType === "hollow-candles") {
    return createScannerHollowCandleSeriesOptions(priceFormatter);
  }
  return createScannerCandleSeriesOptions(priceFormatter);
}

export const scannerVolumeSeriesOptions = {
  priceFormat: { type: "volume" as const },
  priceScaleId: "volume",
  lastValueVisible: false,
  priceLineVisible: false,
};
