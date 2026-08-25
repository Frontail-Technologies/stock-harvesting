import type { AdPlacementKey, MonetizationConfig } from "../types";

// Single source of truth for "should this placement render anything at all" -
// every ad-rendering component calls this instead of re-deriving the rule.
// Mirrors the backend's isPlacementRenderable (monetization.service.ts)
// exactly; this is the one that actually gates the UI.
export function canRenderAd(
  config: MonetizationConfig | null,
  placementKey: AdPlacementKey
): boolean {
  if (!config) return false;
  const placement = config.placements[placementKey];
  if (!placement) return false;

  if (config.mode === "off") return false;
  if (config.mode === "preview") return placement.enabled === true;
  if (config.mode === "live") {
    return Boolean(config.publisherId && placement.enabled && placement.slotId);
  }
  return false;
}
