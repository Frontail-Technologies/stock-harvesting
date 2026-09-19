import type { ReactNode } from "react";
import { Activity, ChartNoAxesCombined, Layers, Megaphone, Radio, Sparkles, Users } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  disabled?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Analytics", href: "/admin/analytics", icon: <ChartNoAxesCombined className="size-4" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="size-4" /> },
  {
    label: "AI Settings",
    href: "/admin/ai-settings",
    icon: <Sparkles className="size-4" />,
  },
  {
    label: "Data Providers",
    href: "/admin/data-providers",
    icon: <Radio className="size-4" />,
  },
  {
    label: "Segments",
    href: "/admin/market-collections",
    icon: <Layers className="size-4" />,
  },
  {
    label: "Market Data",
    href: "/admin/jobs",
    icon: <Activity className="size-4" />,
  },
  {
    label: "Ads",
    href: "/admin/ads",
    icon: <Megaphone className="size-4" />,
  },
];
