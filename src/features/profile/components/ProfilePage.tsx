"use client";

import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useCurrentUser, useLogout } from "@/features/auth";
import { useTheme } from "@/features/theme";
import { getAvatarInitials } from "@/utils/api-client";

export function ProfilePage() {
  const router = useRouter();
  const user = useCurrentUser().data;
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out successfully");
    } catch {
      // Authentication state is cleared by the mutation when possible; return to login either way.
    } finally {
      router.replace("/login");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>

      <section className="flex items-center gap-3 border-b border-border pb-4 sm:pb-5">
        <Avatar className="size-14">
          {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name || user.email} referrerPolicy="no-referrer" /> : null}
          <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
            {user ? getAvatarInitials(user.name ?? "", user.email) : "-"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{user?.name || "Account"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </section>

      <section className="flex items-center justify-between gap-4 border-b border-border pb-4 sm:pb-5">
        <div className="flex items-center gap-3">
          {isDark ? <Moon className="size-5 text-muted-foreground" /> : <Sun className="size-5 text-muted-foreground" />}
          <div>
            <p className="font-medium text-foreground">Appearance</p>
            <p className="text-sm text-muted-foreground">{isDark ? "Dark" : "Light"} theme</p>
          </div>
        </div>
        <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
      </section>

      <Button type="button" variant="destructive" className="w-full sm:w-fit" disabled={logout.isPending} onClick={handleLogout}>
        <LogOut />
        Log out
      </Button>
    </div>
  );
}
