// Phase D: which countries actually exist is now read live from
// /api/market-collections (each collection's own countryCode - see
// getCollectionMembershipAt's backend counterpart, SUPPORTED_COUNTRY_CODES
// in shared/constants/domain.ts). This module keeps only presentation
// metadata (label/flag) for codes we know how to label nicely - it is NOT
// the source of truth for which countries are selectable. A backend
// country with no entry here still renders (via the fallback below), it
// just won't have a pretty flag/label yet.
const COUNTRY_DISPLAY: Record<string, { label: string; flag: string }> = {
  IN: { label: "India", flag: "🇮🇳" },
};

export function getCountryDisplay(code: string): { label: string; flag: string } {
  return COUNTRY_DISPLAY[code] ?? { label: code, flag: "🌐" };
}
