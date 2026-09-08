import type { CSSProperties } from "react";
import { colorForDashboardLabel } from "@/features/dashboard";

const TINT_ALPHA_HEX = "26";

export function watchlistTintStyleForSymbol(symbol: string): CSSProperties {
  const color = colorForDashboardLabel(symbol);
  return { backgroundColor: `${color}${TINT_ALPHA_HEX}`, color };
}
