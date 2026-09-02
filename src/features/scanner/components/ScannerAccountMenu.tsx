"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LineChart, ListChecks, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { useCurrentUser, useLogout } from "@/features/auth";
import { getAvatarInitials } from "@/utils/api-client";

export function ScannerAccountMenu() {
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;
  const logout = useLogout();
  const avatarInitials = currentUser
    ? getAvatarInitials(currentUser.name ?? "", currentUser.email)
    : "SH";

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out successfully");
    } catch {
      // no toast on failure
    }
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              type="button"
              aria-label="Account menu"
              className="inline-flex size-8 items-center justify-center rounded-full outline-none ring-ring transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          }
        >
          <Avatar className="size-8">
            {currentUser?.avatarUrl ? (

              <AvatarImage
                src={currentUser.avatarUrl}
                alt={currentUser.name || currentUser.email}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="scanner-portal">
          Account menu
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="scanner-portal w-64 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2">
            <span className="block truncate text-sm font-semibold text-foreground">
              {currentUser?.name ?? "Account"}
            </span>
            <span className="block truncate text-xs font-medium text-muted-foreground">
              {currentUser?.email ?? "Signed in"}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/dashboard" className="h-9 cursor-pointer px-3" />}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href="/watchlists" className="h-9 cursor-pointer px-3" />}
        >
          <ListChecks className="size-4" />
          Watchlists
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href="/charts" className="h-9 cursor-pointer px-3" />}
        >
          <LineChart className="size-4" />
          Charts
        </DropdownMenuItem>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
