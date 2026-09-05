// Deterministic tint palette for Watchlist stock rows - same hashing
// approach as the Dashboard's colorForDashboardLabel (features/dashboard/
// lib/dashboard-widget-colors.ts), but producing Tailwind tint classes
// instead of a raw hex value since these are subtle row backgrounds
// rather than chart bar fills.

const STOCK_CHIP_PALETTE = [
  "bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 dark:bg-purple-400/20 dark:text-purple-300 dark:hover:bg-purple-400/30",
  "bg-pink-500/15 text-pink-700 hover:bg-pink-500/25 dark:bg-pink-400/20 dark:text-pink-300 dark:hover:bg-pink-400/30",
  "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-400/20 dark:text-blue-300 dark:hover:bg-blue-400/30",
  "bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:bg-green-400/20 dark:text-green-300 dark:hover:bg-green-400/30",
  "bg-lime-500/15 text-lime-700 hover:bg-lime-500/25 dark:bg-lime-400/20 dark:text-lime-300 dark:hover:bg-lime-400/30",
  "bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:bg-orange-400/20 dark:text-orange-300 dark:hover:bg-orange-400/30",
  "bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/25 dark:bg-cyan-400/20 dark:text-cyan-300 dark:hover:bg-cyan-400/30",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function chipColorForSymbol(symbol: string): string {
  return STOCK_CHIP_PALETTE[hashString(symbol) % STOCK_CHIP_PALETTE.length];
}
