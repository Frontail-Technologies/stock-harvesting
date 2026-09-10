"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  Radio,
  RefreshCw,
  XCircle,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminDataProviderHealth,
  AdminDataProviderHealthResult,
  AdminDataProviderSettingsRow,
  AdminDataProviderStatusEntry,
} from "../../types";
import {
  useAdminDataProviderHealth,
  useAdminDataProviderStatus,
  useAdminDataProviderStatuses,
  useBackfillAdminIndexCandles,
  useCreateAdminDataProviderConnectUrl,
  useSyncAdminDataProvider,
  useSyncAdminMarketDataPrices,
  useSyncAdminSectorClassification,
} from "../../hooks/use-admin-data-provider";
import {
  useAdminDataProviders,
  useUpdateAdminDataProviderSettings,
} from "../../hooks/use-admin-data-providers";

const CAPABILITY_LABELS: Record<string, string> = {
  instrument_sync: "Instruments",
  historical_daily_candles: "Historical candles",
  latest_daily_candles: "Latest candles",
  instrument_search: "Search",
  instrument_token: "Symbol lookup",
  exchange_list: "Exchange list",
  realtime_ws: "Realtime",
};

function healthBadgeClassName(health: AdminDataProviderHealth) {
  if (health === "healthy") return "border-primary/30 bg-primary/10 text-primary";
  if (health === "error") return "border-danger/30 bg-danger/10 text-danger";
  if (health === "unknown") return "border-border bg-card text-foreground";
  return "border-border bg-muted text-muted-foreground";
}

