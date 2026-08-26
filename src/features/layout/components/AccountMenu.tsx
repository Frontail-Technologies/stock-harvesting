"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useTheme } from "@/features/theme";
import { cn } from "@/utils/cn";
import { getAvatarInitials } from "@/utils/api-client";

type AccountMenuProps = {
  className?: string;
  // Scanner/watchlists portals need their own theme-token scoping once
  // portaled outside their DOM subtree (see MarketSelector/ThemeToggle) -
  // main-site callers (Landing, the app navbar) omit this and get the
  // regular popover styling.
  portalClassName?: string;
};

// The one account dropdown for the main site's navbars (Landing + the
// authenticated app's AppHeader) - guest and authenticated states share
// this component instead of each navbar rendering its own ad-hoc
// combination of a bare Login link and a separate avatar/logout button
// (that combination is exactly what produced the earlier duplicate-Login
// bug). Scanner keeps its own ScannerAccountMenu untouched - this is not a
// replacement for that, just the shared main-site version.
export function AccountMenu({ className, portalClassName }: AccountMenuProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;
  const logout = useLogout();
  const isDark = theme === "dark";
  const avatarInitials = currentUser
    ? getAvatarInitials(currentUser.name ?? "", currentUser.email)
    : null;

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/login");
  };

  const themeRow = (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-foreground">
        {isDark ? <Moon className="size-3.5 text-muted-foreground" /> : <Sun className="size-3.5 text-muted-foreground" />}
        Theme
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              type="button"
              aria-label="Account menu"
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full outline-none ring-ring transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                className
              )}
            />
          }
        >
          {currentUser ? (
            <Avatar className="size-8">
              {currentUser.avatarUrl ? (
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.email} />
              ) : null}
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <User className="size-4" />
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className={portalClassName}>
          Account menu
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className={cn(
          "w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl",
          portalClassName
        )}
      >
        {currentUser ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {currentUser.name}
                </span>
                <span className="block truncate text-xs font-medium text-muted-foreground">
                  {currentUser.email}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/scanner" className="h-9 cursor-pointer px-3" />}
            >
              Open Workspace
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href="/watchlists" className="h-9 cursor-pointer px-3" />}
            >
              Watchlists
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {themeRow}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={logout.isPending}
              onClick={() => void handleLogout()}
              className="h-9 cursor-pointer px-3"
            >
              <LogOut className="size-4" />
              {logout.isPending ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              render={<Link href="/login" className="h-9 cursor-pointer px-3" />}
            >
              <User className="size-4" />
              Sign in
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {themeRow}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
