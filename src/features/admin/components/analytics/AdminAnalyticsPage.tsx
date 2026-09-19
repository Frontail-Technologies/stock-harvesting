"use client";

import { useState, type ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";
import { useAdminAnalytics } from "../../hooks/use-admin-analytics";
import type { AdminAnalyticsPeriod } from "../../types";

const COLORS = ["#f5b800", "#10b981", "#0891b2", "#8b5cf6", "#f43f5e"];
const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];
const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--popover-foreground)",
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.2)",
};

function dayLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
    new Date(`${value}T00:00:00`)
  );
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="flex min-h-28 items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className={cn("grid size-11 shrink-0 place-items-center rounded-lg", tone)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-normal text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  metric,
  className,
  children,
}: {
  title: string;
  metric?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-lg border border-border bg-card p-4", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {metric ? <span className="text-xs font-medium text-muted-foreground">{metric}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>("all");
  const analyticsQuery = useAdminAnalytics(period);
  const data = analyticsQuery.data;
  const periodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "All time";

  if (!data && analyticsQuery.isPending) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div>
          <p className="font-medium text-foreground">Analytics could not be loaded</p>
          <Button className="mt-3" variant="outline" onClick={() => void analyticsQuery.refetch()}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const verifiedRate = data.summary.totalUsers
    ? Math.round((data.summary.verifiedUsers / data.summary.totalUsers) * 100)
    : 0;
  const totalJobOutcomes = data.jobs.reduce(
    (sum, item) => sum + item.successful + item.failed,
    0
  );

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-5 overflow-x-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            options={PERIOD_OPTIONS}
            onValueChange={(value) => setPeriod(value as AdminAnalyticsPeriod)}
            className="w-36"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={analyticsQuery.isFetching}
            onClick={() => void analyticsQuery.refetch()}
          >
            <RefreshCw className={cn("size-4", analyticsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total users"
          value={data.summary.totalUsers.toLocaleString("en-IN")}
          detail={period === "all" ? "All registered users" : `+${data.summary.newUsers30d.toLocaleString("en-IN")} in period`}
          icon={<Users className="size-5" />}
          tone="bg-cyan-500/12 text-cyan-600 dark:text-cyan-400"
        />
        <KpiCard
          label="Verified users"
          value={`${verifiedRate}%`}
          detail={`${data.summary.verifiedUsers.toLocaleString("en-IN")} verified`}
          icon={<ShieldCheck className="size-5" />}
          tone="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Market coverage"
          value={data.summary.totalMembers.toLocaleString("en-IN")}
          detail={`${data.summary.activeSegments} active segments`}
          icon={<Database className="size-5" />}
          tone="bg-violet-500/12 text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          label="Job success"
          value={`${data.summary.jobSuccessRate}%`}
          detail={`${data.summary.activeJobs} jobs active now`}
          icon={<Activity className="size-5" />}
          tone="bg-amber-500/15 text-amber-700 dark:text-amber-400"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <ChartCard title="New users" metric={`${data.summary.newUsers30d} registrations`}>
          <div className="h-72 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.userGrowth} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5b800" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f5b800" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} minTickGap={28} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--muted-foreground)", marginBottom: 6 }}
                  labelFormatter={(value) => dayLabel(String(value))}
                  formatter={(value) => [Number(value), "Users"]}
                />
                <Area type="monotone" dataKey="users" stroke="#f5b800" strokeWidth={2.5} fill="url(#userGrowthFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Plan mix" metric={`${data.summary.totalUsers} users`}>
          <div className="grid min-h-72 grid-cols-[minmax(0,1fr)_120px] items-center gap-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.plans} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                  {data.plans.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  cursor={false}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  formatter={(value, name) => [Number(value), titleCase(String(name))]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {data.plans.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate">{titleCase(item.name)}</span>
                  </span>
                  <strong className="text-foreground">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        <ChartCard title="Job reliability" metric={`${totalJobOutcomes} outcomes for ${periodLabel}`}>
          <div className="h-64 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.jobs} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="day" tickFormatter={dayLabel} tickLine={false} axisLine={false} minTickGap={20} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "var(--muted-foreground)", marginBottom: 6 }}
                  labelFormatter={(value) => dayLabel(String(value))}
                />
                <Bar dataKey="successful" name="Successful" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Segment readiness" metric={`${data.summary.activeSegments} active`}>
          <div className="space-y-4 pt-2">
            {data.segmentReadiness.map((item, index) => {
              const total = data.segmentReadiness.reduce((sum, entry) => sum + entry.value, 0);
              const percentage = total ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="size-4" style={{ color: COLORS[index % COLORS.length] }} />
                      {titleCase(item.name)}
                    </span>
                    <strong className="text-foreground">{item.value}</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
