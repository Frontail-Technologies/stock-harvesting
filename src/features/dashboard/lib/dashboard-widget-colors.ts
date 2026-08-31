const DASHBOARD_WIDGET_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f5b800",
  "#84cc16",
  "#33c520",
  "#22c55e",
  "#18b6a8",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ea3ee1",
  "#ec4899",
] as const;

export function colorForDashboardLabel(label: string): string {
  let hash = 0;
  for (let index = 0; index < label.length; index++) {
    hash = (hash * 31 + label.charCodeAt(index)) | 0;
  }
  const paletteIndex = Math.abs(hash) % DASHBOARD_WIDGET_PALETTE.length;
  return DASHBOARD_WIDGET_PALETTE[paletteIndex];
}
