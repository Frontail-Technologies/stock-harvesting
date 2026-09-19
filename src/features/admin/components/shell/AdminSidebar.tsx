"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactElement } from "react";
import Image from "next/image";
import { LogOut, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { getBrandLogoPath } from "@/components/ui/brand-logo-paths";
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
import { useAdminLogout } from "@/features/auth";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/utils/cn";
import { getAvatarInitials } from "@/utils/api-client";
import { adminPath } from "@/utils/seo";
import { ADMIN_NAV_ITEMS } from "../../constants/admin-nav";

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
  const logout = useAdminLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out successfully");
    } catch {
      // no toast on failure
    }

    router.replace("/admin/login");
  };

  return (
    <Sidebar
      style={{
        "--sidebar": "#111315",
        "--sidebar-foreground": "#e8e5dc",
        "--sidebar-accent": "#1b1d20",
        "--sidebar-accent-foreground": "#f7f4eb",
        "--sidebar-border": "#2a2c2f",
      } as CSSProperties}
      className={cn(
        "relative border-sidebar-border/70 bg-sidebar",
        collapsed ? "w-16" : onNavigate ? "w-72" : "w-60",
        className,
      )}
    >
      <SidebarHeader className="h-auto min-h-20 border-b-0 px-4 py-4">
        <Link
          href={adminPath("/admin/users")}
          onClick={onNavigate}
          className={cn(
            "flex min-w-0 items-center",
            collapsed ? "justify-center" : "gap-2.5"
          )}
          aria-label="Admin users"
        >
          {collapsed ? (
            <Image src={getBrandLogoPath("dark")} alt="Stock Harvesting" width={420} height={420} className="size-9 object-contain" />
          ) : (
            <>
              <Image src={getBrandLogoPath("dark")} alt="" width={420} height={420} className="size-9 shrink-0 object-contain" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-sidebar-foreground">Stock Harvesting</span>
                <span className="block text-[11px] text-sidebar-foreground/45">Admin Console</span>
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

      <SidebarContent className="px-3 py-2">
        <SidebarMenu className="gap-1.5">
          {ADMIN_NAV_ITEMS.map((item) => {
            const href = adminPath(item.href);
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            const menuItem = (
              <SidebarMenuItem
                active={active}
                disabled={item.disabled}
                className={cn(
                  "h-10 rounded-md text-[13px] [&_svg]:size-[17px]",
                  !collapsed && "gap-3 px-3",
                  active && "before:hidden !bg-primary/15 !text-primary shadow-sm [&_svg]:text-primary",
                )}
              >
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
                <Link href={href} onClick={onNavigate}>
                  {menuItem}
                </Link>
              </AdminSidebarTooltip>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t-0 px-3 pb-4 pt-2">
        {collapsed ? (
          <>
            <AdminSidebarTooltip label="Change theme">
              <ThemeToggle className="border-sidebar-border bg-transparent" />
            </AdminSidebarTooltip>
            <SidebarTrigger />
            <AdminSidebarTooltip label={user.name || user.email}>
              <div aria-label="Account">
                <Avatar className="size-9">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </AdminSidebarTooltip>
            <AdminSidebarTooltip label="Log out">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label="Log out"
                aria-busy={logout.isPending}
                disabled={logout.isPending}
                onClick={handleLogout}
                className="rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {logout.isPending ? <Spinner size="sm" /> : <LogOut className="size-4" />}
              </Button>
            </AdminSidebarTooltip>
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-between gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/25 p-1.5">
              <span className="pl-2 text-xs font-medium text-sidebar-foreground/60">Appearance</span>
              <div className="flex items-center gap-1">
                <ThemeToggle className="size-8 border-0 bg-sidebar hover:bg-sidebar-accent" />
                <SidebarTrigger className="size-8" />
              </div>
            </div>

            <div className="flex w-full items-center gap-3 rounded-md px-2 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-sidebar-foreground">
                    {user.name || user.email}
                  </div>
                  <div className="truncate text-[11px] text-sidebar-foreground/45">{user.email}</div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              aria-busy={logout.isPending}
              disabled={logout.isPending}
              onClick={handleLogout}
              className="h-10 w-full justify-start gap-3 rounded-md px-3 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              {logout.isPending ? <Spinner size="sm" /> : <LogOut className="size-4" />}
              Log out
            </Button>
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
