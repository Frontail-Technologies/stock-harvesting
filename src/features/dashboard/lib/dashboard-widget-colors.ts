// ONE canonical categorical palette for every Dashboard chart - the 4 top
// widgets (Index/Sector/Industry/Weekly Strong), the Backtest legend,
// stacked bars, tooltip, and magnifier all call this same function, so
// "Financial Services" is never purple in one place and something else
// elsewhere.
//
// 13 colors, all genuinely vibrant (saturated, mid-lightness hues - no
// desaturated/neutral entries) and hand-picked/hue-spaced (not a
// mechanical rotation) so that no two are close enough to be confused at
// a glance, even as a thin 2-3px stacked-bar segment: red(0°)/
// orange(25°)/amber(45°)/lime(84°)/spring green(113°)/green(142°)/
// teal(175°)/sky(199°)/blue(217°)/indigo(239°)/purple(271°)/
// magenta(303°)/pink(330°) - roughly even ~25-40° spacing all the way
// around the wheel. Earlier passes crammed in 16-18 colors including
// near-duplicate ambers/teals/violets that collided under real data, and
// a later pass included two desaturated neutrals (brown, slate) for
// value-only contrast - both replaced here (spring green, magenta) so
// every entry is unambiguously vibrant, per an explicit "vibrant colors
// only for bars" request; this set trades a little raw count for every
// member being genuinely distinguishable, which is what was actually
// asked for.
const DASHBOARD_WIDGET_PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#f5b800", // amber
  "#84cc16", // lime
  "#33c520", // spring green
  "#22c55e", // green
  "#18b6a8", // teal
  "#0ea5e9", // sky blue
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ea3ee1", // magenta
  "#ec4899", // pink
] as const;

// Assignment is a deterministic hash of the row's own label (sector/
// industry name, or stock symbol) - never the row's rank/index - so a
// category keeps the same color across refreshes, re-sorts, and even a
// re-ranking that moves it to a different position in the list.
export function colorForDashboardLabel(label: string): string {
  let hash = 0;
  for (let index = 0; index < label.length; index++) {
    hash = (hash * 31 + label.charCodeAt(index)) | 0;
  }
  const paletteIndex = Math.abs(hash) % DASHBOARD_WIDGET_PALETTE.length;
  return DASHBOARD_WIDGET_PALETTE[paletteIndex];
}
