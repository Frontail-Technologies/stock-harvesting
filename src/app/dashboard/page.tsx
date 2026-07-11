"use client";

import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex-1 bg-muted/40 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time market analytics and relative strength insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Updated at: 10th Jul, 3:30pm
              </span>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          <DashboardGrid />
        </div>
      </div>
    </AppShell>
  );
}
