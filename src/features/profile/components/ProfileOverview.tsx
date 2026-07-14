import { LogOut } from "lucide-react";
import type { UserProfile } from "@/types/user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function ProfileOverview({ user }: { user: UserProfile }) {
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

      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
        {user.plan} Plan
      </Badge>

      <p className="text-xs text-muted-foreground">Renews on {user.renewsOn}</p>

      <Separator className="my-1" />

      <button
        type="button"
        className="flex items-center gap-1.5 text-sm font-medium text-danger transition-colors hover:text-danger/80"
      >
        <LogOut className="size-4" />
        Log Out
      </button>
    </div>
  );
}
