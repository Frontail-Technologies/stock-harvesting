"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { Home, LogOut, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AuthUser } from "@/features/auth";
import { useLogout } from "@/features/auth";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/utils/cn";
import { getAvatarInitials } from "@/utils/api-client";
import { IS_PRODUCTION_LOCKDOWN } from "@/utils/production-lockdown";
import { adminPath, getSiteUrl } from "@/utils/seo";
import { ADMIN_NAV_ITEMS } from "../../constants/admin-nav";

// The admin panel can live on its own host, where "/admin" must never be
// visible in the URL bar (src/proxy.ts rewrites clean paths into the
// internal "/admin/*" tree) - ADMIN_NAV_ITEMS still stores the internal
// form so `pathname` (from usePathname(), which always reflects the
// rewritten internal path) can be compared against it directly for the
// active-link state; only the rendered href needs the stripped form.
const SCANNER_URL = `${getSiteUrl().origin}/scanner`;

type AdminSidebarProps = {
  pathname: string | null;
  user: AuthUser;
  className?: string;
  onNavigate?: () => void;
};

export function AdminSidebar({
  pathname,
  user,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const { collapsed } = useSidebar();
  const avatarInitials = getAvatarInitials(user.name, user.email);
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/login");
  };

  return (
    <Sidebar
      className={cn("relative border-sidebar-border/80", onNavigate && "w-72", className)}
    >
      <SidebarHeader>
        <Link
          href={adminPath("/admin/users")}
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 flex-col",
            collapsed ? "items-center" : "items-start"
          )}
          aria-label="Admin users"
        >
          {collapsed ? (
            <span className="inline-flex size-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent/55 font-mono text-xs font-semibold text-primary">
              SH
            </span>
          ) : (
            <>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Stock Harvesting
              </span>
              <span className="mt-1 text-sm font-semibold text-sidebar-foreground">
                Admin / Console
              </span>
            </>
          )}
        </Link>

        {onNavigate && (
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={onNavigate}
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="py-5">
        <SidebarMenu>
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const menuItem = (
              <SidebarMenuItem active={active} disabled={item.disabled}>
                {item.icon}
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarMenuItem>
            );

            if (item.disabled) {
              return (
                <AdminSidebarTooltip key={item.href} label={`${item.label} - Soon`}>
                  {menuItem}
                </AdminSidebarTooltip>
              );
            }

            return (
              <AdminSidebarTooltip key={item.href} label={item.label}>
                <Link href={adminPath(item.href)} onClick={onNavigate}>
                  {menuItem}
                </Link>
              </AdminSidebarTooltip>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/80">
        {collapsed ? (
          <>
            <AdminSidebarTooltip label="Open app">
              <a
                href={SCANNER_URL}
                onClick={onNavigate}
                aria-label="Open app"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-lg" }),
                  "rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Home className="size-4" />
              </a>
            </AdminSidebarTooltip>
            <AdminSidebarTooltip label="Change theme">
              <ThemeToggle />
            </AdminSidebarTooltip>
            <SidebarTrigger />
            {IS_PRODUCTION_LOCKDOWN ? (
              <AdminSidebarTooltip label="Log out">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Log out"
                  disabled={logout.isPending}
                  onClick={handleLogout}
                  className="rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="size-4" />
                </Button>
              </AdminSidebarTooltip>
            ) : (
              <AdminSidebarTooltip label={user.name || user.email}>
                <div aria-label="Account">
                  <Avatar className="size-9">
                    {user.avatarUrl ? (
                      <AvatarImage
                        src={user.avatarUrl}
                        alt={user.name || user.email}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </AdminSidebarTooltip>
            )}
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-between gap-2">
              <SidebarTrigger className="border border-sidebar-border/70 bg-sidebar-accent/25" />
              <div className="flex items-center gap-1.5">
                <a
                  href={SCANNER_URL}
                  onClick={onNavigate}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-8 rounded-md border-sidebar-border/70 bg-transparent px-3 text-xs text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  App
                </a>
                <ThemeToggle />
              </div>
            </div>

            {IS_PRODUCTION_LOCKDOWN ? (
              <div className="flex w-full items-center justify-between gap-3 border-t border-sidebar-border/70 pt-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10 shrink-0">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-sidebar-foreground">
                      {user.name || user.email}
                    </div>
                    <div className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-sidebar-foreground/45">
                      {user.role}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Log out"
                  disabled={logout.isPending}
                  onClick={handleLogout}
                  className="rounded-md text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <div
                aria-label="Account"
                className="flex w-full items-center gap-3 border-t border-sidebar-border/70 pt-3 text-left"
              >
                <Avatar className="size-10 shrink-0">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-sidebar-foreground">
                    {user.name || user.email}
                  </div>
                  <div className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-sidebar-foreground/45">
                    {user.role}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminSidebarTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  const { collapsed } = useSidebar();

  if (!collapsed) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
