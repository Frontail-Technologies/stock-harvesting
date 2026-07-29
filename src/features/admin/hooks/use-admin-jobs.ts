"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getAdminJobs } from "../api/admin-api";
import type { AdminSyncJob } from "../types";

const POLL_INTERVAL_MS = 5_000;

function hasActiveJob(jobs: AdminSyncJob[]) {
  return jobs.some((job) => job.status === "queued" || job.status === "running");
}

export function useAdminJobs() {
  const status = useSessionStore((state) => state.status);
  const user = useSessionStore((state) => state.user);

  const query = useQuery({
    queryKey: queryKeys.admin.jobs,
    queryFn: getAdminJobs,
    enabled: status === "authenticated" && user?.role === "admin",
    // Instrument syncs/price refreshes run synchronously when no job queue
    // is configured (the common case here), so most jobs flip to
    // completed/failed almost immediately — but poll while anything is
    // still queued/running in case a queue worker is handling it instead.
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? [];
      return hasActiveJob(jobs) ? POLL_INTERVAL_MS : false;
    },
  });

  return { ...query, jobs: query.data?.jobs ?? [] };
}
