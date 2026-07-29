import type { DrawingToolId } from "./tools";

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
  replaceDrawings: (drawings: DrawingElement[]) => void;
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
