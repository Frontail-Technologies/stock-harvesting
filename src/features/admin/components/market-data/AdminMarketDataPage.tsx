"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertTriangle, Clock3, Database, RefreshCw, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/features/api";
import type { AdminJobProgressEvent, AdminMarketDataEvent } from "@/features/market-stream";
import { cn } from "@/utils/cn";
import {
  catchUpAdminMarketData,
  reconcileAdminMarketData,
  refreshAdminMarketDataBacktests,
} from "../../api/admin-api";
import { useAdminMarketDataStream } from "../../hooks/use-admin-market-data-stream";
import {
  useBackfillAdminIndexCandles,
  useSyncAdminDataProvider,
  useSyncAdminMarketDataPrices,
  useSyncAdminSectorClassification,
} from "../../hooks/use-admin-data-provider";
import {
  useAdminMarketDataHealth,
  useAdminJobs,
  useAdminMarketDataJobRuns,
  useAdminMarketDataOperations,
  useAdminMarketDataWorkers,
} from "../../hooks/use-admin-market-data";
import { useAdminMarketCollections } from "../../hooks/use-admin-market-collections";
import type { AdminBackgroundJobRunStatus, AdminSyncJob } from "../../types";

export const JOB_TYPE_LABEL: Record<string, string> = {
  daily_candle_morning: "Morning Sync",
  daily_candle_post_market: "Post-Market Sync",
  daily_candle_retry: "Retry Sync",
  daily_candle_evening: "Evening Sync",
  chart_ensure_fresh: "Chart Ensure-Fresh",
  "market-data.instrument-sync": "Instrument Sync",
  "market-data.price-refresh": "Price Refresh",
  "market-data.sector-classification-sync": "Sector Classification",
  "market-data.index-candle-backfill": "Index History Backfill",
  "market-data.weekly-strong-backtest-backfill": "Current Backtest",
  "market-data.weekly-strong-backtest-historical-rebuild": "Historical Backtest",
};

const PROVIDER_ACTION_TYPES = new Set([
  "market-data.instrument-sync",
  "market-data.price-refresh",
  "market-data.sector-classification-sync",
  "market-data.index-candle-backfill",
  "market-data.weekly-strong-backtest-backfill",
  "market-data.weekly-strong-backtest-historical-rebuild",
]);

export type AdminJobDisplay = {
  id: string;
  jobType: string;
  status: AdminBackgroundJobRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  processedCount: number;
  updatedCount: number;
  repairedCount: number;
  failedCount: number;
  progress: number | null;
  source: "run" | "provider";
  exchange: string | null;
  tradingDate: string | null;
  collectionId: string | null;
  scope: string;
};

type JobRunsCache = { runs: Array<{
  id: string;
  processedCount: number;
  updatedCount: number;
  repairedCount: number;
  failedCount: number;
  totalExpected?: number;
  [key: string]: unknown;
}> };

function applyJobProgress(current: JobRunsCache | undefined, data: AdminJobProgressEvent["data"]) {
  if (!current) return current;
  return {
    runs: current.runs.map((run) => run.id === data.runId ? {
      ...run,
      processedCount: data.processed,
      updatedCount: data.updated,
      repairedCount: data.repaired,
      failedCount: data.failed,
      totalExpected: data.total,
    } : run),
  };
}

