import type { DrawingElement, DrawingStyle } from "../types";

export const defaultDrawingStyle: DrawingStyle = {
  strokeColor: "#facc15",
  fillColor: "#facc15",
  strokeWidth: 2,
  fontSize: 13,
  fillOpacity: 0.18,
};

export const drawingStrokeColors = [
  "#34d399",
  "#60a5fa",
  "#facc15",
  "#fb7185",
  "#f8fafc",
];

export const drawingFillColors = [
  "#34d399",
  "#60a5fa",
  "#facc15",
  "#fb7185",
  "#a78bfa",
];

export const drawingColorPalette = [
  [
    "#f8fafc",
    "#cbd5e1",
    "#94a3b8",
    "#9ca3af",
    "#64748b",
    "#475569",
    "#334155",
    "#1f2937",
    "#111827",
    "#020617",
  ],
  [
    "#ef4444",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#10b981",
    "#eab308",
    "#2563eb",
    "#7c3aed",
    "#c026d3",
    "#e11d48",
  ],
  [
    "#fecaca",
    "#fed7aa",
    "#fef08a",
    "#bbf7d0",
    "#a7f3d0",
    "#a5f3fc",
    "#bfdbfe",
    "#ddd6fe",
    "#f0abfc",
    "#f9a8d4",
  ],
  [
    "#fda4af",
    "#fdba74",
    "#fde68a",
    "#86efac",
    "#5eead4",
    "#67e8f9",
    "#93c5fd",
    "#c4b5fd",
    "#d8b4fe",
    "#f0abfc",
  ],
  [
    "#fb7185",
    "#fbbf24",
    "#fde047",
    "#74c69d",
    "#5eead4",
    "#67e8f9",
    "#60a5fa",
    "#a78bfa",
    "#c084fc",
    "#f472b6",
  ],
  [
    "#f43f5e",
    "#f59e0b",
    "#facc15",
    "#22c55e",
    "#14b8a6",
    "#eab308",
    "#2563eb",
    "#7c3aed",
    "#9333ea",
    "#db2777",
  ],
  [
    "#be123c",
    "#ea580c",
    "#ca8a04",
    "#15803d",
    "#0f766e",
    "#0e7490",
    "#1d4ed8",
    "#5b21b6",
    "#7e22ce",
    "#be185d",
  ],
  [
    "#991b1b",
    "#c2410c",
    "#a16207",
    "#166534",
    "#064e3b",
    "#0f766e",
    "#1e40af",
    "#4c1d95",
    "#581c87",
    "#9f1239",
  ],
];

export const drawingStrokeWidths = [1, 2, 3, 5, 8, 12];

export const drawingTextSizes = [10, 12, 13, 16, 20, 24, 32, 48];

export function resolveDrawingStyle(drawing: DrawingElement): DrawingStyle {
  return {
    ...defaultDrawingStyle,
    ...drawing.style,
  };
}

export function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) return hexColor;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
