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
  // Only used by "open-tab": a blank tab opened synchronously in the click
  // handler (before any async capture work) so the browser's popup blocker
  // sees it as directly gesture-triggered. The capture pipeline navigates
  // this tab to the finished image once the blob is ready, instead of
  // calling window.open() itself well after the gesture.
  targetWindow?: Window | null;
};
