import type { MarketCollection } from "@/features/market-collections";
import type { WidgetSource } from "../types";

// The Widget page's fallback source list for a user with no saved
// preference yet - entirely DB-driven (marketCollections.showOnWidgetDefault
// / widgetOrder), never a hardcoded name/id list on the client. Segments
// only: Watchlists are always user-added, never a default.
export function getDefaultWidgetSources(collections: MarketCollection[]): WidgetSource[] {
  return collections
    .filter((collection) => collection.showOnWidgetDefault)
    .sort((a, b) => {
      if (a.widgetOrder === b.widgetOrder) return a.name.localeCompare(b.name);
      if (a.widgetOrder === null) return 1;
      if (b.widgetOrder === null) return -1;
      return a.widgetOrder - b.widgetOrder;
    })
    .map((collection): WidgetSource => ({ type: "segment", id: collection.id }));
}
