// Deliberately no flag emoji here - a regional-indicator flag glyph
// (🇮🇳 etc.) has no guaranteed rendering across platforms/fonts; on
// systems without a proper flag glyph it commonly falls back to a boxed
// two-letter placeholder with its own opaque background, which reads as
// a broken "black box" against this app's dark theme. The country code
// badge rendered from `code` in DashboardPage.tsx is fully theme-token
// styled instead, so it can never introduce that failure mode.
const COUNTRY_DISPLAY: Record<string, { label: string }> = {
  IN: { label: "India" },
};

export function getCountryDisplay(code: string): { label: string } {
  return COUNTRY_DISPLAY[code] ?? { label: code };
}
