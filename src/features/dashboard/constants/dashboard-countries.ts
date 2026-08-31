const COUNTRY_DISPLAY: Record<string, { label: string; flag: string }> = {
  IN: { label: "India", flag: "🇮🇳" },
};

export function getCountryDisplay(code: string): { label: string; flag: string } {
  return COUNTRY_DISPLAY[code] ?? { label: code, flag: "🌐" };
}
