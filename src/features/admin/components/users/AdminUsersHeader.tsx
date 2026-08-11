"use client";

import { Download, RefreshCw } from "lucide-react";
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
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div>
        <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Admin
        </div>
        <h1 className="mt-1 text-2xl font-semibold uppercase tracking-[0.04em] text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search users, update roles, and manage free or pro plans.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 items-center rounded-md border border-border bg-[var(--admin-elevated)] px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {totalUsers} Users
        </span>
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
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

