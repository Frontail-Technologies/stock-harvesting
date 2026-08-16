export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";

export const ADSENSE_SLOTS = {
  landingPrimary: process.env.NEXT_PUBLIC_ADSENSE_LANDING_PRIMARY_SLOT?.trim() ?? "",
  landingSecondary: process.env.NEXT_PUBLIC_ADSENSE_LANDING_SECONDARY_SLOT?.trim() ?? "",
  scanner: process.env.NEXT_PUBLIC_ADSENSE_SCANNER_SLOT?.trim() ?? "",
} as const;

export type AdsensePlacement = keyof typeof ADSENSE_SLOTS;

export function hasAdsenseConfig(slot?: string) {
  return Boolean(ADSENSE_CLIENT && slot?.trim());
}
