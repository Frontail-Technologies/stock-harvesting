export type DashboardItem = {
  rank: number;
  label: string;
  value: number;

  color: string;
  metric?: "change" | "volume" | "price";
  exchange?: string;
};

export type DashboardCardVariant = "category" | "stockList";

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
