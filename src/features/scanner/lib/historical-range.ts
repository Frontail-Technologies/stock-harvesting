import { SCANNER_RANGE_FILTERS, type ScannerRangeFilter } from "../types";

export type AvailableHistoryRange = {
  from: string;
  to: string;
};

const PRESET_DAYS: Partial<Record<ScannerRangeFilter, number>> = {
  "1D": 1,
  "2D": 2,
  "3D": 3,
  "5D": 5,
  "10D": 10,
};

const PRESET_MONTHS: Partial<Record<ScannerRangeFilter, number>> = {
  "1M": 1,
  "2M": 2,
  "3M": 3,
  "4M": 4,
  "6M": 6,
  "9M": 9,
  "1Y": 12,
  "2Y": 24,
  "3Y": 36,
  "5Y": 60,
  "8Y": 96,
};

export function getVisibleHistoricalRangeFilters(
  availableRange: AvailableHistoryRange | null
): ScannerRangeFilter[] {
  if (!availableRange) return [...SCANNER_RANGE_FILTERS];

  return SCANNER_RANGE_FILTERS.filter((preset) =>
    isHistoricalRangeFilterAvailable(preset, availableRange)
  );
}

export function isHistoricalRangeFilterAvailable(
  preset: ScannerRangeFilter,
  availableRange: AvailableHistoryRange | null
) {
  if (preset === "ALL") return true;
  if (!availableRange) return true;

  const requiredStartDate = getPresetStartDate(preset, availableRange.to);
  return requiredStartDate >= availableRange.from;
}

function getPresetStartDate(preset: ScannerRangeFilter, latestDate: string) {
  const days = PRESET_DAYS[preset];
  if (days !== undefined) return addDays(latestDate, -days);

  const months = PRESET_MONTHS[preset];
  if (months !== undefined) return addMonths(latestDate, -months);

  return latestDate;
}

function addDays(dateString: string, days: number) {
  const date = parseDateOnly(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

function addMonths(dateString: string, months: number) {
  const date = parseDateOnly(dateString);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toDateOnly(date);
}

function parseDateOnly(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}
