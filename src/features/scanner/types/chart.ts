import type { SCANNER_CHART_TYPES } from "../constants/chart-types";
import type { SCANNER_RANGE_FILTERS } from "../constants/range-filters";
import type { TIMEFRAMES } from "../constants/timeframes";

export type Timeframe = (typeof TIMEFRAMES)[number];

export type ScannerTheme = "light" | "dark";

export type ScannerRangeFilter = (typeof SCANNER_RANGE_FILTERS)[number];

export type ScannerChartType = (typeof SCANNER_CHART_TYPES)[number];

export type ChartCaptureMode = "download" | "share" | "copy" | "open-tab";

export type ChartCaptureRequest = {
  id: number;
  mode: ChartCaptureMode;

  targetWindow?: Window | null;
};
