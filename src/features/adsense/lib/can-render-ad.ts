import type { AdPlacementKey, MonetizationConfig } from "../types";

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
