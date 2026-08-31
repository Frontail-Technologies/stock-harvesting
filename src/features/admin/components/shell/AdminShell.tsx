"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAdminSessionStore } from "@/features/auth";
import { adminPath } from "@/utils/seo";
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
      <div className="admin-shell flex h-screen overflow-hidden bg-background text-foreground">
        <AdminSidebar pathname={pathname} user={user} className="hidden lg:flex" />

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Open admin navigation"
          className="fixed left-3 top-3 z-40 rounded-md border-border bg-card text-foreground shadow-sm hover:bg-accent lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-4" />
        </Button>

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

        <main className="min-w-0 flex-1 overflow-auto px-5 py-6 pt-16 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

