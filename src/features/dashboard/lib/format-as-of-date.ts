export function formatMediumDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

export function formatAsOfDate(asOfDate: string | null | undefined): string {
  const formatted = formatMediumDate(asOfDate);
  return formatted ? `As of ${formatted}` : "";
}

// For weekly Harvest results, whose date identity is a week-ending Friday,
// not a daily "as of" marker - kept distinct from formatAsOfDate, which is
// still correct for the daily relative-strength metric.
export function formatWeekEnding(weekEnding: string | null | undefined): string {
  const formatted = formatMediumDate(weekEnding);
  return formatted ? `Week ending ${formatted}` : "";
}
