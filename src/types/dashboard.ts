export type DashboardItemColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red"
  | "teal";

export type DashboardItem = {
  rank: number;
  label: string;
  value: number;
  color: DashboardItemColor;
  metric?: "change" | "volume" | "price";
  exchange?: string;
};

export type DashboardCardVariant = "category" | "stockList";

export type DashboardCardData = {
  id: string;
  title: string;
  timestamp: string;
  variant: DashboardCardVariant;
  items: DashboardItem[];
};
