"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { Check } from "lucide-react";
import type { IChartApi, Logical } from "lightweight-charts";
import { formatCurrency } from "@/utils/formatters";
import { createDrawingBase } from "../hooks/use-scanner-drawing-state";
import type { ScannerPriceSeries } from "../hooks/use-lightweight-candlestick-chart";
import {
  freehandDrawingTools,
  pointDrawingTools,
  textEditorTools,
  twoPointDrawingTools,
} from "../tools/drawing-tool-config";
import {
  DEFAULT_CURSOR_TOOL,
  isCursorTool,
} from "../tools/cursor-tool-config";
import {
  resolveDrawingStyle,
  withAlpha,
} from "../tools/drawing-style-config";
import {
  getTextToolVisual,
  type TextToolVisual,
} from "../tools/text-tool-style-config";
import type {
  DrawingController,
  DrawingElement,
  DrawingPoint,
  DrawingStyle,
  DrawingToolId,
  FreehandDrawing,
  SinglePointDrawing,
  TextDrawing,
  TwoPointDrawing,
} from "../types";
import { DrawingStyleToolbar } from "./DrawingStyleToolbar";

type DrawingOverlayProps = {
  chart: IChartApi;
  series: ScannerPriceSeries;
  containerRef: RefObject<HTMLDivElement | null>;
  drawing: DrawingController;
};

type ScreenPoint = {
  x: number;
  y: number;
};

type MarkerDrawingType =
  | "arrow-mark-left"
  | "arrow-mark-right"
  | "arrow-mark-up"
  | "arrow-mark-down"
  | "flag-mark"
  | "pin";

type MarkerDrawing = SinglePointDrawing & {
  type: MarkerDrawingType;
};

type DragState =
  | {
      kind: "create";
      tool: DrawingToolId;
      start: DrawingPoint;
      origin: ScreenPoint;
    }
  | {
      kind: "freehand";
      tool: FreehandDrawing["type"];
      points: DrawingPoint[];
      origin: ScreenPoint;
      lastScreen: ScreenPoint;
    }
  | {
      kind: "move";
      id: string;
      original: DrawingElement;
      origin: ScreenPoint;
    }
  | {
      kind: "handle";
      id: string;
      handle: "start" | "end" | "point";
      original: DrawingElement;
    };

type TextEditorState = {
  tool: TextDrawing["type"];
  point: DrawingPoint;
  x: number;
  y: number;
  value: string;
};

const SELECTED_STROKE = "var(--scanner-handle-stroke)";
const DRAFT_STROKE = "#facc15";
const HIT_STROKE = "rgba(255, 255, 255, 0)";

function normalizeTime(time: unknown): string | null {
  if (typeof time === "string") return time;
  if (typeof time === "number") {
    return new Date(time * 1000).toISOString().slice(0, 10);
  }
  if (time && typeof time === "object") {
    const value = time as { year?: number; month?: number; day?: number };
    if (value.year && value.month && value.day) {
      return `${value.year}-${String(value.month).padStart(2, "0")}-${String(
        value.day
      ).padStart(2, "0")}`;
    }
  }
  return null;
}

