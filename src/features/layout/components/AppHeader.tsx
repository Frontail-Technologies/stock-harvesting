"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/features/auth";
import { MarketSelector } from "@/features/market";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/utils/cn";
import { getAvatarInitials } from "@/utils/api-client";
import { getAdminOrigin } from "@/utils/seo";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [{ label: "Scanner", href: "/scanner" }];

// When the admin panel is split onto its own host (src/proxy.ts), link
// straight there instead of bouncing through the main host's redirect.
const ADMIN_ORIGIN = getAdminOrigin();
const ADMIN_HREF = ADMIN_ORIGIN ? `${ADMIN_ORIGIN}/admin` : "/admin";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useCurrentUser().data;
  const logout = useLogout();
  const navItems =
    currentUser?.role === "admin"
      ? [...NAV_ITEMS, { label: "Admin", href: ADMIN_HREF }]
      : NAV_ITEMS;
  const avatarInitials = currentUser
    ? getAvatarInitials(currentUser.name ?? "", currentUser.email)
    : "SH";

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/login");
  };

  const accountBlock = (
    <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {avatarInitials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">
            {currentUser?.name ?? "Account"}
          </span>
          <span className="block truncate text-xs font-medium text-muted-foreground">
            {currentUser?.email}
          </span>
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Log out"
        disabled={logout.isPending}
        onClick={() => {
          setMobileOpen(false);
          void handleLogout();
        }}
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );

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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation"
                  className="size-9 border border-sidebar-border text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive && "bg-primary/15 text-primary"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 border-t border-sidebar-border pt-4">
                <MarketSelector className="w-full" />
                {accountBlock}
              </div>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <header className="relative z-50 h-16 shrink-0 border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex h-full w-full items-center gap-3 px-3 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 border border-border text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <Link href="/scanner" className="flex items-center gap-2">
              <BrandLogo size="sm" textClassName="hidden text-sm sm:inline" />
            </Link>
          </div>

          <nav className="hidden items-center justify-center gap-6 lg:flex">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative py-5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "text-foreground"
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
            <MarketSelector className="hidden sm:block" />
            <ThemeToggle />
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Log out"
              disabled={logout.isPending}
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      {mobileDrawer}
    </>
  );
}
