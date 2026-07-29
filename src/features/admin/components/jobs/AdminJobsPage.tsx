"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_MARKET_EXCHANGE, useMarketExchanges } from "@/features/market";
import { useSyncAdminDataProvider, useSyncAdminMarketDataPrices } from "../../hooks/use-admin-data-provider";
import { useAdminJobs } from "../../hooks/use-admin-jobs";
import type { AdminSyncJobStatus } from "../../types";
import { AdminSelect } from "../users/AdminSelect";

const JOB_TYPE_LABELS: Record<string, string> = {
  "market-data.instrument-sync": "Instrument Sync",
  "market-data.price-refresh": "Price Refresh",
};

function formatJobType(type: string) {
  return JOB_TYPE_LABELS[type] ?? type;
}

function formatPayload(payload: Record<string, unknown>) {
  const entries = Object.entries(payload);
  if (entries.length === 0) return "-";
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ");
}

function JobStatusBadge({ status }: { status: AdminSyncJobStatus }) {
  const toneClass =
    status === "completed"
      ? "border-success/30 bg-success/10 text-success"
      : status === "failed"
        ? "border-danger/30 bg-danger/10 text-danger"
        : status === "running"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground";

  return (
    <Badge variant="outline" className={`gap-1 ${toneClass}`}>
      {status === "running" ? <Loader2 className="size-3 animate-spin" /> : null}
      {status}
    </Badge>
  );
}

export function AdminJobsPage() {
  const jobsQuery = useAdminJobs();
  const syncMutation = useSyncAdminDataProvider();
  const priceRefreshMutation = useSyncAdminMarketDataPrices();
  const { exchanges } = useMarketExchanges();
  const [exchange, setExchange] = useState(DEFAULT_MARKET_EXCHANGE);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Trigger and track instrument sync and price refresh jobs for any exchange.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminSelect
            label="Exchange"
            value={exchange}
            onChange={setExchange}
            options={exchanges.map((item) => ({
              value: item.code,
              label: `${item.name} (${item.code})`,
            }))}
            compact
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate({ exchange })}
          >
            {syncMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Sync {exchange} instruments
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={priceRefreshMutation.isPending}
            onClick={() => priceRefreshMutation.mutate({ exchange })}
          >
            {priceRefreshMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Sync all {exchange} prices
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Refresh jobs"
            disabled={jobsQuery.isFetching}
            onClick={() => void jobsQuery.refetch()}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="border-r border-border px-4 text-xs font-semibold">
                Type
              </TableHead>
              <TableHead className="w-32 border-r border-border px-4 text-xs font-semibold">
                Status
              </TableHead>
              <TableHead className="min-w-64 border-r border-border px-4 text-xs font-semibold">
                Details
              </TableHead>
              <TableHead className="w-44 border-r border-border px-4 text-xs font-semibold">
                Created
              </TableHead>
              <TableHead className="w-44 px-4 text-xs font-semibold">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobsQuery.jobs.map((job) => (
              <TableRow key={job.id} className="hover:bg-muted/30">
                <TableCell className="border-r border-border px-4 font-medium text-foreground">
                  {formatJobType(job.type)}
                </TableCell>
                <TableCell className="border-r border-border px-4">
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="border-r border-border px-4 text-xs text-muted-foreground">
                  {job.status === "failed" && job.errorMessage ? (
                    <span className="text-danger">{job.errorMessage}</span>
                  ) : (
                    formatPayload(job.payload)
                  )}
                </TableCell>
                <TableCell className="border-r border-border px-4 text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="px-4 text-xs text-muted-foreground">
                  {new Date(job.updatedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}

            {jobsQuery.jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {jobsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading jobs...
                    </span>
                  ) : jobsQuery.isError ? (
                    "Unable to load jobs."
                  ) : (
                    "No jobs yet. Trigger a sync above to see it here."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
