export const SCANNER_LOOKBACK_OPTIONS = [
  { value: "1x", label: "1x", weeks: 50 },
  { value: "3x", label: "3x", weeks: 150 },
  { value: "5x", label: "5x", weeks: 250 },
] as const;

export type ScannerLookbackMultiplier =
  (typeof SCANNER_LOOKBACK_OPTIONS)[number]["value"];

export const DEFAULT_SCANNER_LOOKBACK: ScannerLookbackMultiplier = "5x";

export function getScannerLookbackWeeks(value: ScannerLookbackMultiplier) {
  return (
    SCANNER_LOOKBACK_OPTIONS.find((option) => option.value === value)?.weeks ??
    SCANNER_LOOKBACK_OPTIONS[SCANNER_LOOKBACK_OPTIONS.length - 1].weeks
  );
}

export function getEffectiveScannerLookbackWeeks(
  requestedWeeks: number,
  availableWeeks: number
) {
  if (availableWeeks <= 0) return null;

  // Clamp to what's actually available instead of snapping down to the next
  // smaller preset (50/150/250) — snapping made 3x and 5x collapse to the
  // same 1x value for any stock with less than 150 weeks of history, so
  // switching the lookback did nothing for it. Clamping to the real
  // available week count still lets shorter-history stocks differ between
  // presets (e.g. 80 weeks available: 1x -> 50, 3x/5x -> 80), and only
  // 3x/5x collapse into each other once both genuinely exceed what's there.
  return Math.min(requestedWeeks, availableWeeks);
}
