"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartCandlestick, LayoutDashboard, LayoutGrid, Star, UserRound } from "lucide-react";
import { cn } from "@/utils/cn";

const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Charts", href: "/charts", icon: ChartCandlestick },
  { label: "Widget", href: "/widget", icon: LayoutGrid },
  { label: "Watchlists", href: "/watchlists", icon: Star },
  { label: "Profile", href: "/profile", icon: UserRound },
] as const;

export function MobileBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-60 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden supports-[backdrop-filter]:bg-background/88"
    >
      <div className="grid h-16 grid-cols-5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const matchPath = "matchPath" in item ? item.matchPath : item.href;
          const active = pathname === matchPath || pathname.startsWith(`${matchPath}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                active && "text-primary",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
              <span className="max-w-full truncate">{item.label}</span>
              {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