function distance(a: ScreenPoint, b: ScreenPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isTwoPointDrawing(drawing: DrawingElement): drawing is TwoPointDrawing {
  return "start" in drawing && "end" in drawing;
}

function isFreehandDrawing(drawing: DrawingElement): drawing is FreehandDrawing {
  return (
    (drawing.type === "brush" || drawing.type === "pencil") &&
    "points" in drawing &&
    Array.isArray(drawing.points)
  );
}

function isTextDrawing(drawing: DrawingElement): drawing is TextDrawing {
  return (
    drawing.type === "text" ||
    drawing.type === "anchored-text" ||
    drawing.type === "note" ||
    drawing.type === "anchored-note" ||
    drawing.type === "comment" ||
    drawing.type === "signpost" ||
    drawing.type === "callout" ||
    drawing.type === "price-note"
  );
}

function isMarkerDrawing(drawing: DrawingElement): drawing is MarkerDrawing {
  return (
    drawing.type === "arrow-mark-left" ||
    drawing.type === "arrow-mark-right" ||
    drawing.type === "arrow-mark-up" ||
    drawing.type === "arrow-mark-down" ||
    drawing.type === "flag-mark" ||
    drawing.type === "pin"
  );
}

function isTextLikeDrawing(drawing: DrawingElement) {
  return isTextDrawing(drawing) || drawing.type === "price-label" || isMarkerDrawing(drawing);
}

function splitTextLines(text: string) {
  return text.split(/\r?\n/).map((line) => line || " ");
}

function labelBetween(start: ScreenPoint, end: ScreenPoint) {
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}

function rotatedRectanglePoints(start: ScreenPoint, end: ScreenPoint) {
  const center = labelBetween(start, end);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const halfWidth = length / 2;
  const halfHeight = Math.max(12, Math.min(70, length * 0.28));

  return [
    {
      x: center.x - ux * halfWidth - px * halfHeight,
      y: center.y - uy * halfWidth - py * halfHeight,
    },
    {
      x: center.x + ux * halfWidth - px * halfHeight,
      y: center.y + uy * halfWidth - py * halfHeight,
    },
    {
      x: center.x + ux * halfWidth + px * halfHeight,
      y: center.y + uy * halfWidth + py * halfHeight,
    },
    {
      x: center.x - ux * halfWidth + px * halfHeight,
      y: center.y - uy * halfWidth + py * halfHeight,
    },
  ];
}

function pointsToString(points: ScreenPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function curvedPath(start: ScreenPoint, end: ScreenPoint, bend = 0.28) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const control = {
    x: start.x + dx * 0.5 - dy * bend,
    y: start.y + dy * 0.5 + dx * bend,
  };

  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

function polylinePoints(start: ScreenPoint, end: ScreenPoint) {
  const mid = labelBetween(start, end);
  return [
    start,
    { x: mid.x, y: start.y + (end.y - start.y) * 0.18 },
    { x: mid.x, y: end.y - (end.y - start.y) * 0.18 },
    end,
  ];
}

function freehandPath(points: ScreenPoint[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  const [first, ...rest] = points;
  let path = `M ${first.x} ${first.y}`;

  for (let index = 0; index < rest.length - 1; index += 1) {
    const current = rest[index];
    const next = rest[index + 1];
    const midpoint = {
      x: (current.x + next.x) / 2,
      y: (current.y + next.y) / 2,
    };

    path += ` Q ${current.x} ${current.y} ${midpoint.x} ${midpoint.y}`;
  }

  const last = rest[rest.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

function getDayDiff(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`).getTime();
  const endDate = new Date(`${end}T00:00:00Z`).getTime();
  if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) return 0;
  return Math.abs(Math.round((endDate - startDate) / 86_400_000));
}

function buildTwoPointLabel(drawing: TwoPointDrawing) {
  const days = getDayDiff(drawing.start.time, drawing.end.time);
  const bars = Math.max(1, Math.round(days / 7));
  const priceChange = drawing.end.price - drawing.start.price;
  const pricePct =
    drawing.start.price === 0 ? 0 : (priceChange / drawing.start.price) * 100;

  if (drawing.type === "date-range") return `${bars} bars`;
  if (drawing.type === "price-range") return `${pricePct.toFixed(2)}%`;
  if (drawing.type === "date-price-range") {
    return `${pricePct.toFixed(2)}% | ${bars} bars`;
  }
  return "";
}

function createTwoPointDrawing(
  tool: DrawingToolId,
  start: DrawingPoint,
  end: DrawingPoint
): DrawingElement | null {
  if (!twoPointDrawingTools.has(tool)) return null;
  return {
    ...createDrawingBase(),
    type: tool as TwoPointDrawing["type"],
    start,
    end,
  };
}

function createFreehandDrawing(
  tool: DrawingToolId,
  points: DrawingPoint[]
): FreehandDrawing | null {
  if (!freehandDrawingTools.has(tool) || points.length === 0) return null;

  return {
    ...createDrawingBase(),
    type: tool as FreehandDrawing["type"],
    points,
  };
}

function createPointDrawing(
  tool: DrawingToolId,
  point: DrawingPoint,
  text?: string
): DrawingElement | null {
  if (tool === "horizontal-line" || tool === "vertical-line") {
    return { ...createDrawingBase(), type: tool, point };
  }
  if (
    tool === "price-label" ||
    tool === "arrow-mark-left" ||
    tool === "arrow-mark-right" ||
    tool === "arrow-mark-up" ||
    tool === "arrow-mark-down" ||
    tool === "flag-mark" ||
    tool === "pin"
  ) {
    return {
      ...createDrawingBase(),
      type: tool,
      point,
      text: text ?? (tool === "price-label" ? formatCurrency(point.price) : undefined),
    };
  }
  return null;
}

function defaultTextValue(tool: TextDrawing["type"], point: DrawingPoint) {
  return tool === "price-note" ? formatCurrency(point.price) : "";
}

function createTextDrawing(
  tool: TextDrawing["type"],
  point: DrawingPoint,
  text: string
): TextDrawing {
  return {
    ...createDrawingBase(),
    type: tool,
    point,
    text,
  };
}

type DrawingPointerHandler = (
  event: ReactPointerEvent<SVGGElement | SVGCircleElement>,
  item: DrawingElement,
  handle?: "start" | "end" | "point"
) => void;

function DrawingLabel({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  if (!text) return null;
  const width = Math.max(56, text.length * 6 + 14);

  return (
    <g pointerEvents="none">
      <rect
        x={x - width / 2}
        y={y - 24}
        width={width}
        height={20}
        rx={4}
        fill="var(--scanner-toolbar-bg)"
        stroke="var(--scanner-toolbar-border)"
      />
      <text
        x={x}
        y={y - 10}
        textAnchor="middle"
        fill="var(--foreground)"
        fontSize={11}
        fontWeight={600}
      >
        {text}
      </text>
    </g>
  );
}

function getTextToneColor(style: DrawingStyle, tone: TextToolVisual["textTone"]) {
  if (tone === "dark") return "#020617";
  if (tone === "light") return "#f8fafc";
  return style.strokeColor;
}

function getTextBlockMetrics(
  lines: string[],
  style: DrawingStyle,
  visual: TextToolVisual
) {
  const lineHeight = Math.max(style.fontSize * 1.24, style.fontSize + 4);
  const textWidth =
    Math.max(...lines.map((line) => line.length), 1) * style.fontSize * 0.58;

  return {
    lineHeight,
    textWidth,
    width: Math.max(visual.minWidth, textWidth + visual.paddingX * 2),
    height: lines.length * lineHeight + visual.paddingY * 2,
  };
}

function renderTextSpans({
  id,
  lines,
  x,
  y,
  lineHeight,
  fill,
  fontSize,
  fontWeight,
  textAnchor = "start",
}: {
  id: string;
  lines: string[];
  x: number;
  y: number;
  lineHeight: number;
  fill: string;
  fontSize: number;
  fontWeight: number;
  textAnchor?: "start" | "middle";
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={fontSize}
      fontWeight={fontWeight}
      textAnchor={textAnchor}
      xmlSpace="preserve"
    >
      {lines.map((line, index) => (
        <tspan
          key={`${id}-line-${index}`}
          x={x}
          dy={index === 0 ? 0 : lineHeight}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

function TextDrawingView({
  item,
  point,
  style,
  handles,
  onPointerDown,
}: {
  item: TextDrawing;
  point: ScreenPoint;
  style: DrawingStyle;
  handles: ReactNode;
  onPointerDown: DrawingPointerHandler;
}) {
  const visual = getTextToolVisual(item.type);
  const lines = splitTextLines(item.text);
  const metrics = getTextBlockMetrics(lines, style, visual);
  const stroke = withAlpha(style.strokeColor, visual.strokeAlpha);
  const textFill = getTextToneColor(style, visual.textTone);
  const strokeWidth = Math.max(1, style.strokeWidth);
  const textBaseline = visual.paddingY + style.fontSize;

  if (visual.shape === "plain") {
    const hitWidth = Math.max(metrics.textWidth, 18) + 10;
    const hitHeight = lines.length * metrics.lineHeight + 8;

    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        <rect
          x={point.x - 5}
          y={point.y - style.fontSize - 5}
          width={hitWidth}
          height={hitHeight}
          fill={HIT_STROKE}
          pointerEvents="all"
        />
        {renderTextSpans({
          id: item.id,
          lines,
          x: point.x,
          y: point.y,
          lineHeight: metrics.lineHeight,
          fill: textFill,
          fontSize: style.fontSize,
          fontWeight: visual.fontWeight,
        })}
        {handles}
      </g>
    );
  }

  if (visual.shape === "anchored") {
    const textX = point.x + visual.offsetX;
    const textY = point.y + visual.offsetY;
    const hitWidth = Math.max(metrics.textWidth, 18) + 10;
    const hitHeight = lines.length * metrics.lineHeight + 8;

    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        <line
          x1={point.x}
          y1={point.y}
          x2={textX - 6}
          y2={textY - style.fontSize * 0.35}
          stroke={stroke}
          strokeDasharray="3 3"
          strokeWidth={Math.max(1, style.strokeWidth)}
        />
        <circle
          cx={point.x}
          cy={point.y}
          r={3}
          fill="var(--scanner-handle-fill)"
          stroke={stroke}
        />
        <rect
          x={textX - 5}
          y={textY - style.fontSize - 5}
          width={hitWidth}
          height={hitHeight}
          fill={HIT_STROKE}
          pointerEvents="all"
        />
        {renderTextSpans({
          id: item.id,
          lines,
          x: textX,
          y: textY,
          lineHeight: metrics.lineHeight,
          fill: textFill,
          fontSize: style.fontSize,
          fontWeight: visual.fontWeight,
        })}
        {handles}
      </g>
    );
  }

  const boxX = point.x + visual.offsetX;
  const boxY = point.y + visual.offsetY;
  const boxFill =
    visual.shape === "comment"
      ? "var(--scanner-toolbar-bg)"
      : withAlpha(style.fillColor, visual.fillAlpha);
  const textX =
    visual.shape === "price-note"
      ? boxX + visual.paddingX + 8
      : boxX + visual.paddingX;
  const textY = boxY + textBaseline;
  const tailX = clamp(point.x, boxX + 14, boxX + metrics.width - 14);
  const tailY =
    point.y >= boxY + metrics.height / 2 ? boxY + metrics.height : boxY;
  const signpostX = boxX + metrics.width / 2;
  const signpostY = boxY + metrics.height;

  return (
    <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
      {visual.shape === "anchored-note" && (
        <>
          <line
            x1={point.x}
            y1={point.y}
            x2={boxX}
            y2={boxY + metrics.height}
            stroke={stroke}
            strokeDasharray="3 3"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={point.x}
            cy={point.y}
            r={3}
            fill="var(--scanner-handle-fill)"
            stroke={stroke}
          />
        </>
      )}

      {(visual.shape === "comment" || visual.shape === "callout") && (
        <path
          d={`M ${tailX - 7} ${tailY} L ${point.x} ${point.y} L ${
            tailX + 9
          } ${tailY} Z`}
          fill={boxFill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}

      {visual.shape === "signpost" && (
        <>
          <line
            x1={signpostX}
            y1={signpostY}
            x2={point.x}
            y2={point.y}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <circle cx={point.x} cy={point.y} r={3} fill={stroke} />
        </>
      )}

      {visual.shape === "price-note" ? (
        <>
          <line
            x1={point.x}
            y1={point.y}
            x2={boxX}
            y2={boxY + metrics.height / 2}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <path
            d={`M ${boxX + 9} ${boxY} H ${boxX + metrics.width} V ${
              boxY + metrics.height
            } H ${boxX + 9} L ${boxX} ${boxY + metrics.height / 2} Z`}
            fill={boxFill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <circle
            cx={boxX + 9}
            cy={boxY + metrics.height / 2}
            r={2.2}
            fill="var(--scanner-handle-fill)"
          />
        </>
      ) : (
        <rect
          x={boxX}
          y={boxY}
          width={metrics.width}
          height={metrics.height}
          rx={visual.radius}
          fill={boxFill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}

      {(visual.shape === "note" || visual.shape === "anchored-note") && (
        <path
          d={`M ${boxX + metrics.width - 14} ${boxY} H ${
            boxX + metrics.width
          } V ${boxY + 14} Z`}
          fill={withAlpha(style.strokeColor, 0.26)}
          stroke={stroke}
          strokeWidth={Math.max(0.75, strokeWidth * 0.6)}
          strokeLinejoin="round"
        />
      )}

      {visual.shape === "signpost" && (
        <line
          x1={boxX + 8}
          y1={boxY + metrics.height}
          x2={boxX + metrics.width - 8}
          y2={boxY + metrics.height}
          stroke="var(--foreground)"
          strokeOpacity={0.28}
          strokeWidth={2}
        />
      )}

      {renderTextSpans({
        id: item.id,
        lines,
        x: textX,
        y: textY,
        lineHeight: metrics.lineHeight,
        fill: textFill,
        fontSize: style.fontSize,
        fontWeight: visual.fontWeight,
      })}
      {handles}
    </g>
  );
}

function DrawingElementView({
  item,
  size,
  selectedDrawingId,
  draftDrawingId,
  pointToScreen,
  onPointerDown,
}: {
  item: DrawingElement;
  size: { width: number; height: number };
  selectedDrawingId: string | null;
  draftDrawingId: string | null;
  pointToScreen: (point: DrawingPoint) => ScreenPoint | null;
  onPointerDown: DrawingPointerHandler;
}) {
  const isDraft = item.id === draftDrawingId;
  const selected = item.id === selectedDrawingId;
  const style = resolveDrawingStyle(item);
  const stroke = isDraft ? DRAFT_STROKE : style.strokeColor;
  const common = {
    stroke,
    strokeWidth: style.strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
  };
  const handleAnchors =
    selected && !item.locked
      ? isTwoPointDrawing(item)
        ? [
            { handle: "start" as const, point: item.start },
            { handle: "end" as const, point: item.end },
          ]
        : isFreehandDrawing(item)
          ? []
          : [{ handle: "point" as const, point: item.point }]
      : [];

  const handles = handleAnchors.map((anchor) => {
    const screenPoint = pointToScreen(anchor.point);
    if (!screenPoint) return null;

    return (
      <circle
        key={`${item.id}-${anchor.handle}`}
        cx={screenPoint.x}
        cy={screenPoint.y}
        r={5}
        fill="var(--scanner-handle-fill)"
        stroke={SELECTED_STROKE}
        strokeWidth={2}
        pointerEvents="auto"
        onPointerDown={(event) => onPointerDown(event, item, anchor.handle)}
      />
    );
  });

  if (isTwoPointDrawing(item)) {
    const start = pointToScreen(item.start);
    const end = pointToScreen(item.end);
    if (!start || !end) return null;

    if (item.type === "highlighter") {
      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={withAlpha(style.fillColor, 0.5)}
            strokeWidth={Math.max(style.strokeWidth * 2.5, 8)}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={HIT_STROKE}
            strokeWidth={18}
          />
          {handles}
        </g>
      );
    }

    if (item.type === "rectangle") {
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={withAlpha(style.fillColor, style.fillOpacity)}
            {...common}
          />
          {handles}
        </g>
      );
    }

    if (item.type === "rotated-rectangle") {
      const points = rotatedRectanglePoints(start, end);

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <polygon
            points={pointsToString(points)}
            fill={withAlpha(style.fillColor, style.fillOpacity)}
            {...common}
          />
          <polyline
            points={pointsToString([...points, points[0]])}
            stroke={HIT_STROKE}
            strokeWidth={14}
            fill="none"
          />
          {handles}
        </g>
      );
    }

    if (item.type === "circle" || item.type === "ellipse") {
      const center = labelBetween(start, end);
      const rx = Math.max(Math.abs(end.x - start.x) / 2, 1);
      const ry =
        item.type === "circle"
          ? rx
          : Math.max(Math.abs(end.y - start.y) / 2, 1);

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={rx}
            ry={ry}
            fill={withAlpha(style.fillColor, style.fillOpacity)}
            {...common}
          />
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={HIT_STROKE}
            strokeWidth={14}
          />
          {handles}
        </g>
      );
    }

    if (item.type === "triangle") {
      const topX = (start.x + end.x) / 2;
      const topY = Math.min(start.y, end.y);
      const baseY = Math.max(start.y, end.y);
      const points = [
        { x: topX, y: topY },
        { x: Math.min(start.x, end.x), y: baseY },
        { x: Math.max(start.x, end.x), y: baseY },
      ];

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <polygon
            points={pointsToString(points)}
            fill={withAlpha(style.fillColor, style.fillOpacity)}
            {...common}
          />
          <polyline
            points={pointsToString([...points, points[0]])}
            stroke={HIT_STROKE}
            strokeWidth={14}
            fill="none"
          />
          {handles}
        </g>
      );
    }

    if (item.type === "arc") {
      const path = curvedPath(start, end, 0.42);

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <path d={path} fill="none" {...common} />
          <path d={path} fill="none" stroke={HIT_STROKE} strokeWidth={16} />
          {handles}
        </g>
      );
    }

    if (
      item.type === "brush" ||
      item.type === "pencil" ||
      item.type === "path" ||
      item.type === "curve" ||
      item.type === "polyline" ||
      item.type === "double-curve"
    ) {
      const path =
        item.type === "polyline" || item.type === "path"
          ? `M ${polylinePoints(start, end)
              .map((point) => `${point.x} ${point.y}`)
              .join(" L ")}`
          : curvedPath(start, end, item.type === "double-curve" ? 0.2 : 0.32);
      const strokeWidth =
        item.type === "brush"
          ? Math.max(style.strokeWidth * 2.5, 7)
          : item.type === "pencil"
            ? Math.max(style.strokeWidth, 2)
            : common.strokeWidth;
      const strokeColor =
        item.type === "brush"
          ? withAlpha(style.strokeColor, 0.72)
          : item.type === "pencil"
            ? style.strokeColor
            : common.stroke;

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          <path
            d={path}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {item.type === "double-curve" && (
            <path
              d={curvedPath(start, end, -0.2)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <path d={path} fill="none" stroke={HIT_STROKE} strokeWidth={16} />
          {handles}
        </g>
      );
    }

    if (
      item.type === "date-range" ||
      item.type === "price-range" ||
      item.type === "date-price-range"
    ) {
      const labelPoint = labelBetween(start, end);
      const label = buildTwoPointLabel(item);
      const dash = "5 5";
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      return (
        <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
          {(item.type === "date-range" || item.type === "date-price-range") && (
            <>
              <line
                x1={start.x}
                y1={minY}
                x2={start.x}
                y2={maxY}
                strokeDasharray={dash}
                {...common}
              />
              <line
                x1={end.x}
                y1={minY}
                x2={end.x}
                y2={maxY}
                strokeDasharray={dash}
                {...common}
              />
              <line x1={start.x} y1={labelPoint.y} x2={end.x} y2={labelPoint.y} {...common} />
            </>
          )}
          {(item.type === "price-range" || item.type === "date-price-range") && (
            <>
              <line
                x1={minX}
                y1={start.y}
                x2={maxX}
                y2={start.y}
                strokeDasharray={dash}
                {...common}
              />
              <line
                x1={minX}
                y1={end.y}
                x2={maxX}
                y2={end.y}
                strokeDasharray={dash}
                {...common}
              />
              <line x1={labelPoint.x} y1={start.y} x2={labelPoint.x} y2={end.y} {...common} />
            </>
          )}
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={HIT_STROKE}
            strokeWidth={16}
          />
          <DrawingLabel x={labelPoint.x} y={labelPoint.y} text={label} />
          {handles}
        </g>
      );
    }

    let x2 = end.x;
    let y2 = end.y;

    if (item.type === "ray") {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      if (Math.abs(dx) > 0.5) {
        x2 = dx >= 0 ? size.width : 0;
        y2 = start.y + dy * ((x2 - start.x) / dx);
      } else {
        y2 = dy >= 0 ? size.height : 0;
      }
    }

    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        <line x1={start.x} y1={start.y} x2={x2} y2={y2} {...common} />
        <line
          x1={start.x}
          y1={start.y}
          x2={x2}
          y2={y2}
          stroke={HIT_STROKE}
          strokeWidth={14}
        />
        {handles}
      </g>
    );
  }

  if (isFreehandDrawing(item)) {
    const points = item.points
      .map((drawingPoint) => pointToScreen(drawingPoint))
      .filter((point): point is ScreenPoint => Boolean(point));

    if (points.length === 0) return null;

    const path = freehandPath(points);
    const strokeWidth =
      item.type === "brush"
        ? Math.max(style.strokeWidth * 2.75, 7)
        : Math.max(style.strokeWidth, 2);
    const strokeColor =
      item.type === "brush" ? withAlpha(style.strokeColor, 0.72) : style.strokeColor;

    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke={HIT_STROKE}
          strokeWidth={Math.max(18, strokeWidth + 10)}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    );
  }

  const point = pointToScreen(item.point);
  if (!point) return null;

  if (item.type === "horizontal-line") {
    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        <line x1={0} y1={point.y} x2={size.width} y2={point.y} {...common} />
        <line
          x1={0}
          y1={point.y}
          x2={size.width}
          y2={point.y}
          stroke={HIT_STROKE}
          strokeWidth={14}
        />
        {handles}
      </g>
    );
  }

  if (item.type === "vertical-line") {
    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        <line x1={point.x} y1={0} x2={point.x} y2={size.height} {...common} />
        <line
          x1={point.x}
          y1={0}
          x2={point.x}
          y2={size.height}
          stroke={HIT_STROKE}
          strokeWidth={14}
        />
        {handles}
      </g>
    );
  }

  if (isTextDrawing(item)) {
    return (
      <TextDrawingView
        item={item}
        point={point}
        style={style}
        handles={handles}
        onPointerDown={onPointerDown}
      />
    );
  }

  if (isMarkerDrawing(item)) {
    const glyphByType: Record<
      "arrow-mark-left" | "arrow-mark-right" | "arrow-mark-up" | "arrow-mark-down",
      string
    > = {
      "arrow-mark-left": "<",
      "arrow-mark-right": ">",
      "arrow-mark-up": "^",
      "arrow-mark-down": "v",
    };
    const markerSize = Math.max(style.fontSize + 5, 16);

    return (
      <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
        {item.type === "pin" ? (
          <>
            <circle
              cx={point.x}
              cy={point.y}
              r={Math.max(3, style.fontSize * 0.24)}
              fill={style.strokeColor}
            />
            <line
              x1={point.x}
              y1={point.y + 4}
              x2={point.x}
              y2={point.y + markerSize}
              stroke={style.strokeColor}
              strokeWidth={Math.max(1.5, style.strokeWidth)}
              strokeLinecap="round"
            />
          </>
        ) : item.type === "flag-mark" ? (
          <>
            <line
              x1={point.x}
              y1={point.y - markerSize * 0.6}
              x2={point.x}
              y2={point.y + markerSize * 0.65}
              stroke={style.strokeColor}
              strokeWidth={Math.max(1.5, style.strokeWidth)}
              strokeLinecap="round"
            />
            <path
              d={`M ${point.x} ${point.y - markerSize * 0.58} L ${
                point.x + markerSize * 0.75
              } ${point.y - markerSize * 0.42} L ${point.x} ${
                point.y - markerSize * 0.12
              } Z`}
              fill={withAlpha(style.fillColor, 0.35)}
              stroke={style.strokeColor}
              strokeWidth={Math.max(1, style.strokeWidth)}
              strokeLinejoin="round"
            />
          </>
        ) : (
          <text
            x={point.x}
            y={point.y}
            fill={style.strokeColor}
            fontSize={markerSize}
            fontWeight={800}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {glyphByType[item.type]}
          </text>
        )}
        {handles}
      </g>
    );
  }

  const labelText = item.text ?? formatCurrency(item.point.price);
  const labelWidth = Math.max(74, labelText.length * style.fontSize * 0.58 + 16);
  const labelHeight = style.fontSize + 10;

  return (
    <g pointerEvents="auto" onPointerDown={(event) => onPointerDown(event, item)}>
      <rect
        x={point.x + 8}
        y={point.y - labelHeight + 4}
        width={labelWidth}
        height={labelHeight}
        rx={4}
        fill={withAlpha(style.fillColor, style.fillOpacity)}
        stroke={style.strokeColor}
      />
      <text
        x={point.x + 16}
        y={point.y + 1}
        fill={style.strokeColor}
        fontSize={style.fontSize}
        fontWeight={700}
      >
        {labelText}
      </text>
      {handles}
    </g>
  );
}

export function DrawingOverlay({
  chart,
  series,
  containerRef,
  drawing,
}: DrawingOverlayProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [renderTick, setRenderTick] = useState(0);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const textEditorOpen = Boolean(textEditor);
  const selectedDrawingId = drawing.selectedDrawingId;
  const selectDrawing = drawing.selectDrawing;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;

    const recalculate = () => {
      if (disposed) return;
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      setRenderTick((current) => current + 1);
    };

    recalculate();
    try {
      chart.timeScale().subscribeVisibleTimeRangeChange(recalculate);
      chart.timeScale().subscribeVisibleLogicalRangeChange(recalculate);
    } catch {
    }

    const resizeObserver = new ResizeObserver(recalculate);
    resizeObserver.observe(container);
    window.addEventListener("resize", recalculate);

    return () => {
      disposed = true;
      try {
        chart.timeScale().unsubscribeVisibleTimeRangeChange(recalculate);
        chart.timeScale().unsubscribeVisibleLogicalRangeChange(recalculate);
      } catch {
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", recalculate);
    };
  }, [chart, containerRef]);

  useEffect(() => {
    if (!textEditorOpen) return;
    textInputRef.current?.focus();
  }, [textEditorOpen]);

  useEffect(() => {
    if (!selectedDrawingId || textEditorOpen) return;

    const clearSelection = () => {
      selectDrawing(null);
    };

    window.addEventListener("pointerdown", clearSelection);
    return () => {
      window.removeEventListener("pointerdown", clearSelection);
    };
  }, [selectDrawing, selectedDrawingId, textEditorOpen]);

  useEffect(() => {
    if (!drawing.crosshairActive || isCursorTool(drawing.activeTool)) {
      try {
        chart.clearCrosshairPosition();
      } catch {
      }
    }
  }, [chart, drawing.activeTool, drawing.crosshairActive]);

  const getScreenPointFromEvent = (event: {
    clientX: number;
    clientY: number;
  }): ScreenPoint | null => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const screenToDrawingPoint = (
    screen: ScreenPoint,
    useMagnet = drawing.magnetActive
  ): DrawingPoint | null => {
    try {
      const time = normalizeTime(chart.timeScale().coordinateToTime(screen.x));
      const logical = chart.timeScale().coordinateToLogical(screen.x);
      const price = series.coordinateToPrice(screen.y);
      if (!time || price === null) return null;

      return {
        time,
        ...(logical !== null ? { logical: Number(logical) } : {}),
        price: useMagnet ? Math.round(Number(price) / 5) * 5 : Number(price),
      };
    } catch {
      return null;
    }
  };

  const syncCrosshairFromScreenPoint = (screen: ScreenPoint) => {
    if (!drawing.crosshairActive) return;

    const chartPoint = screenToDrawingPoint(screen, false);
    if (!chartPoint) {
      try {
        chart.clearCrosshairPosition();
      } catch {
      }
      return;
    }

    try {
      chart.setCrosshairPosition(chartPoint.price, chartPoint.time, series);
    } catch {
    }
  };

  const pointToScreen = (point: DrawingPoint): ScreenPoint | null => {
    try {
      const x =
        typeof point.logical === "number"
          ? chart.timeScale().logicalToCoordinate(point.logical as Logical)
          : chart.timeScale().timeToCoordinate(point.time);
      const y = series.priceToCoordinate(point.price);
      if (x === null || y === null) return null;
      return { x, y };
    } catch {
      return null;
    }
  };

  const movePointByDelta = (
    point: DrawingPoint,
    deltaX: number,
    deltaY: number
  ): DrawingPoint => {
    const screenPoint = pointToScreen(point);
    if (!screenPoint) return point;
    return (
      screenToDrawingPoint({
        x: screenPoint.x + deltaX,
        y: screenPoint.y + deltaY,
      }) ?? point
    );
  };

  const moveDrawingByDelta = (
    item: DrawingElement,
    deltaX: number,
    deltaY: number
  ): DrawingElement => {
    if (isTwoPointDrawing(item)) {
      return {
        ...item,
        start: movePointByDelta(item.start, deltaX, deltaY),
        end: movePointByDelta(item.end, deltaX, deltaY),
      };
    }

    if (isFreehandDrawing(item)) {
      return {
        ...item,
        points: item.points.map((point) => movePointByDelta(point, deltaX, deltaY)),
      };
    }

    return {
      ...item,
      point: movePointByDelta(item.point, deltaX, deltaY),
    };
  };

  const updateHandle = (
    item: DrawingElement,
    handle: "start" | "end" | "point",
    point: DrawingPoint
  ): DrawingElement => {
    if (isTwoPointDrawing(item)) {
      return handle === "start"
        ? { ...item, start: point }
        : { ...item, end: point };
    }

    if (isFreehandDrawing(item)) {
      return item;
    }

    return { ...item, point };
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const container = containerRef.current;
      if (!container) return;

      const screenPoint = getScreenPointFromEvent(event);
      if (!screenPoint) return;

      syncCrosshairFromScreenPoint(screenPoint);

      const chartPoint = screenToDrawingPoint(screenPoint);
      if (!chartPoint) return;

      if (drag.kind === "freehand") {
        if (distance(drag.lastScreen, screenPoint) < 2) return;

        const points = [...drag.points, chartPoint];
        dragRef.current = {
          ...drag,
          points,
          lastScreen: screenPoint,
        };
        drawing.setDraftDrawing(createFreehandDrawing(drag.tool, points));
        return;
      }

      if (drag.kind === "create") {
        const next = createTwoPointDrawing(drag.tool, drag.start, chartPoint);
        drawing.setDraftDrawing(next);
        return;
      }

      if (drag.kind === "move") {
        drawing.updateDrawing(drag.id, () =>
          moveDrawingByDelta(
            drag.original,
            screenPoint.x - drag.origin.x,
            screenPoint.y - drag.origin.y
          )
        );
        return;
      }

      drawing.updateDrawing(drag.id, (item) =>
        updateHandle(item, drag.handle, chartPoint)
      );
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const container = containerRef.current;
      if (!container) return;

      const screenPoint = getScreenPointFromEvent(event);
      if (!screenPoint) return;

      syncCrosshairFromScreenPoint(screenPoint);

      const chartPoint = screenToDrawingPoint(screenPoint);

      if (drag.kind === "freehand") {
        const points =
          chartPoint && distance(drag.lastScreen, screenPoint) >= 2
            ? [...drag.points, chartPoint]
            : drag.points;

        if (points.length > 1 && distance(drag.origin, screenPoint) > 4) {
          const next = createFreehandDrawing(drag.tool, points);
          if (next) drawing.commitDrawing(next);
        } else {
          drawing.cancelDraft();
        }
      } else if (drag.kind === "create") {
        if (chartPoint && distance(drag.origin, screenPoint) > 4) {
          const next = createTwoPointDrawing(drag.tool, drag.start, chartPoint);
          if (next) drawing.commitDrawing(next);
        } else {
          drawing.cancelDraft();
        }
      }

      dragRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  });

  const handleOverlayPointerMove = (event: ReactPointerEvent<SVGRectElement>) => {
    if (isCursorTool(drawing.activeTool)) return;

    const screenPoint = getScreenPointFromEvent(event);
    if (!screenPoint) return;

    syncCrosshairFromScreenPoint(screenPoint);
  };

  const handleOverlayPointerLeave = () => {
    if (!isCursorTool(drawing.activeTool)) {
      try {
        chart.clearCrosshairPosition();
      } catch {
      }
    }
  };

  const commitText = () => {
    if (!textEditor) return;
    const value = textEditor.value.trim();
    if (value) {
      drawing.commitDrawing(
        createTextDrawing(textEditor.tool, textEditor.point, value)
      );
    } else {
      drawing.setActiveTool(DEFAULT_CURSOR_TOOL);
    }
    setTextEditor(null);
  };

  const handleCreatePointerDown = (event: ReactPointerEvent<SVGRectElement>) => {
    if (isCursorTool(drawing.activeTool)) {
      drawing.selectDrawing(null);
      return;
    }

    const screenPoint = getScreenPointFromEvent(event);
    if (!screenPoint) return;

    syncCrosshairFromScreenPoint(screenPoint);

    const chartPoint = screenToDrawingPoint(screenPoint);
    if (!chartPoint) return;

    event.preventDefault();

    if (textEditorTools.has(drawing.activeTool)) {
      const tool = drawing.activeTool as TextDrawing["type"];
      drawing.selectDrawing(null);
      setTextEditor({
        tool,
        point: chartPoint,
        x: screenPoint.x,
        y: screenPoint.y,
        value: defaultTextValue(tool, chartPoint),
      });
      return;
    }

    if (pointDrawingTools.has(drawing.activeTool)) {
      const next = createPointDrawing(drawing.activeTool, chartPoint);
      if (next) drawing.commitDrawing(next);
      return;
    }

    if (freehandDrawingTools.has(drawing.activeTool)) {
      dragRef.current = {
        kind: "freehand",
        tool: drawing.activeTool as FreehandDrawing["type"],
        points: [chartPoint],
        origin: screenPoint,
        lastScreen: screenPoint,
      };
      drawing.setDraftDrawing(
        createFreehandDrawing(drawing.activeTool, [chartPoint])
      );
      return;
    }

    if (twoPointDrawingTools.has(drawing.activeTool)) {
      dragRef.current = {
        kind: "create",
        tool: drawing.activeTool,
        start: chartPoint,
        origin: screenPoint,
      };
      drawing.setDraftDrawing(
        createTwoPointDrawing(drawing.activeTool, chartPoint, chartPoint)
      );
    }
  };

  const handleDrawingPointerDown = (
    event: ReactPointerEvent<SVGGElement | SVGCircleElement>,
    item: DrawingElement,
    handle?: "start" | "end" | "point"
  ) => {
    event.preventDefault();
    event.stopPropagation();
    drawing.selectDrawing(item.id);

    if (!isCursorTool(drawing.activeTool)) {
      drawing.setActiveTool(DEFAULT_CURSOR_TOOL);
      return;
    }

    if (item.locked) return;

    drawing.beginEdit();
    const owner = event.currentTarget.ownerSVGElement ?? event.currentTarget;
    const rect = owner.getBoundingClientRect();
    const origin = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    dragRef.current = handle
      ? { kind: "handle", id: item.id, handle, original: item }
      : { kind: "move", id: item.id, original: item, origin };
  };

  const drawingsToRender = useMemo(
    () => [
      ...drawing.drawings.filter((item) => !item.hidden),
      ...(drawing.draftDrawing ? [drawing.draftDrawing] : []),
    ],
    [drawing.draftDrawing, drawing.drawings]
  );

  const selectedDrawing =
    drawing.drawings.find((item) => item.id === drawing.selectedDrawingId) ?? null;

  const selectedToolbarPosition = (() => {
    if (!selectedDrawing || selectedDrawing.hidden) return null;

    const sourcePoints = isTwoPointDrawing(selectedDrawing)
      ? [selectedDrawing.start, selectedDrawing.end]
      : isFreehandDrawing(selectedDrawing)
        ? selectedDrawing.points
      : [selectedDrawing.point];
    const screenPoints = sourcePoints
      .map((point) => pointToScreen(point))
      .filter((point): point is ScreenPoint => Boolean(point));
    if (screenPoints.length === 0) return null;

    const toolbarWidth = Math.min(282, Math.max(220, size.width - 24));
    const toolbarHeight = 44;
    const toolbarGap = 30;
    const minX = Math.min(...screenPoints.map((point) => point.x));
    const minY = Math.min(...screenPoints.map((point) => point.y));
    const maxX = Math.max(...screenPoints.map((point) => point.x));
    const x = clamp(
      (minX + maxX) / 2 - toolbarWidth / 2,
      12,
      Math.max(12, size.width - toolbarWidth - 12)
    );
    const y = clamp(
      minY - toolbarHeight - toolbarGap,
      12,
      Math.max(12, size.height - toolbarHeight - 12)
    );

    return { x, y };
  })();

  const textEditorPosition = textEditor
    ? {
        x: clamp(textEditor.x, 12, Math.max(12, size.width - 268)),
        y: clamp(textEditor.y, 12, Math.max(12, size.height - 164)),
      }
    : null;

  const updateSelectedStyle = (style: Partial<DrawingStyle>) => {
    if (!selectedDrawing) return;
    drawing.beginEdit();
    drawing.updateDrawing(selectedDrawing.id, (item) => ({
      ...item,
      style: {
        ...resolveDrawingStyle(item),
        ...style,
      },
    }));
  };

  void renderTick;

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 14 }}>
      <svg
        data-drawing-overlay="true"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`}
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
      >
        <rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill="transparent"
          pointerEvents={isCursorTool(drawing.activeTool) ? "none" : "all"}
          onPointerMove={handleOverlayPointerMove}
          onPointerLeave={handleOverlayPointerLeave}
          onPointerDown={handleCreatePointerDown}
        />
        {drawingsToRender.map((item) => (
          <DrawingElementView
            key={item.id}
            item={item}
            size={size}
            selectedDrawingId={drawing.selectedDrawingId}
            draftDrawingId={drawing.draftDrawing?.id ?? null}
            pointToScreen={pointToScreen}
            onPointerDown={handleDrawingPointerDown}
          />
        ))}
      </svg>

      {selectedDrawing && selectedToolbarPosition && (
        <DrawingStyleToolbar
          key={selectedDrawing.id}
          style={resolveDrawingStyle(selectedDrawing)}
          textMode={isTextLikeDrawing(selectedDrawing)}
          position={selectedToolbarPosition}
          onStyleChange={updateSelectedStyle}
          onDelete={drawing.deleteSelected}
        />
      )}

      {textEditor && textEditorPosition && (
        <div
          className="pointer-events-auto absolute z-40 flex w-64 max-w-[calc(100%-1.5rem)] flex-col gap-2 rounded-lg border border-[var(--scanner-toolbar-border)] bg-[var(--scanner-editor-bg)] p-2 shadow-2xl"
          style={{
            left: textEditorPosition.x,
            top: textEditorPosition.y,
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <textarea
            ref={textInputRef}
            value={textEditor.value}
            onChange={(event) =>
              setTextEditor((current) =>
                current ? { ...current, value: event.target.value } : current
              )
            }
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                commitText();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setTextEditor(null);
                drawing.setActiveTool(DEFAULT_CURSOR_TOOL);
              }
            }}
            className="min-h-20 w-full resize rounded-md border border-border bg-[var(--scanner-editor-input)] px-2 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary/70"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setTextEditor(null);
                drawing.setActiveTool(DEFAULT_CURSOR_TOOL);
              }}
              className="h-8 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={commitText}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-primary/70 bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <Check className="size-3.5" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
