import type { TextDrawing } from "../types";

export type TextToolShape =
  | "plain"
  | "anchored"
  | "note"
  | "anchored-note"
  | "comment"
  | "signpost"
  | "callout"
  | "price-note";

export type TextToolVisual = {
  shape: TextToolShape;
  minWidth: number;
  paddingX: number;
  paddingY: number;
  radius: number;
  offsetX: number;
  offsetY: number;
  fillAlpha: number;
  strokeAlpha: number;
  fontWeight: number;
  textTone: "accent" | "dark" | "light";
};

export const TEXT_TOOL_VISUALS = {
  text: {
    shape: "plain",
    minWidth: 0,
    paddingX: 0,
    paddingY: 0,
    radius: 0,
    offsetX: 0,
    offsetY: 0,
    fillAlpha: 0,
    strokeAlpha: 1,
    fontWeight: 700,
    textTone: "accent",
  },
  "anchored-text": {
    shape: "anchored",
    minWidth: 0,
    paddingX: 0,
    paddingY: 0,
    radius: 0,
    offsetX: 18,
    offsetY: -14,
    fillAlpha: 0,
    strokeAlpha: 0.7,
    fontWeight: 700,
    textTone: "accent",
  },
  note: {
    shape: "note",
    minWidth: 92,
    paddingX: 10,
    paddingY: 8,
    radius: 6,
    offsetX: -8,
    offsetY: -28,
    fillAlpha: 0.22,
    strokeAlpha: 0.9,
    fontWeight: 700,
    textTone: "accent",
  },
  "anchored-note": {
    shape: "anchored-note",
    minWidth: 106,
    paddingX: 10,
    paddingY: 8,
    radius: 6,
    offsetX: 20,
    offsetY: -48,
    fillAlpha: 0.2,
    strokeAlpha: 0.9,
    fontWeight: 700,
    textTone: "accent",
  },
  comment: {
    shape: "comment",
    minWidth: 104,
    paddingX: 10,
    paddingY: 8,
    radius: 7,
    offsetX: 14,
    offsetY: -40,
    fillAlpha: 0.14,
    strokeAlpha: 0.72,
    fontWeight: 650,
    textTone: "light",
  },
  signpost: {
    shape: "signpost",
    minWidth: 92,
    paddingX: 11,
    paddingY: 7,
    radius: 4,
    offsetX: 16,
    offsetY: -46,
    fillAlpha: 0.9,
    strokeAlpha: 1,
    fontWeight: 800,
    textTone: "dark",
  },
  callout: {
    shape: "callout",
    minWidth: 112,
    paddingX: 11,
    paddingY: 8,
    radius: 8,
    offsetX: 16,
    offsetY: -48,
    fillAlpha: 0.18,
    strokeAlpha: 0.95,
    fontWeight: 700,
    textTone: "accent",
  },
  "price-note": {
    shape: "price-note",
    minWidth: 92,
    paddingX: 12,
    paddingY: 7,
    radius: 5,
    offsetX: 12,
    offsetY: -19,
    fillAlpha: 0.92,
    strokeAlpha: 1,
    fontWeight: 800,
    textTone: "dark",
  },
} satisfies Record<TextDrawing["type"], TextToolVisual>;

export function getTextToolVisual(type: TextDrawing["type"]) {
  return TEXT_TOOL_VISUALS[type];
}
