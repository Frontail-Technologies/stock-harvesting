"use client";

import { Download, MoreVertical, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="hidden text-2xl font-semibold text-foreground sm:block">Users</h1>
        <span className="text-sm font-medium text-muted-foreground">
          {totalUsers.toLocaleString("en-IN")} users
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 rounded-md"
          onClick={onCreateAdmin}
        >
          <UserPlus className="size-3.5" />
          <span className="hidden min-[380px]:inline">New admin</span>
        </Button>
        <div className="hidden items-center gap-2 sm:flex">
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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="More user actions"
                className="rounded-md border-border bg-[var(--admin-elevated)] sm:hidden"
              >
                <MoreVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
              Refresh
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport} disabled={exporting}>
              <Download />
              {exporting ? "Exporting" : "Export CSV"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
