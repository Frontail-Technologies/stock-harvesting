"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth";
import { GlobalSearchMobileSheet } from "@/features/global-search/components/GlobalSearchMobileSheet";
import { GlobalSearchNavbarField } from "@/features/global-search/components/GlobalSearchNavbarField";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useCurrentUser().data;
  // Strict portal separation (item 19) - a USER-portal session can never
  // belong to an admin-role account (the backend rejects that login
  // outright), so this navbar never has a reason to branch on role or
  // link into the separate admin host. The main app is the USER portal,
  // full stop.

  const mobileDrawer =
    mobileOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 isolate z-[2147483647] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/45"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <BrandLogo size="sm" />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Close navigation"
                        className="size-9 border border-sidebar-border text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileOpen(false)}
                      />
                    }
                  >
                    <X className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Close navigation
                  </TooltipContent>
                </Tooltip>
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-primary/15 text-primary",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-sidebar-border pt-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                    {currentUser?.name ?? "Account"}
                  </span>
                  <span className="block truncate text-xs font-medium text-muted-foreground">
                    {currentUser?.email}
                  </span>
                </span>
                <AccountMenu />
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="relative z-50 h-16 shrink-0 border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex h-full w-full items-center gap-3 px-3 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 border border-border text-muted-foreground hover:text-foreground lg:hidden"
                    aria-label="Open navigation"
                    onClick={() => setMobileOpen(true)}
                  />
                }
              >
                <Menu className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Open navigation</TooltipContent>
            </Tooltip>
            <Link href="/charts" className="flex items-center gap-2">
              {/* No text-size override here anymore - it used to shrink
                  the wordmark well below the mark's own height for extra
                  header-room safety, but that just made it read as
                  mismatched/too-small next to the logo. Only the
                  responsive display (hidden below sm) still needs
                  overriding. */}
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
      {mobileDrawer}
    </>
  );
}
