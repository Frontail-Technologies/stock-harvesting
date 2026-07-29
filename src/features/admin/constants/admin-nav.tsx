import type { ReactNode } from "react";
import {
  Database,
  ImageIcon,
  Sparkles,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  disabled?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Users", href: "/admin/users", icon: <Users className="size-4" /> },
  {
    label: "AI Settings",
    href: "/admin/ai-settings",
    icon: <Sparkles className="size-4" />,
  },
  {
    label: "Data Provider",
    href: "/admin/data-provider",
    icon: <Database className="size-4" />,
  },
  {
    label: "Branding",
    href: "/admin/branding",
    icon: <ImageIcon className="size-4" />,
    disabled: true,
  },
];
