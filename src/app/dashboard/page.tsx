"use client";

import { RefreshCw } from "lucide-react";
import { DashboardGrid } from "@/features/dashboard";
import { AppPage, AppShell } from "@/features/layout";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <AppShell>
      <AppPage>
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
      </AppPage>
    </AppShell>
  );
}
