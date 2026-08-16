import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeIndianRupee,
  BoxSelect,
  Circle,
  Crosshair,
  Diamond,
  Eraser,
  Eye,
  Flag,
  Highlighter,
  Lock,
  Magnet,
  MapPin,
  MessageSquareText,
  MessageSquareQuote,
  MessageCircle,
  Minus,
  MoveHorizontal,
  MoveVertical,
  NotebookText,
  PenLine,
  Pencil,
  Radius,
  Ruler,
  Shapes,
  Slash,
  Sparkles,
  Square,
  StickyNote,
  StickyNotes,
  Tag,
  TextCursorInput,
  Triangle,
  TrendingUp,
  Type,
  Waypoints,
} from "lucide-react";
import type {
  ToolIcon,
  ToolMenuItem,
  ToolbarGroup,
  ToolbarGroupState,
} from "./chart-tool-types";
import { CURSOR_TOOLS, cursorToolIds } from "./cursor-tool-config";

export const LINE_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "trendline", label: "Trend Line", icon: TrendingUp },
  { kind: "tool", id: "ray", label: "Ray", icon: Slash },
  { kind: "tool", id: "horizontal-line", label: "Horizontal Line", icon: Minus },
  { kind: "tool", id: "vertical-line", label: "Vertical Line", icon: MoveVertical },
];

export const RANGE_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "measure", label: "Measure", icon: Ruler },
  { kind: "tool", id: "date-range", label: "Date Range", icon: MoveHorizontal },
  { kind: "tool", id: "price-range", label: "Price Range", icon: MoveVertical },
  { kind: "tool", id: "date-price-range", label: "Date and Price Range", icon: Ruler },
];

export const RECTANGLE_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "rectangle", label: "Rectangle", icon: Square },
  { kind: "tool", id: "rotated-rectangle", label: "Rotated Rectangle", icon: Diamond },
];

export const ELLIPSE_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "circle", label: "Circle", icon: Circle },
  { kind: "tool", id: "ellipse", label: "Ellipse", icon: Circle },
];

export const TRIANGLE_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "triangle", label: "Triangle", icon: Triangle },
];

export const ARC_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "arc", label: "Arc", icon: Radius },
];

export const FREEHAND_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "brush", label: "Brush", icon: PenLine },
  { kind: "tool", id: "pencil", label: "Pencil", icon: Pencil },
  { kind: "tool", id: "highlighter", label: "Highlighter", icon: Highlighter },
];

export const PATH_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "path", label: "Path", icon: Waypoints },
  { kind: "tool", id: "curve", label: "Curve", icon: Radius },
  { kind: "tool", id: "polyline", label: "Polyline", icon: TrendingUp },
  { kind: "tool", id: "double-curve", label: "Double Curve", icon: Sparkles },
];

export const TEXT_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "text", label: "Text", icon: Type },
  { kind: "tool", id: "anchored-text", label: "Anchored Text", icon: TextCursorInput },
];

export const NOTE_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "note", label: "Note", icon: StickyNote },
  { kind: "tool", id: "anchored-note", label: "Anchored Note", icon: StickyNotes },
  { kind: "tool", id: "comment", label: "Comment", icon: MessageSquareQuote },
];

export const CALLOUT_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "signpost", label: "Signpost", icon: MessageSquareText },
  { kind: "tool", id: "callout", label: "Callout", icon: MessageCircle },
];

export const PRICE_TEXT_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "price-label", label: "Price Label", icon: Tag },
  { kind: "tool", id: "price-note", label: "Price Note", icon: BadgeIndianRupee },
];

export const TEXT_MARKER_TOOLS: ToolMenuItem[] = [
  { kind: "tool", id: "arrow-mark-left", label: "Arrow Mark Left", icon: ArrowLeft },
  { kind: "tool", id: "arrow-mark-right", label: "Arrow Mark Right", icon: ArrowRight },
  { kind: "tool", id: "arrow-mark-up", label: "Arrow Mark Up", icon: ArrowUp },
  { kind: "tool", id: "arrow-mark-down", label: "Arrow Mark Down", icon: ArrowDown },
  { kind: "tool", id: "flag-mark", label: "Flag Mark", icon: Flag },
  { kind: "tool", id: "pin", label: "Pin", icon: MapPin },
];

