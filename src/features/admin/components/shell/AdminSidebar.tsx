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
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/login");
  };

  return (
    <Sidebar
      className={cn("relative", onNavigate && "w-18 shadow-2xl", className)}
    >
      <SidebarHeader>
        <Link
          href="/admin/users"
          onClick={onNavigate}
          className="flex min-w-0 items-center justify-center"
          aria-label="Admin users"
        >
          <SidebarLabel className="text-sm font-semibold">
            Admin Console
          </SidebarLabel>
        </Link>

        {onNavigate && (
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={onNavigate}
            className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
          >
            <X className="size-3.5" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent>
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
                <Link href={item.href} onClick={onNavigate}>
                  {menuItem}
                </Link>
              </AdminSidebarTooltip>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {collapsed ? (
          <>
            <AdminSidebarTooltip label="Open app">
              <Link
                href="/scanner"
                onClick={onNavigate}
                aria-label="Open app"
                className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
              >
                <Home className="size-4" />
              </Link>
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
                >
                  <LogOut className="size-4" />
                </Button>
              </AdminSidebarTooltip>
            ) : (
              <AdminSidebarTooltip label={user.name || user.email}>
                <div aria-label="Account">
                  <Avatar className="size-10">
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
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Link
                  href="/scanner"
                  onClick={onNavigate}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  App
                </Link>
                <ThemeToggle />
              </div>
            </div>

            {IS_PRODUCTION_LOCKDOWN ? (
              <div className="flex w-full items-center justify-between gap-3 rounded-lg p-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-11 shrink-0">
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
                    <div className="truncate text-xs text-sidebar-foreground/50">
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
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
            <div
              aria-label="Account"
              className="flex w-full items-start gap-3 rounded-lg p-2 text-left"
            >
              <Avatar className="size-11 shrink-0">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />
                ) : null}
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 pt-1">
                <div className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user.name || user.email}
                </div>
                <div className="truncate text-xs text-sidebar-foreground/50">
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
