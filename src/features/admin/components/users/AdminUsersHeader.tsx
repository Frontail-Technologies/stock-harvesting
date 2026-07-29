"use client";

import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminUsersHeaderProps = {
  totalUsers: number;
  refreshing: boolean;
  onRefresh: () => void;
};

export function AdminUsersHeader({
  totalUsers,
  refreshing,
  onRefresh,
}: AdminUsersHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground">
          Search users, update roles, and manage free or pro plans.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-card">
          {totalUsers} total
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
