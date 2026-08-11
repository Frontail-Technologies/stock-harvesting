"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useSessionStore } from "@/features/auth";
import { AdminForbiddenState, AdminLoadingState } from "./AdminAccessState";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);
  const isAdmin = status === "authenticated" && user?.role === "admin";

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [router, status]);

  if (status === "unknown" || status === "guest") return <AdminLoadingState />;
  if (!isAdmin || !user) return <AdminForbiddenState />;

  return (
    <SidebarProvider defaultCollapsed={false} storageKey="stock-harvesting:admin-sidebar-collapsed">
      <div className="flex h-screen overflow-hidden bg-surface text-foreground">
        <AdminSidebar pathname={pathname} user={user} className="hidden lg:flex" />

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Open admin navigation"
          className="fixed left-3 top-3 z-40 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-4" />
        </Button>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin navigation"
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <AdminSidebar
              pathname={pathname}
              user={user}
              className="absolute inset-y-0 left-0 flex w-72"
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-auto p-4 pt-14 lg:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
