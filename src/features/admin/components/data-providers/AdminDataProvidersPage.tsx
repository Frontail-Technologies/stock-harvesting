"use client";

import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  Radio,
  RefreshCw,
  Settings2,
  XCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminDataProviderHealthResult,
  AdminDataProviderSettingsRow,
  AdminDataProviderStatusEntry,
} from "../../types";
import {
  useAdminDataProviderHealth,
  useAdminDataProviderStatuses,
  useBackfillAdminIndexCandles,
  useSyncAdminDataProvider,
  useSyncAdminMarketDataPrices,
  useSyncAdminSectorClassification,
} from "../../hooks/use-admin-data-provider";
import {
  useAdminDataProviders,
  useUpdateAdminDataProviderSettings,
} from "../../hooks/use-admin-data-providers";
import { useAdminJobs } from "../../hooks/use-admin-market-data";

function formatRelativeTime(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function AdminDataProvidersPage() {
  const settingsQuery = useAdminDataProviders();
  const jobsQuery = useAdminJobs();
  const providers = settingsQuery.data?.providers ?? [];
  const enabledProviders = providers.filter((provider) => provider.enabled);
  const globalDatafeedsSettings = providers.find((provider) => provider.key === "global-datafeeds");

  const sectorClassificationMutation = useSyncAdminSectorClassification();

  const bseSyncMutation = useSyncAdminDataProvider();
  const bseIndexSyncMutation = useSyncAdminDataProvider();
  const bsePriceRefreshMutation = useSyncAdminMarketDataPrices();
  const bseIndexBackfillMutation = useBackfillAdminIndexCandles();

  const statusesQuery = useAdminDataProviderStatuses();
  const globalDatafeedsHealthQuery = useAdminDataProviderHealth("global-datafeeds");
  const activeJobTypes = new Set(
    (jobsQuery.data?.jobs ?? [])
      .filter((job) => job.status === "queued" || job.status === "running")
      .map((job) => job.type)
  );

  const handleSectorClassificationSync = () => sectorClassificationMutation.mutate();
  const handleBseSync = () => bseSyncMutation.mutate({ exchange: "BSE" });
  const handleBseIndexSync = () => bseIndexSyncMutation.mutate({ exchange: "BSE_IDX" });
  const handleBsePriceRefresh = () => bsePriceRefreshMutation.mutate({ exchange: "BSE" });
  const handleBseIndexBackfill = () => bseIndexBackfillMutation.mutate({ exchange: "BSE_IDX" });
  const handleConnectionCheck = () => {
    void Promise.all([globalDatafeedsHealthQuery.refetch(), statusesQuery.refetch()]);
  };

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <h1 className="text-2xl font-semibold text-foreground">Data Providers</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ProviderStat icon={Zap} label="Enabled" value={`${enabledProviders.length} / ${providers.length}`} tone="amber" />
        <ProviderStat
          icon={Activity}
          label="Production Feed"
          value={globalDatafeedsHealthQuery.isFetching ? "Checking" : globalDatafeedsHealthQuery.data?.connected ? "Connected" : "Unavailable"}
          tone={globalDatafeedsHealthQuery.isFetching ? "amber" : globalDatafeedsHealthQuery.data?.connected ? "green" : "rose"}
        />
        <ProviderStat
          icon={Database}
          label="Configured"
          value={String(enabledProviders.filter((provider) => provider.configured).length)}
          tone="violet"
        />
        <ProviderStat
          icon={Clock3}
          label="Last Success"
          value={formatRelativeTime(globalDatafeedsSettings?.lastSuccessAt ?? null)}
          tone="cyan"
        />
      </div>

      {settingsQuery.isLoading ? (
        <div className="grid min-h-72 place-items-center"><Spinner size="lg" className="text-primary" /></div>
      ) : settingsQuery.isError ? (
        <p className="text-sm text-danger">Couldn&apos;t load data providers.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--admin-table-header)] hover:bg-[var(--admin-table-header)]">
                <TableHead>Provider</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last success</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <ProviderRow
                  key={provider.key}
                  provider={provider}
                  status={statusesQuery.data?.providers.find((entry) => entry.provider === provider.key)}
                  health={provider.key === "global-datafeeds" ? globalDatafeedsHealthQuery.data : undefined}
                  healthLoading={provider.key === "global-datafeeds" && globalDatafeedsHealthQuery.isFetching}
                  healthError={provider.key === "global-datafeeds" && globalDatafeedsHealthQuery.isError}
                  onCheckConnection={handleConnectionCheck}
                  onSyncBse={handleBseSync}
                  onSyncBsePrices={handleBsePriceRefresh}
                  onSyncBseIndices={handleBseIndexSync}
                  onBackfillIndices={handleBseIndexBackfill}
                  onSyncSectors={handleSectorClassificationSync}
                  actionsPending={
                    bseSyncMutation.isPending ||
                    bsePriceRefreshMutation.isPending ||
                    bseIndexSyncMutation.isPending ||
                    bseIndexBackfillMutation.isPending ||
                    sectorClassificationMutation.isPending
                  }
                  activeJobTypes={activeJobTypes}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

    </div>
  );
}