export function createToolbarGroups({
  crosshairActive,
  magnetActive,
  hasSelectedDrawing,
  hasDrawings,
}: ToolbarGroupState): ToolbarGroup[] {
  const shapeTools = [
    ...RECTANGLE_TOOLS,
    ...ELLIPSE_TOOLS,
    ...TRIANGLE_TOOLS,
    ...ARC_TOOLS,
    ...FREEHAND_TOOLS,
    ...PATH_TOOLS,
  ];
  const textTools = [
    ...TEXT_TOOLS,
    ...NOTE_TOOLS,
    ...CALLOUT_TOOLS,
    ...PRICE_TEXT_TOOLS,
    ...TEXT_MARKER_TOOLS,
  ];

  return [
    {
      id: "select",
      label: "Cursor",
      icon: Crosshair,
      toolIds: cursorToolIds,
      sections: [
        {
          label: "Cursor",
          items: CURSOR_TOOLS,
        },
        {
          label: "Chart",
          items: [
            {
              kind: "action",
              id: "crosshair",
              label: "Crosshair Toggle",
              icon: Crosshair,
              active: crosshairActive,
            },
          ],
        },
      ],
    },
    {
      id: "lines",
      label: "Lines",
      icon: TrendingUp,
      toolIds: LINE_TOOLS.map((tool) => tool.id),
      sections: [
        { label: "Lines", items: LINE_TOOLS.slice(0, 2) },
        { label: "Levels", items: LINE_TOOLS.slice(2) },
      ],
    },
    {
      id: "ruler",
      label: "Ruler",
      icon: Ruler,
      toolIds: RANGE_TOOLS.map((tool) => tool.id),
      sections: [{ label: "Ranges", items: RANGE_TOOLS }],
    },
    {
      id: "shapes",
      label: "Shapes",
      icon: Shapes,
      toolIds: shapeTools.map((tool) => tool.id),
      sections: [
        { label: "Rectangles", items: RECTANGLE_TOOLS },
        { label: "Ellipses", items: ELLIPSE_TOOLS },
        { label: "Triangles", items: TRIANGLE_TOOLS },
        { label: "Arcs", items: ARC_TOOLS },
        { label: "Freehand", items: FREEHAND_TOOLS },
        { label: "Paths", items: PATH_TOOLS },
      ],
    },
    {
      id: "text",
      label: "Text",
      icon: NotebookText,
      toolIds: textTools.map((tool) => tool.id),
      sections: [
        { label: "Text", items: TEXT_TOOLS },
        { label: "Notes", items: NOTE_TOOLS },
        { label: "Callouts", items: CALLOUT_TOOLS },
        { label: "Price", items: PRICE_TEXT_TOOLS },
        { label: "Markers", items: TEXT_MARKER_TOOLS },
      ],
    },
    {
      id: "controls",
      label: "Controls",
      icon: Lock,
      toolIds: [],
      sections: [
        {
          label: "Controls",
          items: [
            {
              kind: "action",
              id: "lock-selected",
              label: "Lock Selected",
              icon: Lock,
              disabled: !hasSelectedDrawing,
            },
            {
              kind: "action",
              id: "hide-selected",
              label: "Hide Selected",
              icon: Eye,
              disabled: !hasSelectedDrawing,
            },
            {
              kind: "action",
              id: "magnet",
              label: "Magnet Snap",
              icon: Magnet,
              active: magnetActive,
            },
            {
              kind: "action",
              id: "clear-drawings",
              label: "Clear Drawings",
              icon: Eraser,
              disabled: !hasDrawings,
            },
          ],
        },
      ],
    },
  ];
}

export const toolbarRailIcons: Record<string, ToolIcon> = {
  select: Crosshair,
  lines: TrendingUp,
  ruler: Ruler,
  shapes: BoxSelect,
  text: NotebookText,
  controls: Lock,
};
