import type { DashboardCardData, DashboardItem } from "@/types/dashboard";
import { colorForDashboardLabel } from "@/features/dashboard/lib/dashboard-widget-colors";

function buildItems(labels: string[], values: number[]): DashboardItem[] {
  return labels.map((label, index) => ({
    rank: index + 1,
    label,
    value: values[index],
    color: colorForDashboardLabel(label),
  }));
}

const TIMESTAMP = "10th Jul, 3:30pm";

export const dashboardCards: DashboardCardData[] = [
  {
    id: "relative-strength-index",
    title: "Relative Strength Index",
    timestamp: TIMESTAMP,
    variant: "category",
    items: buildItems(
      [
        "NIFTY REALTY",
        "NIFTY PHARMA",
        "NIFTY HEALTHCARE",
        "NIFTY MEDIA",
        "NIFTY SMALLCAP 100",
        "NIFTY CHEMICALS",
        "NIFTY MIDSELECT",
        "NIFTY INFRA",
        "NIFTY AUTO",
        "NIFTY METAL",
      ],
      [16.84, 14.32, 12.78, 11.31, 8.79, 6.83, 4.6, 1.37, -2.95, -6.18]
    ),
  },
  {
    id: "relative-strength-sector",
    title: "Relative Strength Sector",
    timestamp: TIMESTAMP,
    variant: "category",
    items: buildItems(
      [
        "Healthcare",
        "Information Technology",
        "Services",
        "Chemicals",
        "Banking",
        "FMCG",
        "Auto",
        "Realty",
        "Metals & Mining",
        "Power & Utilities",
      ],
      [25.75, 18.9, 14.18, 9.42, 5.97, 2.86, -1.14, -4.96, -10.47, -18.96]
    ),
  },
  {
    id: "relative-strength-industry",
    title: "Relative Strength Industry",
    timestamp: TIMESTAMP,
    variant: "category",
    items: buildItems(
      [
        "Steel - Large",
        "Pharmaceuticals - Formulations",
        "Pharmaceuticals - Bulk Drugs",
        "Computers - Software Medium",
        "Trading",
        "Chemicals",
        "Banks - Private Sector",
        "Auto Ancillaries",
        "Finance - Housing",
        "Electric Equipment",
      ],
      [41.59, 29.19, 18.28, 9.75, 4.18, 1.42, -3.87, -8.21, -14.17, -23.51]
    ),
  },
  {
    id: "weekly-strong-stock-list",
    title: "Weekly Strong Stock List",
    timestamp: TIMESTAMP,
    variant: "stockList",
    items: buildItems(
      [
        "CUB",
        "AEGISLOG",
        "WELCORP",
        "NEULANDLAB",
        "HSCL",
        "SALIFE",
        "TATATECH",
        "WOCKPHARMA",
        "COFHASE",
        "REDINGTON",
      ],
      [35.7, 24.85, 14.56, 9.35, 6.26, 3.42, -1.83, -5.97, -9.86, -14.21]
    ),
  },
  {
    id: "relative-strength-index-top-500",
    title: "Relative Strength Index Top 500",
    timestamp: TIMESTAMP,
    variant: "category",
    items: buildItems(
      [
        "NIFTY100 QUALITY30",
        "NIFTY200 MOMENTUM30",
        "NIFTY LARGEMIDCAP250",
        "NIFTY MIDCAP150",
        "NIFTY TOTAL MARKET",
        "NIFTY500 VALUE50",
        "NIFTY100 LOWVOL30",
        "NIFTY MICROCAP250",
        "NIFTY100 EQUAL WEIGHT",
        "NIFTY DIVIDEND OPPS 50",
      ],
      [19.42, 15.03, 11.87, 8.64, 5.21, 2.08, -1.39, -5.64, -9.72, -15.03]
    ),
  },
  {
    id: "relative-strength-sector-mix",
    title: "Relative Strength Sector Mix",
    timestamp: TIMESTAMP,
    variant: "category",
    items: buildItems(
      [
        "Consumer Durables",
        "Capital Goods",
        "Textiles",
        "Telecom",
        "Cement",
        "Oil & Gas",
        "Media & Entertainment",
        "Construction",
        "Fertilizers",
        "Paper",
      ],
      [21.36, 16.72, 12.05, 8.19, 4.53, 0.92, -2.64, -6.83, -11.29, -17.42]
    ),
  },
  {
    id: "relative-strength-industry-mix",
    title: "Relative Strength Industry Mix",
    timestamp: TIMESTAMP,
    variant: "category",
    items: buildItems(
      [
        "Diversified - Large",
        "IT Enabled Services",
        "Refineries",
        "Tyres",
        "Sugar",
        "Ship Building",
        "Plastics",
        "Airlines",
        "Hotels & Restaurants",
        "Gems Jewellery & Watches",
      ],
      [17.9, 13.24, 9.61, 6.02, 2.44, -1.07, -4.86, -8.93, -13.28, -19.15]
    ),
  },
  {
    id: "weekly-mix-500-strong-stock-list",
    title: "Weekly Mix 500 Strong Stock List",
    timestamp: TIMESTAMP,
    variant: "stockList",
    items: buildItems(
      [
        "GLAND",
        "ANANDRATHI",
        "PIRAMALFIN",
        "LALPATHLAB",
        "MANAPPURAM",
        "IIFL",
        "BANDHANBNK",
        "SONACOMS",
        "POONAWALLA",
        "DELHIVERY",
      ],
      [18.63, 13.87, 9.41, 5.68, 1.94, -2.13, -5.79, -9.86, -13.47, -18.19]
    ),
  },
];
