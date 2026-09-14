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

export function formatAnalysisWeek(weekEnding: string | null | undefined): string {
  const formatted = formatMediumDate(weekEnding);
  return formatted ? `Analysis week: ${formatted}` : "";
}