function healthLabel(health: AdminDataProviderHealth) {
  if (health === "healthy") return "Healthy";
  if (health === "error") return "Error";
  if (health === "unknown") return "Unknown";
  return "Disabled";
}

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
  const providers = settingsQuery.data?.providers ?? [];

  const zerodhaConnectionQuery = useAdminDataProviderStatus();
  const connectUrlMutation = useCreateAdminDataProviderConnectUrl();
  const syncMutation = useSyncAdminDataProvider();
  const priceRefreshMutation = useSyncAdminMarketDataPrices();
  const sectorClassificationMutation = useSyncAdminSectorClassification();

  const indexSyncMutation = useSyncAdminDataProvider();
  const indexBackfillMutation = useBackfillAdminIndexCandles();

  const bseSyncMutation = useSyncAdminDataProvider();
  const bseIndexSyncMutation = useSyncAdminDataProvider();
  const bsePriceRefreshMutation = useSyncAdminMarketDataPrices();
  const bseIndexBackfillMutation = useBackfillAdminIndexCandles();

  const statusesQuery = useAdminDataProviderStatuses();
  const eodhdStatus = statusesQuery.data?.providers.find((entry) => entry.provider === "eodhd");
  const globalDatafeedsStatus = statusesQuery.data?.providers.find(
    (entry) => entry.provider === "global-datafeeds"
  );
  const globalDatafeedsHealthQuery = useAdminDataProviderHealth("global-datafeeds");

  const zerodhaConnection = zerodhaConnectionQuery.data;
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/admin/data-provider/callback";
    return `${window.location.origin}/admin/data-provider/callback`;
  }, []);

  const handleConnect = () => {
    connectUrlMutation.mutate(undefined, {
      onSuccess: ({ url }) => {
        window.location.href = url;
      },
    });
  };

  const handleSync = () => syncMutation.mutate({ exchange: "NSE" });
  const handlePriceRefresh = () => priceRefreshMutation.mutate({ exchange: "NSE" });
  const handleSectorClassificationSync = () => sectorClassificationMutation.mutate();
  const handleIndexSync = () => indexSyncMutation.mutate({ exchange: "NSE_IDX" });
  const handleIndexBackfill = () => indexBackfillMutation.mutate({ exchange: "NSE_IDX" });
  const handleBseSync = () => bseSyncMutation.mutate({ exchange: "BSE" });
  const handleBseIndexSync = () => bseIndexSyncMutation.mutate({ exchange: "BSE_IDX" });
  const handleBsePriceRefresh = () => bsePriceRefreshMutation.mutate({ exchange: "BSE" });
  const handleBseIndexBackfill = () => bseIndexBackfillMutation.mutate({ exchange: "BSE_IDX" });

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <div>
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Market Data
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Data Providers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control which market-data providers Stock Harvesting can use, and manage each
          provider&apos;s connection.
        </p>
      </div>

      {settingsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : settingsQuery.isError ? (
        <p className="text-sm text-danger">Couldn&apos;t load data providers.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Provider</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Last success</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <ProviderRow key={provider.key} provider={provider} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Zerodha Kite</h2>
                <ConnectionBadge
                  loading={zerodhaConnectionQuery.isLoading}
                  connected={zerodhaConnection?.connected ?? false}
                  status={zerodhaConnection?.status}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                NSE market data uses this connection. Provider tokens are stored encrypted on
                the backend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={zerodhaConnectionQuery.isFetching}
              onClick={() => void zerodhaConnectionQuery.refetch()}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!zerodhaConnection?.connected || syncMutation.isPending}
              onClick={handleSync}
            >
              {syncMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync NSE
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!zerodhaConnection?.connected || priceRefreshMutation.isPending}
              onClick={handlePriceRefresh}
              title="Refresh latest close/change%/volume for every known NSE instrument, without re-syncing instrument metadata"
            >
              {priceRefreshMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync all prices
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!zerodhaConnection?.connected || indexSyncMutation.isPending}
              onClick={handleIndexSync}
              title="Sync NSE indices (NIFTY AUTO, BANKNIFTY, NIFTY IT, ...) as instruments, filtered out of the regular equity sync - run this before Backfill Index History"
            >
              {indexSyncMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync Indices
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!zerodhaConnection?.connected || indexBackfillMutation.isPending}
              onClick={handleIndexBackfill}
              title="Backfill full price history for every synced NSE index - needed before the dashboard's Index Harvest box has real data"
            >
              {indexBackfillMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Backfill Index History
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={
                zerodhaConnectionQuery.isLoading ||
                connectUrlMutation.isPending ||
                zerodhaConnection?.providerConfigured === false
              }
              onClick={handleConnect}
            >
              {connectUrlMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ExternalLink className="size-3.5" />
              )}
              {zerodhaConnection?.connected ? "Reconnect" : "Connect Zerodha"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <StatusRow
            label="Provider config"
            value={providerConfigValue({
              isLoading: zerodhaConnectionQuery.isLoading,
              isError: zerodhaConnectionQuery.isError,
              providerConfigured: zerodhaConnection?.providerConfigured,
            })}
          />
          <StatusRow
            label="Connection"
            value={
              zerodhaConnectionQuery.isLoading
                ? "Checking..."
                : zerodhaConnectionQuery.isError && !zerodhaConnection
                  ? "Unable to check"
                  : zerodhaConnection?.connected
                    ? "Connected"
                    : "Not connected"
            }
          />
          <StatusRow
            label="Last synced"
            value={
              zerodhaConnection?.lastSyncedAt
                ? new Date(zerodhaConnection.lastSyncedAt).toLocaleString()
                : "Not synced yet"
            }
          />
          <StatusRow label="Callback URL" value={callbackUrl} />
        </div>

        {zerodhaConnection?.errorMessage ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {zerodhaConnection.errorMessage}
          </div>
        ) : null}
        {zerodhaConnection?.providerConfigured === false ? (
          <div className="mt-4 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            Add `ZERODHA_API_KEY` and `ZERODHA_API_SECRET` in backend env, then restart the
            backend.
          </div>
        ) : null}
        {connectUrlMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Could not create Kite login URL. Check backend env and admin session.
          </div>
        ) : null}
        {syncMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            NSE instrument sync started.
          </div>
        ) : null}
        {syncMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            NSE instrument sync failed. Check the backend log for the provider message.
          </div>
        ) : null}
        {priceRefreshMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Price refresh started for every known NSE instrument. This can take a while for
            the full market - check Jobs for progress.
          </div>
        ) : null}
        {priceRefreshMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Price refresh failed to start. Check the backend log for the provider message.
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  GlobalDataFeeds (BSE)
                </h2>
                <ConnectionBadge
                  loading={globalDatafeedsHealthQuery.isLoading}
                  isError={globalDatafeedsHealthQuery.isError}
                  connected={globalDatafeedsHealthQuery.data?.connected ?? false}
                  status={globalDatafeedsHealthQuery.data?.status}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                BSE market data and indices use this connection. No OAuth required - just the
                API keys already configured in backend env.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!globalDatafeedsStatus?.connected || bseSyncMutation.isPending}
              onClick={handleBseSync}
              title="Sync BSE equity instruments from GlobalDataFeeds"
            >
              {bseSyncMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync BSE
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!globalDatafeedsStatus?.connected || bsePriceRefreshMutation.isPending}
              onClick={handleBsePriceRefresh}
              title="Refresh latest close/change%/volume for every known BSE instrument"
            >
              {bsePriceRefreshMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync BSE Prices
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!globalDatafeedsStatus?.connected || bseIndexSyncMutation.isPending}
              onClick={handleBseIndexSync}
              title="Sync BSE indices as instruments - run before Backfill BSE Index History"
            >
              {bseIndexSyncMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync BSE Indices
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!globalDatafeedsStatus?.connected || bseIndexBackfillMutation.isPending}
              onClick={handleBseIndexBackfill}
              title="Backfill full price history for every synced BSE index - needed before the BSE dashboard's Index Harvest box has real data"
            >
              {bseIndexBackfillMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Backfill BSE Index History
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-3">
          <div className="min-w-55 flex-1">
            <p className="text-sm font-medium text-foreground">Sector &amp; industry classification</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Powered by GlobalDataFeeds Fundamentals. One pass classifies both NSE and BSE
              instruments and repopulates the &quot;BSE - Classified Universe&quot; dashboard
              segment. Not tied to any single exchange feed.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={sectorClassificationMutation.isPending}
            onClick={handleSectorClassificationSync}
            title="Pull real sector/industry classification from GlobalDataFeeds Fundamentals and match it onto NSE and BSE instruments"
          >
            {sectorClassificationMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Sync Sector Data
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <StatusRow
            label="Provider config"
            value={providerConfigValue({
              isLoading: statusesQuery.isLoading,
              isError: statusesQuery.isError,
              providerConfigured: globalDatafeedsStatus?.providerConfigured,
            })}
          />
          <StatusRow
            label="Health"
            value={providerHealthValue(globalDatafeedsHealthQuery)}
          />
          <StatusRow
            label="Last synced"
            value={
              globalDatafeedsStatus?.lastSyncedAt
                ? new Date(globalDatafeedsStatus.lastSyncedAt).toLocaleString()
                : "Not synced yet"
            }
          />
        </div>

        {globalDatafeedsHealthQuery.data?.errorMessage ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {globalDatafeedsHealthQuery.data.errorMessage}
          </div>
        ) : null}
        {sectorClassificationMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Sector data sync started. It classifies NSE and BSE instruments in one pass - check
            Jobs for progress.
          </div>
        ) : null}
        {sectorClassificationMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Sector data sync failed to start. Check the backend log for the provider message.
          </div>
        ) : null}
        {bseSyncMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE instrument sync started.
          </div>
        ) : null}
        {bseSyncMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE instrument sync failed. Check the backend log for the provider message.
          </div>
        ) : null}
        {bsePriceRefreshMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE price refresh started.
          </div>
        ) : null}
        {bsePriceRefreshMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE price refresh failed to start. Check the backend log for the provider message.
          </div>
        ) : null}
        {bseIndexSyncMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE index sync started.
          </div>
        ) : null}
        {bseIndexSyncMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE index sync failed. Check the backend log for the provider message.
          </div>
        ) : null}
        {bseIndexBackfillMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE index history backfill started.
          </div>
        ) : null}
        {bseIndexBackfillMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE index history backfill failed to start. Check the backend log for the
            provider message.
          </div>
        ) : null}
      </section>

      <EodhdSection
        status={eodhdStatus}
        loading={statusesQuery.isLoading}
        isError={statusesQuery.isError}
      />
    </div>
  );
}

