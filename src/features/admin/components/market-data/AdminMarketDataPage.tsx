"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/features/api";
import { cn } from "@/utils/cn";
import { useAdminMarketDataStream } from "../../hooks/use-admin-market-data-stream";
import {
  useAdminMarketDataHealth,
  useAdminMarketDataJobRuns,
  useAdminMarketDataSchedules,
  useAdminMarketDataWorkers,
} from "../../hooks/use-admin-market-data";
import type {
  AdminBackgroundJobRun,
  AdminBackgroundJobRunStatus,
  AdminScheduledJobStatus,
} from "../../types";
import type {
  AdminJobCompletedEvent,
  AdminJobFailedEvent,
  AdminJobProgressEvent,
  AdminJobStartedEvent,
  AdminMarketDataEvent,
  AdminWorkerStatusEvent,
} from "@/features/market-stream";

const JOB_TYPE_LABEL: Record<string, string> = {
  daily_candle_morning: "Morning Sync",
  daily_candle_post_market: "Post-Market Sync",
  daily_candle_retry: "Retry Sync",
  chart_ensure_fresh: "Chart Ensure-Fresh",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(
    parsed
  );
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3">
      <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminBackgroundJobRunStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        status === "completed" && "bg-success/10 text-success",
        status === "partial" && "bg-warning/10 text-warning",
        status === "failed" && "bg-danger/10 text-danger",
        status === "running" && "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

function ScheduleCard({
  label,
  schedule,
}: {
  label: string;
  schedule: AdminScheduledJobStatus | undefined;
}) {
  const lastRun = schedule?.lastRun ?? null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {lastRun && <StatusBadge status={lastRun.status} />}
      </div>
      {lastRun ? (
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          <span>Last run: {formatDateTime(lastRun.startedAt)}</span>
          <span>
            Processed {lastRun.processedCount} · Updated {lastRun.updatedCount} · Repaired {lastRun.repairedCount} ·
            Failed {lastRun.failedCount}
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">No runs recorded yet.</span>
      )}
      {schedule?.nextRunAt && (
        <span className="text-xs text-muted-foreground">Next run: {formatDateTime(schedule.nextRunAt)}</span>
      )}
    </div>
  );
}

