export type DashboardItem = {
  rank: number;
  label: string;
  value: number;
  // A resolved CSS color value (see dashboard-widget-colors.ts) - a
  // deterministic hash of the item's own label, not its rank, so a given
  // sector/industry/symbol keeps the same color across refreshes and
  // re-sorts instead of reshuffling.
  color: string;
  metric?: "change" | "volume" | "price";
  exchange?: string;
};

export type DashboardCardVariant = "category" | "stockList";

// Cross-filter pass - attached only to the Sector/Industry cards (see
// buildCollectionCards in DashboardSegmentContent.tsx). Its mere presence
// is what makes DashboardWidget render a card's rows as clickable/
// selectable at all - Relative Strength Index and the Weekly Strong
// widget never get this field, so they can never become cross-filter
// sources (item 15), with zero extra plumbing through DashboardWidgetRow/
// ResizablePanel needed - it just rides along on the card object they
// already forward unchanged.
export type DashboardCardCrossFilter = {
  selectedLabel: string | null;
  onSelectLabel: (label: string) => void;
};

export type DashboardCardData = {
  id: string;
  title: string;
  timestamp: string;
  variant: DashboardCardVariant;
  items: DashboardItem[];
  crossFilter?: DashboardCardCrossFilter;
};
