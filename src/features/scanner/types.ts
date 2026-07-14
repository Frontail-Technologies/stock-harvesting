export type Timeframe = "1D" | "1W" | "1M";

export const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M"];

export type ScannerTheme = "light" | "dark";

export const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  "1D": "Daily",
  "1W": "Weekly",
  "1M": "Monthly",
};

export type ScannerRangeFilter =
  | "1D"
  | "2D"
  | "3D"
  | "5D"
  | "10D"
  | "1M"
  | "2M"
  | "3M"
  | "4M"
  | "6M"
  | "9M"
  | "1Y"
  | "2Y"
  | "3Y"
  | "5Y"
  | "8Y"
  | "ALL";

export const SCANNER_RANGE_FILTERS: ScannerRangeFilter[] = [
  "1D",
  "2D",
  "3D",
  "5D",
  "10D",
  "1M",
  "2M",
  "3M",
  "4M",
  "6M",
  "9M",
  "1Y",
  "2Y",
  "3Y",
  "5Y",
  "8Y",
  "ALL",
];

export type ScannerChartType =
  | "candlestick"
  | "bar-ohlc"
  | "bar-hlc"
  | "line"
  | "line-markers"
  | "step-line"
  | "hollow-candles";

export const SCANNER_CHART_TYPES: ScannerChartType[] = [
  "candlestick",
  "bar-ohlc",
  "bar-hlc",
  "line",
  "line-markers",
  "step-line",
  "hollow-candles",
];

export const SCANNER_CHART_TYPE_LABEL: Record<ScannerChartType, string> = {
  candlestick: "Candlestick",
  "bar-ohlc": "Bar OHLC",
  "bar-hlc": "Bar HLC",
  line: "Line",
  "line-markers": "Line with markers",
  "step-line": "Step line",
  "hollow-candles": "Hollow Candles",
};

export type CursorToolId =
  | "cursor-cross"
  | "cursor-dot"
  | "cursor-arrow"
  | "cursor-demo"
  | "cursor-laser";

export type DrawingToolId =
  | CursorToolId
  | "trendline"
  | "ray"
  | "horizontal-line"
  | "vertical-line"
  | "date-range"
  | "price-range"
  | "date-price-range"
  | "rectangle"
  | "rotated-rectangle"
  | "circle"
  | "ellipse"
  | "triangle"
  | "arc"
  | "brush"
  | "pencil"
  | "highlighter"
  | "path"
  | "curve"
  | "polyline"
  | "double-curve"
  | "text"
  | "anchored-text"
  | "note"
  | "anchored-note"
  | "comment"
  | "signpost"
  | "callout"
  | "price-label"
  | "price-note"
  | "arrow-mark-left"
  | "arrow-mark-right"
  | "arrow-mark-up"
  | "arrow-mark-down"
  | "flag-mark"
  | "pin";

export type ToolId = DrawingToolId;

export type DrawingPoint = {
  time: string;
  logical?: number;
  price: number;
};

export type DrawingStyle = {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fillOpacity: number;
};

export type DrawingBase = {
  id: string;
  locked: boolean;
  hidden: boolean;
  style?: Partial<DrawingStyle>;
  createdAt: number;
  updatedAt: number;
};

export type TwoPointDrawing = DrawingBase & {
  type:
    | "trendline"
    | "ray"
    | "date-range"
    | "price-range"
    | "date-price-range"
    | "rectangle"
    | "rotated-rectangle"
    | "circle"
    | "ellipse"
    | "triangle"
    | "arc"
    | "brush"
    | "pencil"
    | "highlighter"
    | "path"
    | "curve"
    | "polyline"
    | "double-curve";
  start: DrawingPoint;
  end: DrawingPoint;
};

export type FreehandDrawing = DrawingBase & {
  type: "brush" | "pencil";
  points: DrawingPoint[];
};

export type SinglePointDrawing = DrawingBase & {
  type:
    | "horizontal-line"
    | "vertical-line"
    | "price-label"
    | "arrow-mark-left"
    | "arrow-mark-right"
    | "arrow-mark-up"
    | "arrow-mark-down"
    | "flag-mark"
    | "pin";
  point: DrawingPoint;
  text?: string;
};

export type TextDrawing = DrawingBase & {
  type:
    | "text"
    | "anchored-text"
    | "note"
    | "anchored-note"
    | "comment"
    | "signpost"
    | "callout"
    | "price-note";
  point: DrawingPoint;
  text: string;
};

export type DrawingElement =
  | TwoPointDrawing
  | FreehandDrawing
  | SinglePointDrawing
  | TextDrawing;

export type DrawingDraft = DrawingElement | null;

export type DrawingController = {
  activeTool: DrawingToolId;
  crosshairActive: boolean;
  magnetActive: boolean;
  drawings: DrawingElement[];
  draftDrawing: DrawingDraft;
  selectedDrawingId: string | null;
  visibleDrawingCount: number;
  hiddenDrawingCount: number;
  allDrawingsHidden: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setActiveTool: (tool: DrawingToolId) => void;
  toggleCrosshair: () => void;
  toggleMagnet: () => void;
  setDraftDrawing: (drawing: DrawingDraft) => void;
  commitDrawing: (drawing: DrawingElement) => void;
  cancelDraft: () => void;
  selectDrawing: (id: string | null) => void;
  beginEdit: () => void;
  updateDrawing: (
    id: string,
    updater: (drawing: DrawingElement) => DrawingElement
  ) => void;
  deleteSelected: () => void;
  clearDrawings: () => void;
  toggleSelectedLock: () => void;
  toggleSelectedHidden: () => void;
  hideAllDrawings: () => void;
  showHiddenDrawings: () => void;
  showAllDrawings: () => void;
  toggleAllDrawingsVisibility: () => void;
  undo: () => void;
  redo: () => void;
};

export type ChartCaptureMode = "download" | "share";

export type ChartCaptureRequest = {
  id: number;
  mode: ChartCaptureMode;
};
