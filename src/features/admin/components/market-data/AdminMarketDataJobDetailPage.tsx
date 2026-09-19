"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";
import { useAdminJobs, useAdminMarketDataJobRuns } from "../../hooks/use-admin-market-data";
import { formatJobDateTime, JOB_TYPE_LABEL, JobStatusBadge, toProviderJobDisplay } from "./AdminMarketDataPage";

function DetailItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function JobMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <div className="flex min-h-20 flex-col justify-center bg-card px-4 py-3 text-center">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums text-foreground",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function AdminMarketDataJobDetailPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const runsQuery = useAdminMarketDataJobRuns();
  const providerJobsQuery = useAdminJobs();
  const backgroundRun = runsQuery.data?.runs.find((item) => item.id === jobId);
  const providerJob = providerJobsQuery.data?.jobs.find((item) => item.id === jobId);
  const run = backgroundRun ?? (providerJob ? toProviderJobDisplay(providerJob) : undefined);

  if (runsQuery.isLoading || providerJobsQuery.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center"><Spinner size="lg" className="text-primary" /></div>;
  }

  if (runsQuery.isError || !run) {
    return (
      <div className="space-y-4">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/admin/jobs")}><ArrowLeft className="size-4" /> Back</Button>
        <p className="text-sm text-danger">This job run could not be found.</p>
      </div>
    );
  }

  const failedSymbols = backgroundRun?.metadata.failedSymbols ?? [];
  const errorSummary = backgroundRun?.errorSummary ?? providerJob?.errorMessage ?? null;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <div>
        <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-2" onClick={() => router.push("/admin/jobs")}>
          <ArrowLeft className="size-4" /> Jobs
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{JOB_TYPE_LABEL[run.jobType] ?? run.jobType}</h1>
          <JobStatusBadge status={run.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{run.id}</p>
      </div>

      <div className="grid gap-x-8 rounded-lg border border-border bg-card px-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Started" value={formatJobDateTime(run.startedAt)} />
        <DetailItem label="Finished" value={formatJobDateTime(run.finishedAt)} />
        <DetailItem label="Created" value={formatJobDateTime(backgroundRun?.createdAt ?? providerJob?.createdAt ?? null)} />
        <DetailItem label="Trading date" value={backgroundRun?.tradingDate ?? "-"} />
        <DetailItem label="Exchange" value={backgroundRun?.exchange ?? (typeof providerJob?.payload.exchange === "string" ? providerJob.payload.exchange : "-")} />
        <DetailItem label="Attempts" value={backgroundRun?.attemptCount ?? "-"} />
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        <JobMetric label="Processed" value={run.processedCount} />
        <JobMetric label="Updated" value={run.updatedCount} tone="success" />
        <JobMetric label="Repaired" value={run.repairedCount} />
        <JobMetric label="Already current" value={backgroundRun?.alreadyCurrentCount ?? 0} />
        <JobMetric label="Bootstrap" value={backgroundRun?.bootstrapRequiredCount ?? 0} />
        <JobMetric label="Failed" value={run.failedCount} tone={run.failedCount > 0 ? "danger" : "default"} />
      </div>

      {errorSummary && (
        <section className="rounded-lg border border-danger/30 bg-danger/10 p-4">
          <h2 className="text-sm font-semibold text-danger">Error summary</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-danger">{errorSummary}</p>
        </section>
      )}

      {failedSymbols.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Failed symbols ({failedSymbols.length})</h2>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {failedSymbols.map((entry, index) => (
              <div key={`${entry.symbol}-${index}`} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
                <span className="font-mono text-sm font-semibold text-foreground">{entry.symbol}</span>
                <span className="text-sm text-muted-foreground">{entry.reason}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
