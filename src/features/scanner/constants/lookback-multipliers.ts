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
  if (availableWeeks >= requestedWeeks) return requestedWeeks;

  const fallback = [...SCANNER_LOOKBACK_OPTIONS]
    .sort((a, b) => b.weeks - a.weeks)
    .find((option) => availableWeeks >= option.weeks);

  return fallback?.weeks ?? null;
}