function EodhdSection({
  status,
  loading,
  isError,
}: {
  status: AdminDataProviderStatusEntry | undefined;
  loading: boolean;
  isError: boolean;
}) {
  // External health loads independently of the local status props above, so a
  // slow/failing EODHD check never delays "Provider config" / "Last synced".
  const healthQuery = useAdminDataProviderHealth("eodhd");

  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Database className="size-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">EODHD</h2>
            <ConnectionBadge
              loading={healthQuery.isLoading}
              isError={healthQuery.isError}
              connected={healthQuery.data?.connected ?? false}
              status={healthQuery.data?.status}
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Default fallback for exchanges outside NSE/BSE - used automatically, no manual
            sync action required.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatusRow
          label="Provider config"
          value={providerConfigValue({
            isLoading: loading,
            isError,
            providerConfigured: status?.providerConfigured,
          })}
        />
        <StatusRow label="Health" value={providerHealthValue(healthQuery)} />
        <StatusRow
          label="Last synced"
          value={status?.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : "Not synced yet"}
        />
      </div>

      {healthQuery.data?.errorMessage ? (
        <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {healthQuery.data.errorMessage}
        </div>
      ) : null}
    </section>
  );
}

function ProviderRow({ provider }: { provider: AdminDataProviderSettingsRow }) {
  const updateSettings = useUpdateAdminDataProviderSettings();
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [priorityDraft, setPriorityDraft] = useState(String(provider.priority));

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
      return;
    }
    updateSettings.mutate({ key: provider.key, priority: Math.round(parsed) });
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="font-semibold text-foreground">{provider.displayName}</div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {provider.capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground"
              >
                {CAPABILITY_LABELS[capability] ?? capability}
              </span>
            ))}
          </div>
          {provider.disabledReason && (
            <div className="mt-1 text-xs text-muted-foreground">
              Reason: {provider.disabledReason}
            </div>
          )}
          {provider.lastError && (
            <div className="mt-1 max-w-xs truncate text-xs text-danger" title={provider.lastError}>
              {provider.lastError}
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
          <Input
            value={priorityDraft}
            onChange={(event) => setPriorityDraft(event.target.value)}
            onBlur={commitPriority}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            inputMode="numeric"
            className="h-8 w-16 text-center text-sm"
          />
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={
              provider.configured
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-muted text-muted-foreground"
            }
          >
            {provider.configured ? "Configured" : "Missing"}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={healthBadgeClassName(provider.health)}>
            {healthLabel(provider.health)}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatRelativeTime(provider.lastSuccessAt)}
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

// "Provider config" reflects local backend env/config presence only. It must
// resolve to a deterministic string: "Checking..." only while the very first
// request is in flight, "Unable to check" once that request has failed (so the
// row never sits on "Checking..." forever), otherwise Configured / Missing.
// Stale data from an earlier successful fetch still wins over "Unable to check".
function providerConfigValue({
  isLoading,
  isError,
  providerConfigured,
}: {
  isLoading: boolean;
  isError: boolean;
  providerConfigured: boolean | undefined;
}) {
  if (providerConfigured === undefined) {
    if (isError) return "Unable to check";
    if (isLoading) return "Checking...";
    return "Unknown";
  }
  return providerConfigured ? "Configured" : "Missing env keys";
}

// The independent external-health query for a provider card. "Checking..."
// only while that background request is in flight; a failed request (or an
// adapter check that timed out server-side) resolves to a deterministic
// non-pending label so the row never sticks.
function providerHealthValue(query: {
  isLoading: boolean;
  isError: boolean;
  data: AdminDataProviderHealthResult | undefined;
}) {
  if (query.isLoading) return "Checking...";
  if (query.isError || !query.data) return "Unknown";
  if (query.data.status === "error") return "Error";
  return query.data.connected ? "Healthy" : "Unknown";
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
