"use client";

import { Download, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminUsersHeaderProps = {
  totalUsers: number;
  refreshing: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onCreateAdmin: () => void;
};

export function AdminUsersHeader({
  totalUsers,
  refreshing,
  exporting,
  onRefresh,
  onExport,
  onCreateAdmin,
}: AdminUsersHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <span className="text-sm text-muted-foreground">{totalUsers}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 rounded-md"
          onClick={onCreateAdmin}
        >
          <UserPlus className="size-3.5" />
          New admin
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md border-border bg-[var(--admin-elevated)] text-foreground hover:bg-accent"
          onClick={onExport}
          disabled={exporting}
        >
          <Download className="size-3.5" />
          {exporting ? "Exporting" : "Export CSV"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-md border-border bg-[var(--admin-elevated)] text-foreground hover:bg-accent"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    </header>
  );
}
