"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { GlobalSearchMobileSheet } from "@/features/global-search/components/GlobalSearchMobileSheet";
import { GlobalSearchNavbarField } from "@/features/global-search/components/GlobalSearchNavbarField";
import { cn } from "@/utils/cn";
import { AccountMenu } from "./AccountMenu";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Charts", href: "/charts" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Watchlists", href: "/watchlists" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="relative z-50 h-16 shrink-0 border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-full w-full items-center gap-3 px-3 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
          <Link href="/charts" className="flex items-center gap-2">
            <BrandLogo size="sm" textClassName="hidden sm:inline-flex" />
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-6 lg:flex">
          <GlobalSearchNavbarField className="ml-2 hidden xl:flex xl:w-64" />
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative py-5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground",
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 lg:gap-4">
          <GlobalSearchMobileSheet className="xl:hidden" />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