function ProviderRow({
  provider,
  status,
  health,
  healthLoading,
  healthError,
  onCheckConnection,
  onSyncBse,
  onSyncBsePrices,
  onSyncBseIndices,
  onBackfillIndices,
  onSyncSectors,
  actionsPending,
  activeJobTypes,
}: {
  provider: AdminDataProviderSettingsRow;
  status?: AdminDataProviderStatusEntry;
  health?: AdminDataProviderHealthResult;
  healthLoading: boolean;
  healthError: boolean;
  onCheckConnection: () => void;
  onSyncBse: () => void;
  onSyncBsePrices: () => void;
  onSyncBseIndices: () => void;
  onBackfillIndices: () => void;
  onSyncSectors: () => void;
  actionsPending: boolean;
  activeJobTypes: Set<string>;
}) {
  const updateSettings = useUpdateAdminDataProviderSettings();
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [priorityDraft, setPriorityDraft] = useState(String(provider.priority));
  const [editingPriority, setEditingPriority] = useState(false);

  const handleToggle = (nextEnabled: boolean) => {
    if (!nextEnabled) {
      setConfirmingDisable(true);
      return;
    }
    updateSettings.mutate({ key: provider.key, enabled: true });
  };

  const confirmDisable = () => {
    updateSettings.mutate(
      { key: provider.key, enabled: false },
      { onSuccess: () => setConfirmingDisable(false) }
    );
  };

  const commitPriority = () => {
    const parsed = Number(priorityDraft);
    if (!Number.isFinite(parsed) || parsed === provider.priority) {
      setPriorityDraft(String(provider.priority));
      setEditingPriority(false);
      return;
    }
    updateSettings.mutate({ key: provider.key, priority: Math.round(parsed) });
    setEditingPriority(false);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-semibold text-foreground">{provider.displayName}</div>
          {provider.disabledReason && (
            <div className="mt-1 text-xs text-muted-foreground">
              Reason: {provider.disabledReason}
            </div>
          )}
          {(health?.errorMessage ?? (!health && provider.health === "error" ? provider.lastError : null)) && (
            <div className="mt-1 max-w-xs truncate text-xs text-danger" title={health?.errorMessage ?? provider.lastError ?? undefined}>
              {health?.errorMessage ?? provider.lastError}
            </div>
          )}
        </TableCell>
        <TableCell>
          <Switch
            checked={provider.enabled}
            disabled={updateSettings.isPending}
            onCheckedChange={handleToggle}
          />
        </TableCell>
        <TableCell>
          {editingPriority ? (
            <Input
              autoFocus
              value={priorityDraft}
              onChange={(event) => setPriorityDraft(event.target.value)}
              onBlur={commitPriority}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setPriorityDraft(String(provider.priority));
                  setEditingPriority(false);
                }
              }}
              inputMode="numeric"
              className="h-8 w-16 text-center text-sm"
            />
          ) : (
            <button
              type="button"
              className="h-8 min-w-10 rounded-md px-2 text-sm tabular-nums text-foreground hover:bg-muted"
              onClick={() => setEditingPriority(true)}
              aria-label={`Edit priority for ${provider.displayName}`}
            >
              {provider.priority}
            </button>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={
              provider.configured
                ? "border-success/35 bg-success/12 text-success"
                : "border-border bg-muted text-muted-foreground"
            }
          >
            {provider.configured ? "Configured" : "Missing"}
          </Badge>
        </TableCell>
        <TableCell>
          {provider.enabled ? (
            <ConnectionBadge
              loading={healthLoading}
              connected={health?.connected ?? status?.connected ?? false}
              status={health?.status ?? (status?.connected ? "connected" : "disconnected")}
              isError={healthError}
            />
          ) : <span className="text-sm text-muted-foreground">-</span>}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatRelativeTime(provider.lastSuccessAt)}
        </TableCell>
        <TableCell className="text-right">
          {provider.enabled && provider.key === "global-datafeeds" ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${provider.displayName}`}>
                    {actionsPending ? <Loader2 className="size-4 animate-spin" /> : <Settings2 className="size-4" />}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Provider actions</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <ProviderActionItem label="Check connection" onClick={onCheckConnection} disabled={healthLoading} />
                <DropdownMenuSeparator />
                <ProviderActionItem label="Sync BSE instruments" onClick={onSyncBse} disabled={actionsPending || !status?.connected || activeJobTypes.has("market-data.instrument-sync")} />
                <ProviderActionItem label="Sync BSE prices" onClick={onSyncBsePrices} disabled={actionsPending || !status?.connected || activeJobTypes.has("market-data.price-refresh")} />
                <ProviderActionItem label="Sync BSE indices" onClick={onSyncBseIndices} disabled={actionsPending || !status?.connected || activeJobTypes.has("market-data.instrument-sync")} />
                <ProviderActionItem label="Backfill index history" onClick={onBackfillIndices} disabled={actionsPending || !status?.connected || activeJobTypes.has("market-data.index-candle-backfill")} />
                <DropdownMenuSeparator />
                <ProviderActionItem label="Sync sector data" onClick={onSyncSectors} disabled={actionsPending || activeJobTypes.has("market-data.sector-classification-sync")} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </TableCell>
      </TableRow>

      <Dialog open={confirmingDisable} onOpenChange={setConfirmingDisable}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-muted-foreground" />
              <DialogTitle>Disable {provider.displayName}?</DialogTitle>
            </div>
            <DialogDescription>
              New market-data requests will stop using this provider. Eligible fallback
              providers will be used where available.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingDisable(false)}
              disabled={updateSettings.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDisable}
              disabled={updateSettings.isPending}
              className="gap-1.5"
            >
              {updateSettings.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Disable provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConnectionBadge({
  loading,
  connected,
  status,
  isError = false,
}: {
  loading: boolean;
  connected: boolean;
  status?: string;
  isError?: boolean;
}) {
  if (loading) {
    return (
      <Badge variant="outline" className="bg-card text-xs">
        Checking
      </Badge>
    );
  }

  if (isError) {
    return (
      <Badge variant="outline" className="border-border bg-card text-xs text-foreground">
        Unknown
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={
        connected
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      }
    >
      {connected ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
      {status ?? "disconnected"}
    </Badge>
  );
}

function ProviderActionItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <DropdownMenuItem disabled={disabled} onClick={onClick} className="gap-2">
      <RefreshCw className="size-3.5" />
      {label}
    </DropdownMenuItem>
  );
}

const PROVIDER_STAT_TONES = {
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
} as const;

function ProviderStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: keyof typeof PROVIDER_STAT_TONES;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", PROVIDER_STAT_TONES[tone])}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="block truncate text-base font-semibold text-foreground">{value}</span>
      </span>
    </div>
  );
}
