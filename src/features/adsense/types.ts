export const MONETIZATION_MODES = ["off", "preview", "live"] as const;
export type MonetizationMode = (typeof MONETIZATION_MODES)[number];

export const AD_PLACEMENT_KEYS = [
  "landing_primary",
  "landing_secondary",
  "scanner_bottom",
  "insights_article",
] as const;
export type AdPlacementKey = (typeof AD_PLACEMENT_KEYS)[number];

export type AdPlacementConfig = {
  enabled: boolean;
  slotId: string | null;
};

// Browser-safe only - the shape served by GET /api/monetization/config.
export type MonetizationConfig = {
  mode: MonetizationMode;
  publisherId: string | null;
  placements: Partial<Record<AdPlacementKey, AdPlacementConfig>>;
};

type AdsByGoogleQueue = Array<Record<string, unknown>> & {
  push: (config: Record<string, unknown>) => number;
};

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}
