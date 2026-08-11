"use client";

import { Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminUsersHeaderProps = {
  totalUsers: number;
  refreshing: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onExport: () => void;
};

export function AdminUsersHeader({
  totalUsers,
  refreshing,
  exporting,
  onRefresh,
  onExport,
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
          onClick={onExport}
          disabled={exporting}
        >
          <Download className="size-3.5" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
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
