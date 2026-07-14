import type { DrawingToolId } from "../types";

export const twoPointDrawingTools = new Set<DrawingToolId>([
  "trendline",
  "ray",
  "date-range",
  "price-range",
  "date-price-range",
  "rectangle",
  "rotated-rectangle",
  "circle",
  "ellipse",
  "triangle",
  "arc",
  "highlighter",
  "path",
  "curve",
  "polyline",
  "double-curve",
]);

export const freehandDrawingTools = new Set<DrawingToolId>(["brush", "pencil"]);

export const pointDrawingTools = new Set<DrawingToolId>([
  "horizontal-line",
  "vertical-line",
  "price-label",
  "arrow-mark-left",
  "arrow-mark-right",
  "arrow-mark-up",
  "arrow-mark-down",
  "flag-mark",
  "pin",
]);

export const textEditorTools = new Set<DrawingToolId>([
  "text",
  "anchored-text",
  "note",
  "anchored-note",
  "comment",
  "signpost",
  "callout",
  "price-note",
]);
