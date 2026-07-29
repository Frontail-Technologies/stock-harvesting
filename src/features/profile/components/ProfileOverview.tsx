"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/types/user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth";

export function ProfileOverview({ user }: { user: UserProfile }) {
  const router = useRouter();
  const logout = useLogout();
  const planLabel = user.plan === "pro" ? "Pro" : "Free";

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    router.replace("/login");
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center text-card-foreground shadow-sm dark:shadow-none">
      <Avatar size="lg" className="size-16">
        <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
          {user.avatarInitials}
        </AvatarFallback>
      </Avatar>

      <div>
        <h2 className="text-base font-semibold text-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Badge
        variant="outline"
        className="border-brand-gold/40 bg-brand-gold/10 text-brand-gold"
      >
        {planLabel} Plan
      </Badge>

      {user.renewsOn && (
        <p className="text-xs text-muted-foreground">{user.renewsOn}</p>
      )}

      <Separator className="my-1" />

      <button
        type="button"
        disabled={logout.isPending}
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm font-medium text-danger transition-colors hover:text-danger/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {logout.isPending ? <Spinner size="sm" /> : <LogOut className="size-4" />}
        {logout.isPending ? "Logging out..." : "Log Out"}
      </button>
    </div>
  );
}