function payloadNumber(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

export function toProviderJobDisplay(job: AdminSyncJob): AdminJobDisplay {
  const progressValue = job.payload.progress;
  const progress = typeof progressValue === "number"
    ? Math.max(0, Math.min(100, Math.round(progressValue)))
    : job.status === "completed"
      ? 100
      : job.status === "queued"
        ? 0
        : null;
  return {
    id: job.id,
    jobType: job.type,
    status: job.status,
    startedAt: job.createdAt,
    finishedAt: job.status === "completed" || job.status === "failed" ? job.updatedAt : null,
    processedCount: payloadNumber(job.payload, "symbolCount", "count", "indexCount", "companiesSeen"),
    updatedCount: payloadNumber(job.payload, "refreshed", "backfilled", "companiesMatched", "count"),
    repairedCount: 0,
    failedCount: job.status === "failed" ? 1 : payloadNumber(job.payload, "failedCount"),
    progress,
    source: "provider",
    exchange: typeof job.payload.exchange === "string" ? job.payload.exchange : null,
    tradingDate: null,
    collectionId: typeof job.payload.collectionId === "string" ? job.payload.collectionId : null,
    scope: typeof job.payload.exchange === "string" ? job.payload.exchange : "Global",
  };
}

const STAT_TONES = {
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
} as const;

export function formatJobDateTime(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

function dateFilterValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function StatCard({ icon: Icon, label, value, sub, tone, title }: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone: keyof typeof STAT_TONES;
  title?: string;
}) {
  return (
    <div title={title} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", STAT_TONES[tone])}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="block truncate text-base font-semibold text-foreground">{value}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

export function JobStatusBadge({ status }: { status: AdminBackgroundJobRunStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent capitalize",
        status === "completed" && "bg-success/10 text-success",
        status === "partial" && "bg-warning/10 text-warning",
        (status === "failed" || status === "missed") && "bg-danger/10 text-danger",
        (status === "pending" || status === "queued" || status === "running") && "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

function JobRunRow({ run, index, onRetry, retrying }: { run: AdminJobDisplay; index: number; onRetry: (run: AdminJobDisplay) => void; retrying: boolean }) {
  const router = useRouter();
  const openDetails = () => router.push(`/admin/jobs/${run.id}`);
  const canRetry = (run.source === "provider" && !run.jobType.includes("backtest")) || Boolean(run.exchange && run.tradingDate);

  return (
    <TableRow
      tabIndex={0}
      className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openDetails();
      }}
    >
      <TableCell className="w-16 text-center tabular-nums text-muted-foreground">{index + 1}</TableCell>
      <TableCell className="font-medium text-foreground">{JOB_TYPE_LABEL[run.jobType] ?? run.jobType}</TableCell>
      <TableCell className="text-center text-muted-foreground">{run.scope}</TableCell>
      <TableCell className="text-center">{formatJobDateTime(run.startedAt)}</TableCell>
      <TableCell className="text-center">{formatJobDateTime(run.finishedAt)}</TableCell>
      <TableCell className="min-w-28 text-center">
        {run.progress === null ? (
          <span className="text-xs text-muted-foreground">Running</span>
        ) : (
          <div className="flex items-center gap-2">
            <Progress value={run.progress} className="min-w-16 flex-1" />
            <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{run.progress}%</span>
          </div>
        )}
      </TableCell>
      <TableCell className="text-center"><JobStatusBadge status={run.status} /></TableCell>
      <TableCell className="text-center">
        {canRetry && (run.status === "failed" || run.status === "missed" || run.status === "partial") && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Retry ${JOB_TYPE_LABEL[run.jobType] ?? run.jobType}`}
            disabled={retrying}
            onClick={(event) => {
              event.stopPropagation();
              onRetry(run);
            }}
          >
            <RotateCcw className={cn("size-4", retrying && "animate-spin")} />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AdminMarketDataPage() {
  const queryClient = useQueryClient();
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(() => dateFilterValue(new Date().toISOString()));
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const workersQuery = useAdminMarketDataWorkers();
  const healthQuery = useAdminMarketDataHealth();
  const jobRunsQuery = useAdminMarketDataJobRuns();
  const providerJobsQuery = useAdminJobs();
  const operationsQuery = useAdminMarketDataOperations();
  const collectionsQuery = useAdminMarketCollections();
  const providerSyncMutation = useSyncAdminDataProvider();
  const priceRefreshMutation = useSyncAdminMarketDataPrices();
  const sectorSyncMutation = useSyncAdminSectorClassification();
  const indexBackfillMutation = useBackfillAdminIndexCandles();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataWorkers });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataHealth });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataJobRuns });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.jobs });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.marketDataOperations });
  };

  const reconcileMutation = useMutation({ mutationFn: reconcileAdminMarketData, onSuccess: refresh });
  const catchUpMutation = useMutation({ mutationFn: catchUpAdminMarketData, onSuccess: refresh });
  const refreshCandlesMutation = useMutation({
    mutationFn: (targets: Array<{ exchange: string; tradingDate: string }>) =>
      Promise.all(targets.map((target) => catchUpAdminMarketData(target))),
    onSuccess: refresh,
  });
  const refreshBacktestsMutation = useMutation({
    mutationFn: (targets: Array<{ exchange: string; tradingDate: string }>) =>
      Promise.all(targets.map((target) => refreshAdminMarketDataBacktests(target))),
    onSuccess: refresh,
  });

  useAdminMarketDataStream({
    onEvent: (event: AdminMarketDataEvent) => {
      if (event.type === "market-data:job-progress") {
        queryClient.setQueryData<JobRunsCache>(queryKeys.admin.marketDataJobRuns, (current) => applyJobProgress(current, event.data));
        return;
      }
      refresh();
    },
    onReconnected: refresh,
  });

  const worker = workersQuery.data?.workers[0] ?? null;
  const health = healthQuery.data ?? null;
  const collectionNames = new Map((collectionsQuery.data?.collections ?? []).map((collection) => [collection.id, collection.name]));
  const runs: AdminJobDisplay[] = [
    ...(jobRunsQuery.data?.runs ?? [])
      .filter((run) => run.jobType !== "chart_ensure_fresh")
      .map((run) => ({
        ...run,
        progress: run.status === "completed" ? 100 : run.status === "running" && (run.totalExpected ?? 0) > 0
          ? Math.round((run.processedCount / (run.totalExpected ?? 1)) * 100)
          : run.status === "pending" || run.status === "queued" ? 0 : null,
        source: "run" as const,
        exchange: run.exchange ?? null,
        tradingDate: run.tradingDate ?? null,
        collectionId: null,
        scope: run.exchange ?? "System",
      })),
    ...(providerJobsQuery.data?.jobs ?? [])
      .filter((job) => PROVIDER_ACTION_TYPES.has(job.type))
      .map((job) => {
        const display = toProviderJobDisplay(job);
        return display.collectionId
          ? { ...display, scope: collectionNames.get(display.collectionId) ?? "Unknown segment" }
          : display;
      }),
  ].sort((left, right) => new Date(right.startedAt ?? 0).getTime() - new Date(left.startedAt ?? 0).getTime());
  const operations = operationsQuery.data;
  const expectedDate = operations?.expectedCompletedTradingDate ?? null;
  const expectedCoverage = operations?.coverage.filter((item) => item.tradingDate === expectedDate) ?? [];
  const candleTargets = expectedCoverage
    .filter((item) => item.missing > 0)
    .map((item) => ({ exchange: item.exchange, tradingDate: item.tradingDate }));
  const candlesLoaded = expectedCoverage.length > 0 && candleTargets.length === 0;
  const backtestTargets = expectedCoverage.map((item) => ({ exchange: item.exchange, tradingDate: item.tradingDate }));
  const backtestsStale = expectedDate !== null && (operations?.backtestsThrough ?? "") < expectedDate;
  const candleButtonTitle = !expectedDate
    ? "Waiting for market-data status"
    : candlesLoaded
      ? `Daily candles for ${formatDate(expectedDate)} are already loaded`
      : `Fetch the missing ${formatDate(expectedDate)} daily candles (${candleTargets.map((item) => item.exchange).join(", ")}) from GlobalDataFeeds`;
  const backtestButtonTitle = !expectedDate
    ? "Waiting for market-data status"
    : !candlesLoaded
      ? `Load the ${formatDate(expectedDate)} daily candles first - backtests only refresh on complete data`
      : !backtestsStale
        ? `Backtests already run through ${formatDate(expectedDate)}`
        : `Refresh Weekly Strong backtests for every segment (${backtestTargets.map((item) => item.exchange).join(", ")}) through ${formatDate(expectedDate)}`;
  const lastFailedRun = runs.find((run) => run.failedCount > 0);
  const missingCount = operations?.coverage.reduce((total, item) => total + item.missing, 0) ?? 0;
  const noHistoryCount = expectedCoverage.reduce((total, item) => total + (item.exempt ?? 0), 0);
  const withDataCount = expectedCoverage.reduce((total, item) => total + item.completed, 0);
  const coverageTitle = expectedDate
    ? `${formatDate(expectedDate)} - With data: ${withDataCount} | No history: ${noHistoryCount} | Missing / failed: ${expectedCoverage.reduce((total, item) => total + item.missing, 0)}. No history: GlobalDataFeeds returned a successful empty historical response.`
    : undefined;
  const attentionCount = missingCount || lastFailedRun?.failedCount || 0;
  const jobTypeOptions = [
    { value: "all", label: "All job types" },
    ...[...new Set(runs.map((run) => run.jobType))]
      .sort((left, right) => (JOB_TYPE_LABEL[left] ?? left).localeCompare(JOB_TYPE_LABEL[right] ?? right))
      .map((jobType) => ({ value: jobType, label: JOB_TYPE_LABEL[jobType] ?? jobType })),
  ];
  const filteredRuns = runs.filter((run) =>
    (jobTypeFilter === "all" || run.jobType === jobTypeFilter)
    && (!dateFilter || dateFilterValue(run.startedAt) === dateFilter)
  );
  const retryJob = (run: AdminJobDisplay) => {
    setRetryingJobId(run.id);
    const options = { onSettled: () => setRetryingJobId(null) };
    if (run.source === "run") {
      if (run.exchange && run.tradingDate) {
        catchUpMutation.mutate({ exchange: run.exchange, tradingDate: run.tradingDate }, options);
      } else {
        setRetryingJobId(null);
      }
      return;
    }
    const exchange = run.exchange ?? "BSE";
    if (run.jobType === "market-data.instrument-sync") providerSyncMutation.mutate({ exchange }, options);
    else if (run.jobType === "market-data.price-refresh") priceRefreshMutation.mutate({ exchange }, options);
    else if (run.jobType === "market-data.sector-classification-sync") sectorSyncMutation.mutate(undefined, options);
    else if (run.jobType === "market-data.index-candle-backfill") indexBackfillMutation.mutate({ exchange }, options);
    else setRetryingJobId(null);
  };

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Market Data Jobs</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter jobs by date"
            className="h-9 w-38"
          />
          <Select
            value={jobTypeFilter}
            options={jobTypeOptions}
            onValueChange={setJobTypeFilter}
            className="w-48"
            triggerClassName="h-9"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={candleTargets.length === 0 || refreshCandlesMutation.isPending}
            title={candleButtonTitle}
            onClick={() => refreshCandlesMutation.mutate(candleTargets)}
          >
            <Database className={cn("size-4", refreshCandlesMutation.isPending && "animate-pulse")} />
            {candlesLoaded ? "Candles loaded" : "Refresh candles"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!candlesLoaded || !backtestsStale || refreshBacktestsMutation.isPending}
            title={backtestButtonTitle}
            onClick={() => refreshBacktestsMutation.mutate(backtestTargets)}
          >
            <RotateCcw className={cn("size-4", refreshBacktestsMutation.isPending && "animate-spin")} />
            {candlesLoaded && !backtestsStale ? "Backtests current" : "Refresh backtests"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={reconcileMutation.isPending} onClick={() => reconcileMutation.mutate()}>
            <RefreshCw className={cn("size-4", reconcileMutation.isPending && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Worker"
          value={worker ? (worker.status === "online" ? "Online" : "Offline") : "-"}
          sub={worker?.lastHeartbeat ? formatJobDateTime(worker.lastHeartbeat) : undefined}
          tone={worker?.status === "online" ? "green" : "rose"}
        />
        <StatCard
          icon={Database}
          label="Fresh symbols"
          value={health ? `${health.fresh} / ${health.activeSymbols}` : "-"}
          sub={health?.latestExpectedTradingDate ? `Through ${formatDate(health.latestExpectedTradingDate)}` : undefined}
          tone="cyan"
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs attention"
          value={String(attentionCount)}
          sub={
            missingCount > 0
              ? `Missing candles${noHistoryCount > 0 ? ` · ${noHistoryCount} no history` : ""}`
              : noHistoryCount > 0
                ? `${noHistoryCount} no history (exempt)`
                : "Latest run failures"
          }
          title={coverageTitle}
          tone={attentionCount > 0 ? "rose" : "green"}
        />
        <StatCard
          icon={Clock3}
          label="Last success"
          value={health?.lastSuccessfulRefresh ? formatJobDateTime(health.lastSuccessfulRefresh) : "-"}
          tone="amber"
        />
      </div>

      <section className="min-h-[60vh]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Job runs</h2>
        </div>
        {jobRunsQuery.isLoading || providerJobsQuery.isLoading ? (
          <div className="grid min-h-40 place-items-center"><Spinner size="lg" className="text-primary" /></div>
        ) : jobRunsQuery.isError ? (
          <p className="text-sm text-danger">Couldn&apos;t load job runs.</p>
        ) : filteredRuns.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No jobs match these filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table className="[&_td+td]:border-l [&_th+th]:border-l [&_td+td]:border-border [&_th+th]:border-border">
              <TableHeader>
                <TableRow className="bg-[var(--admin-table-header)] hover:bg-[var(--admin-table-header)]">
                  <TableHead className="w-16 text-center">Sr. No.</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead className="text-center">Scope</TableHead>
                  <TableHead className="text-center">Started</TableHead>
                  <TableHead className="text-center">Finished</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-16 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{filteredRuns.map((run, index) => <JobRunRow key={run.id} run={run} index={index} onRetry={retryJob} retrying={retryingJobId === run.id} />)}</TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
