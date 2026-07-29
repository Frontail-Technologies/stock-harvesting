"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Open account menu"
        className="inline-flex size-8 items-center justify-center rounded-full outline-none ring-ring transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar className="size-8">
          {currentUser?.avatarUrl ? (
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.email} />
          ) : null}
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {avatarInitials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
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