function JobRunRow({ run }: { run: AdminBackgroundJobRun }) {
  const [expanded, setExpanded] = useState(false);
  const failedSymbols = run.metadata.failedSymbols ?? [];
  const canExpand = failedSymbols.length > 0;

  return (
    <>
      <TableRow
        className={canExpand ? "cursor-pointer" : undefined}
        onClick={() => canExpand && setExpanded((current) => !current)}
      >
        <TableCell className="flex items-center gap-1.5">
          {canExpand ? (
            expanded ? (
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="inline-block size-3.5" />
          )}
          {JOB_TYPE_LABEL[run.jobType] ?? run.jobType}
        </TableCell>
        <TableCell>{formatDateTime(run.startedAt)}</TableCell>
        <TableCell>{formatDateTime(run.finishedAt)}</TableCell>
        <TableCell className="text-right tabular-nums">{run.processedCount}</TableCell>
        <TableCell className="text-right tabular-nums">{run.updatedCount}</TableCell>
        <TableCell className="text-right tabular-nums">{run.repairedCount}</TableCell>
        <TableCell className="text-right tabular-nums">{run.failedCount}</TableCell>
        <TableCell>
          <StatusBadge status={run.status} />
        </TableCell>
      </TableRow>
      {expanded && canExpand && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={8} className="bg-muted/30 py-3">
            <div className="flex flex-col gap-1 text-xs">
              {failedSymbols.map((entry, index) => (
                <div key={`${entry.symbol}-${index}`} className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-foreground">{entry.symbol}</span>
                  <span className="text-muted-foreground">{entry.reason}</span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

type JobRunsCache = { runs: AdminBackgroundJobRun[] };
type SchedulesCache = { schedules: AdminScheduledJobStatus[] };
type WorkersCache = { workers: Array<{ name: string; status: "online" | "offline"; lastHeartbeat: string | null; startedAt: string | null }> };

function applyJobStarted(current: JobRunsCache | undefined, data: AdminJobStartedEvent["data"]): JobRunsCache {
  const newRun: AdminBackgroundJobRun = {
    id: data.runId,
    jobType: data.jobType,
    status: "running",
    startedAt: data.startedAt,
    finishedAt: null,
    processedCount: 0,
    updatedCount: 0,
    repairedCount: 0,
    alreadyCurrentCount: 0,
    bootstrapRequiredCount: 0,
    failedCount: 0,
    errorSummary: null,
    metadata: {},
    createdAt: data.startedAt,
  };
  return { runs: [newRun, ...(current?.runs ?? []).filter((run) => run.id !== data.runId)] };
}

function applyJobProgressToRuns(current: JobRunsCache | undefined, data: AdminJobProgressEvent["data"]): JobRunsCache | undefined {
  if (!current) return current;
  return {
    runs: current.runs.map((run) =>
      run.id === data.runId
        ? { ...run, processedCount: data.processed, updatedCount: data.updated, repairedCount: data.repaired, failedCount: data.failed }
        : run
    ),
  };
}

function applyJobTerminalToRuns(
  current: JobRunsCache | undefined,
  data: (AdminJobCompletedEvent | AdminJobFailedEvent)["data"]
): JobRunsCache | undefined {
  if (!current) return current;
  return {
    runs: current.runs.map((run) =>
      run.id === data.runId
        ? {
            ...run,
            status: data.status,
            finishedAt: data.finishedAt,
            ...("processed" in data
              ? { processedCount: data.processed, updatedCount: data.updated, repairedCount: data.repaired, failedCount: data.failed }
              : { failedCount: data.failed }),
          }
        : run
    ),
  };
}

function applyJobStartedToSchedules(current: SchedulesCache | undefined, data: AdminJobStartedEvent["data"]): SchedulesCache | undefined {
  if (!current) return current;
  return {
    schedules: current.schedules.map((schedule) =>
      schedule.jobType === data.jobType
        ? {
            ...schedule,
            lastRun: { status: "running", startedAt: data.startedAt, finishedAt: null, processedCount: 0, updatedCount: 0, repairedCount: 0, failedCount: 0 },
          }
        : schedule
    ),
  };
}

function applyJobProgressToSchedules(current: SchedulesCache | undefined, data: AdminJobProgressEvent["data"]): SchedulesCache | undefined {
  if (!current) return current;
  return {
    schedules: current.schedules.map((schedule) =>
      schedule.jobType === data.jobType && schedule.lastRun
        ? {
            ...schedule,
            lastRun: { ...schedule.lastRun, processedCount: data.processed, updatedCount: data.updated, repairedCount: data.repaired, failedCount: data.failed },
          }
        : schedule
    ),
  };
}

function applyJobTerminalToSchedules(
  current: SchedulesCache | undefined,
  data: (AdminJobCompletedEvent | AdminJobFailedEvent)["data"]
): SchedulesCache | undefined {
  if (!current) return current;
  return {
    schedules: current.schedules.map((schedule) =>
      schedule.jobType === data.jobType && schedule.lastRun
        ? { ...schedule, lastRun: { ...schedule.lastRun, status: data.status, finishedAt: data.finishedAt } }
        : schedule
    ),
  };
}

function applyWorkerStatus(_current: WorkersCache | undefined, data: AdminWorkerStatusEvent["data"]): WorkersCache {
  return { workers: [{ name: data.name, status: data.status, lastHeartbeat: data.lastHeartbeat, startedAt: null }] };
}

export function AdminMarketDataPage() {
  const queryClient = useQueryClient();
  const workersQuery = useAdminMarketDataWorkers();
  const healthQuery = useAdminMarketDataHealth();
  const jobRunsQuery = useAdminMarketDataJobRuns();
  const schedulesQuery = useAdminMarketDataSchedules();

  const reconcile = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataWorkers });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataHealth });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataJobRuns });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataSchedules });
  };

  useAdminMarketDataStream({
    onEvent: (event: AdminMarketDataEvent) => {
      if (event.type === "worker:status") {
        queryClient.setQueryData<WorkersCache>(queryKeys.admin.marketDataWorkers, (current) => applyWorkerStatus(current, event.data));
        return;
      }
      if (event.type === "market-data:job-started") {
        queryClient.setQueryData<JobRunsCache>(queryKeys.admin.marketDataJobRuns, (current) => applyJobStarted(current, event.data));
        queryClient.setQueryData<SchedulesCache>(queryKeys.admin.marketDataSchedules, (current) => applyJobStartedToSchedules(current, event.data));
        return;
      }
      if (event.type === "market-data:job-progress") {
        queryClient.setQueryData<JobRunsCache>(queryKeys.admin.marketDataJobRuns, (current) => applyJobProgressToRuns(current, event.data));
        queryClient.setQueryData<SchedulesCache>(queryKeys.admin.marketDataSchedules, (current) => applyJobProgressToSchedules(current, event.data));
        return;
      }
      if (event.type === "market-data:job-completed" || event.type === "market-data:job-failed") {
        queryClient.setQueryData<JobRunsCache>(queryKeys.admin.marketDataJobRuns, (current) => applyJobTerminalToRuns(current, event.data));
        queryClient.setQueryData<SchedulesCache>(queryKeys.admin.marketDataSchedules, (current) => applyJobTerminalToSchedules(current, event.data));
        reconcile();
      }
    },
    onReconnected: reconcile,
  });

  const worker = workersQuery.data?.workers[0] ?? null;
  const health = healthQuery.data ?? null;
  const runs = jobRunsQuery.data?.runs ?? [];
  const schedules = schedulesQuery.data?.schedules ?? [];
  const scheduleByType = new Map(schedules.map((schedule) => [schedule.jobType, schedule]));

  const lastFailedRun = runs.find((run) => run.failedCount > 0);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Market Data
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Workers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Worker health, candle-sync scheduling, and data freshness for the market data pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Market Data Worker"
          value={worker ? (worker.status === "online" ? "Online" : "Offline") : "-"}
          sub={worker?.lastHeartbeat ? `Heartbeat: ${formatDateTime(worker.lastHeartbeat)}` : undefined}
        />
        <StatCard label="Latest Expected Candle" value={health ? formatDate(health.latestExpectedTradingDate) : "-"} />
        <StatCard
          label="Fresh Symbols"
          value={health ? `${health.fresh} / ${health.activeSymbols}` : "-"}
        />
        <StatCard label="Stale" value={health ? String(health.stale) : "-"} />
        <StatCard label="Failed Last Run" value={lastFailedRun ? String(lastFailedRun.failedCount) : "0"} />
        <StatCard
          label="Last Successful Refresh"
          value={health?.lastSuccessfulRefresh ? formatDateTime(health.lastSuccessfulRefresh) : "-"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ScheduleCard label="Morning Sync" schedule={scheduleByType.get("daily_candle_morning")} />
        <ScheduleCard label="Post-Market Sync" schedule={scheduleByType.get("daily_candle_post_market")} />
        <ScheduleCard label="Retry Sync" schedule={scheduleByType.get("daily_candle_retry")} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Recent Runs</h2>
        {jobRunsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Spinner size="sm" /> Loading...
          </div>
        ) : jobRunsQuery.isError ? (
          <p className="text-sm text-danger">Couldn&apos;t load recent job runs.</p>
        ) : runs.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No job runs recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Job</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Finished</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Repaired</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <JobRunRow key={run.id} run={run} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
