"use client";

import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAdminDate } from "../../lib/admin-formatters";
import {
  useAdminWeeklyStrongBacktestHistoricalStatus,
  useAdminWeeklyStrongBacktestStatus,
  useGenerateAdminWeeklyStrongBacktest,
  useRebuildAdminWeeklyStrongBacktestHistorical,
} from "../../hooks/use-admin-market-collections";

// Admin surface for the persisted Weekly Strong backtest: the
// current-membership series (Phase C2) plus, once at least one membership
// version has been imported, the historically-correct point-in-time
// series (Phase D) - kept as two clearly-labeled sub-sections in one card
// rather than a second page, since they're the same underlying feature at
// two levels of correctness.
export function AdminWeeklyStrongBacktestStatus({ collectionId }: { collectionId: string }) {
  const statusQuery = useAdminWeeklyStrongBacktestStatus(collectionId);
  const generate = useGenerateAdminWeeklyStrongBacktest();
  const status = statusQuery.data?.status;

  const historicalStatusQuery = useAdminWeeklyStrongBacktestHistoricalStatus(collectionId);
  const rebuildHistorical = useRebuildAdminWeeklyStrongBacktestHistorical();
  const historicalStatus = historicalStatusQuery.data?.status;

  const handleGenerate = () => {
    generate.mutate({ id: collectionId });
  };
  const handleRebuildHistorical = () => {
    rebuildHistorical.mutate({ id: collectionId });
  };

  const isBusy = status?.state === "generating" || generate.isPending;
  const isHistoricalBusy = historicalStatus?.state === "generating" || rebuildHistorical.isPending;
  const canRebuildHistorical = status?.state === "ready";

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 text-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Current-Membership Backtest</h2>
          <StatusBadge state={status?.state} />
        </div>

        {statusQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading status...</p>
        ) : status?.state === "ready" ? (
          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Weeks generated</dt>
              <dd className="font-medium text-foreground">{status.weeksGenerated}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Latest week</dt>
              <dd className="font-medium text-foreground">{formatAdminDate(status.latestWeek)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last generated at</dt>
              <dd className="font-medium text-foreground">{formatAdminDate(status.lastGeneratedAt)}</dd>
            </div>
          </dl>
        ) : status?.state === "failed" ? (
          <p className="text-xs text-danger">{status.errorMessage ?? "The last run failed."}</p>
        ) : status?.state === "generating" ? (
          <p className="text-xs text-muted-foreground">
            Generating - this runs in the background and can take a while for a large segment.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No backtest has been generated yet.</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isBusy}
          onClick={handleGenerate}
          className="w-fit gap-1.5"
        >
          {isBusy && <Loader2 className="size-3.5 animate-spin" />}
          {status?.state === "ready" ? "Rebuild Backtest" : "Generate Backtest"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Historical-Membership Backtest</h2>
          <StatusBadge state={historicalStatus?.state} />
        </div>

        {!canRebuildHistorical ? (
          <p className="text-xs text-muted-foreground">
            Run the current-membership backtest above at least once first.
          </p>
        ) : historicalStatusQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading status...</p>
        ) : historicalStatus?.state === "ready" ? (
          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Weeks generated</dt>
              <dd className="font-medium text-foreground">{historicalStatus.weeksGenerated}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Latest week</dt>
              <dd className="font-medium text-foreground">{formatAdminDate(historicalStatus.latestWeek)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last generated at</dt>
              <dd className="font-medium text-foreground">{formatAdminDate(historicalStatus.lastGeneratedAt)}</dd>
            </div>
          </dl>
        ) : historicalStatus?.state === "failed" ? (
          <p className="text-xs text-danger">{historicalStatus.errorMessage ?? "The last run failed."}</p>
        ) : historicalStatus?.state === "generating" ? (
          <p className="text-xs text-muted-foreground">
            Rebuilding - resolves each completed week&apos;s point-in-time membership version and re-evaluates
            only that week&apos;s actual constituents.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Not generated yet. Import at least one dated membership version, then rebuild.
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canRebuildHistorical || isHistoricalBusy}
          onClick={handleRebuildHistorical}
          className="w-fit gap-1.5"
        >
          {isHistoricalBusy && <Loader2 className="size-3.5 animate-spin" />}
          {historicalStatus?.state === "ready" ? "Rebuild Historical Backtest" : "Generate Historical Backtest"}
        </Button>
      </div>
    </section>
  );
}

function StatusBadge({ state }: { state?: "not_generated" | "generating" | "ready" | "failed" }) {
  if (!state || state === "not_generated") {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        Not generated
      </Badge>
    );
  }
  if (state === "generating") {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        Generating
      </Badge>
    );
  }
  if (state === "ready") {
    return (
      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
        Ready
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-danger/30 bg-danger/10 text-danger">
      Failed
    </Badge>
  );
}
