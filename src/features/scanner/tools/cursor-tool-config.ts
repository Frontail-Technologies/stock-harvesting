import {
  CircleDot,
  Crosshair,
  LocateFixed,
  MousePointer2,
  Presentation,
} from "lucide-react";
import type { CursorToolId, DrawingToolId } from "../types";
import type { ToolIcon, ToolMenuItem } from "./chart-tool-types";

export const DEFAULT_CURSOR_TOOL: CursorToolId = "cursor-cross";

export const CURSOR_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "cursor-cross", label: "Cross", icon: Crosshair },
  { kind: "tool", id: "cursor-dot", label: "Dot", icon: CircleDot },
  { kind: "tool", id: "cursor-arrow", label: "Arrow", icon: MousePointer2 },
  { kind: "tool", id: "cursor-demo", label: "Demonstration", icon: Presentation },
  { kind: "tool", id: "cursor-laser", label: "Laser", icon: LocateFixed },
];

export const cursorToolIds = CURSOR_TOOLS.map(
  (tool) => tool.id
) as CursorToolId[];

export const cursorToolIcons = CURSOR_TOOLS.reduce(
  (icons, tool) => ({
    ...icons,
    [tool.id]: tool.icon,
  }),
  {} as Record<CursorToolId, ToolIcon>
);

export function isCursorTool(tool: DrawingToolId): tool is CursorToolId {
  return cursorToolIds.includes(tool as CursorToolId);
}

export function getCursorToolIcon(tool: DrawingToolId): ToolIcon {
  return isCursorTool(tool) ? cursorToolIcons[tool] : Crosshair;
}

function svgCursor(svg: string, hotspotX: number, hotspotY: number, fallback: string) {
  return `url("data:image/svg+xml,${encodeURIComponent(
    svg
  )}") ${hotspotX} ${hotspotY}, ${fallback}`;
}

const dotCursor = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#f8fafc" stroke="#020617" stroke-width="2"/></svg>`,
  12,
  12,
  "crosshair"
);

const demoCursor = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M6 4 21 17l-8 1 4 7-3 1-4-7-6 5Z" fill="#f8fafc" stroke="#020617" stroke-width="1.8" stroke-linejoin="round"/><circle cx="18" cy="10" r="5" fill="none" stroke="#f8fafc" stroke-width="2"/><circle cx="18" cy="10" r="5" fill="none" stroke="#020617" stroke-width="1"/></svg>`,
  6,
  4,
  "pointer"
);

const laserCursor = svgCursor(
  `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="6" fill="none" stroke="#facc15" stroke-width="2.4"/><circle cx="14" cy="14" r="2" fill="#facc15"/><path d="M14 2v6M14 20v6M2 14h6M20 14h6" stroke="#facc15" stroke-width="2" stroke-linecap="round"/><path d="M14 2v6M14 20v6M2 14h6M20 14h6" stroke="#020617" stroke-width=".75" stroke-linecap="round"/></svg>`,
  14,
  14,
  "crosshair"
);

export function getChartCursorCss(tool: DrawingToolId) {
  if (tool === "cursor-cross") return "crosshair";
  if (tool === "cursor-dot") return dotCursor;
  if (tool === "cursor-arrow") return "default";
  if (tool === "cursor-demo") return demoCursor;
  if (tool === "cursor-laser") return laserCursor;
  return "default";
}
