import { CheckCircle2, XCircle } from "lucide-react";
import type { UsageStats } from "@/types/user";
import { Progress } from "@/components/ui/progress";

export function UsageOverview({ usage }: { usage: UsageStats }) {
  const usagePct = Math.min(
    100,
    Math.round((usage.scansUsedToday / usage.dailyScanLimit) * 100)
  );

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-foreground">Usage</h3>

      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Scans Used Today</span>
          <span className="font-medium text-foreground">
            {usage.scansUsedToday} / {usage.dailyScanLimit}
          </span>
        </div>
        <Progress value={usagePct} />
        <p className="text-xs text-muted-foreground">
          Daily Scan Limit: {usage.dailyScanLimit} scans per day
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-muted-foreground">Saved Signals</p>
          <p className="mt-0.5 text-base font-semibold text-foreground">
            {usage.savedSignals}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Active Alerts</p>
          <p className="mt-0.5 text-base font-semibold text-foreground">
            {usage.activeAlerts}
          </p>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <p className="text-muted-foreground">API / Data Access:</p>
          {usage.apiAccessEnabled ? (
            <span className="flex items-center gap-1 text-sm font-medium text-brand-green">
              <CheckCircle2 className="size-3.5" />
              Enabled
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-medium text-brand-red">
              <XCircle className="size-3.5" />
              Disabled
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
