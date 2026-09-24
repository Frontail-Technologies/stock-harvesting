"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAdminSessionStore } from "@/features/auth";
import { getAvatarInitials } from "@/utils/api-client";
import { adminPath } from "@/utils/seo";
import { ADMIN_NAV_ITEMS } from "../../constants/admin-nav";
import { AdminForbiddenState, AdminLoadingState } from "./AdminAccessState";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const status = useAdminSessionStore((state) => state.status);
  const user = useAdminSessionStore((state) => state.user);
  const isAdmin = status === "authenticated" && user?.role === "admin";
  const activeNavItem =
    ADMIN_NAV_ITEMS.find((item) => {
      const href = adminPath(item.href);
      return pathname === href || pathname?.startsWith(`${href}/`);
    }) ?? (pathname === adminPath("/admin") ? ADMIN_NAV_ITEMS[0] : undefined);

  useEffect(() => {
    if (status !== "guest") return;

    const next = adminPath(pathname ?? "/admin");
    const params = new URLSearchParams();
    params.set("next", next);
    router.replace(`/admin/login?${params.toString()}`);
  }, [pathname, router, status]);

  if (status === "unknown" || status === "guest") return <AdminLoadingState />;
  if (!isAdmin || !user) return <AdminForbiddenState />;

  return (
    <SidebarProvider defaultCollapsed={false} storageKey="stock-harvesting:admin-sidebar-collapsed">
      <div className="admin-shell flex min-h-dvh w-full max-w-full bg-background text-foreground lg:h-screen lg:overflow-hidden">
        <AdminSidebar pathname={pathname} user={user} className="hidden lg:flex" />

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin navigation"
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <AdminSidebar
              pathname={pathname}
              user={user}
              className="absolute inset-y-0 left-0 flex w-72 shadow-2xl"
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur lg:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open admin navigation"
                className="rounded-md"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground">
                  {activeNavItem?.label ?? "Admin Console"}
                </div>
                <div className="text-[10px] font-medium uppercase text-muted-foreground">
                  Stock Harvesting
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Open account and navigation"
              className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Avatar className="size-8">
                {user.avatarUrl ? (
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {getAvatarInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 lg:overflow-auto lg:px-8 lg:py-7">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

