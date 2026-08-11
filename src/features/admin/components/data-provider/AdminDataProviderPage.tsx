"use client";

import { useMemo } from "react";
import { CheckCircle2, Database, ExternalLink, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAdminDataProviderStatus,
  useAdminDataProviderStatuses,
  useBackfillAdminIndexCandles,
  useCreateAdminDataProviderConnectUrl,
  useSyncAdminDataProvider,
  useSyncAdminMarketDataPrices,
  useSyncAdminSectorClassification,
} from "../../hooks/use-admin-data-provider";
import { ProviderStatusCard } from "../overview/ProviderStatusCard";

export function AdminDataProviderPage() {
  const statusQuery = useAdminDataProviderStatus();
  const statusesQuery = useAdminDataProviderStatuses();
  const connectUrlMutation = useCreateAdminDataProviderConnectUrl();
  const syncMutation = useSyncAdminDataProvider();
  const priceRefreshMutation = useSyncAdminMarketDataPrices();
  const sectorClassificationMutation = useSyncAdminSectorClassification();
  // Separate mutation instance from syncMutation (even though both call the
  // same generic sync endpoint) so its pending state doesn't get conflated
  // with the "Sync NSE" button above.
  const indexSyncMutation = useSyncAdminDataProvider();
  const indexBackfillMutation = useBackfillAdminIndexCandles();
  // Separate mutation instances from the NSE ones above so BSE buttons get
  // their own independent pending/success/error state.
  const bseSyncMutation = useSyncAdminDataProvider();
  const bseIndexSyncMutation = useSyncAdminDataProvider();
  const bsePriceRefreshMutation = useSyncAdminMarketDataPrices();
  const bseIndexBackfillMutation = useBackfillAdminIndexCandles();
  const status = statusQuery.data;
  const eodhdStatus = statusesQuery.data?.providers.find(
    (entry) => entry.provider === "eodhd"
  );
  const globalDatafeedsStatus = statusesQuery.data?.providers.find(
    (entry) => entry.provider === "global-datafeeds"
  );
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

  const handleSync = () => {
    syncMutation.mutate({ exchange: "NSE" });
  };

  const handlePriceRefresh = () => {
    priceRefreshMutation.mutate({ exchange: "NSE" });
  };

  const handleSectorClassificationSync = () => {
    sectorClassificationMutation.mutate();
  };

  const handleIndexSync = () => {
    indexSyncMutation.mutate({ exchange: "NSE_IDX" });
  };

  const handleIndexBackfill = () => {
    indexBackfillMutation.mutate({ exchange: "NSE_IDX" });
  };

  const handleBseSync = () => {
    bseSyncMutation.mutate({ exchange: "BSE" });
  };

  const handleBseIndexSync = () => {
    bseIndexSyncMutation.mutate({ exchange: "BSE_IDX" });
  };

  const handleBsePriceRefresh = () => {
    bsePriceRefreshMutation.mutate({ exchange: "BSE" });
  };

  const handleBseIndexBackfill = () => {
    bseIndexBackfillMutation.mutate({ exchange: "BSE_IDX" });
  };

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Data Provider</h1>
        <p className="text-sm text-muted-foreground">
          Connect Kite for NSE candles and instrument sync.
        </p>
      </div>

      {eodhdStatus ? <ProviderStatusCard entry={eodhdStatus} /> : null}

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Zerodha Kite
                </h2>
                <ProviderStatusBadge
                  loading={statusQuery.isLoading}
                  connected={status?.connected ?? false}
                  status={status?.status}
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                NSE market data uses this connection. Provider tokens are stored
                encrypted on the backend.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={statusQuery.isFetching}
              onClick={() => void statusQuery.refetch()}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!status?.connected || syncMutation.isPending}
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
              disabled={!status?.connected || priceRefreshMutation.isPending}
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
              disabled={sectorClassificationMutation.isPending}
              onClick={handleSectorClassificationSync}
              title="Pull real sector/industry classification from GlobalDataFeeds Fundamentals and match it onto NSE/BSE instruments - independent of the Zerodha connection above"
            >
              {sectorClassificationMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync Sector Data
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!status?.connected || indexSyncMutation.isPending}
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
              disabled={!status?.connected || indexBackfillMutation.isPending}
              onClick={handleIndexBackfill}
              title="Backfill full price history for every synced NSE index - needed before the dashboard's Relative Strength Index box has real data"
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
                statusQuery.isLoading ||
                connectUrlMutation.isPending ||
                status?.providerConfigured === false
              }
              onClick={handleConnect}
            >
              {connectUrlMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ExternalLink className="size-3.5" />
              )}
              {status?.connected ? "Reconnect" : "Connect Zerodha"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <StatusRow
            label="Provider config"
            value={
              statusQuery.isLoading
                ? "Checking..."
                : status?.providerConfigured
                  ? "Configured"
                  : "Missing env keys"
            }
          />
          <StatusRow
            label="Connection"
            value={
              statusQuery.isLoading
                ? "Checking..."
                : status?.connected
                  ? "Connected"
                  : "Not connected"
            }
          />
          <StatusRow
            label="Last synced"
            value={
              status?.lastSyncedAt
                ? new Date(status.lastSyncedAt).toLocaleString()
                : "Not synced yet"
            }
          />
          <StatusRow label="Callback URL" value={callbackUrl} />
        </div>

        {status?.errorMessage ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {status.errorMessage}
          </div>
        ) : null}
        {status?.providerConfigured === false ? (
          <div className="mt-4 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-muted-foreground">
            Add `ZERODHA_API_KEY` and `ZERODHA_API_SECRET` in backend env, then
            restart the backend.
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
            NSE instrument sync failed. Check the backend log for the provider
            message.
          </div>
        ) : null}
        {priceRefreshMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Price refresh started for every known NSE instrument. This can take
            a while for the full market - check Jobs for progress.
          </div>
        ) : null}
        {priceRefreshMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Price refresh failed to start. Check the backend log for the
            provider message.
          </div>
        ) : null}
      </section>

      {globalDatafeedsStatus ? <ProviderStatusCard entry={globalDatafeedsStatus} /> : null}

      <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                GlobalDataFeeds (BSE)
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                BSE market data and indices use this connection. No OAuth
                required - just the API keys already configured in backend
                env.
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
              title="Backfill full price history for every synced BSE index - needed before the BSE dashboard's Relative Strength Index box has real data"
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

        <p className="mt-4 text-xs text-muted-foreground">
          Sector/industry classification (which also auto-populates the
          &quot;BSE - Classified Universe&quot; dashboard collection) is
          synced from the &quot;Sync Sector Data&quot; button above - it
          covers both NSE and BSE in one pass.
        </p>

        {bseSyncMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE instrument sync started.
          </div>
        ) : null}
        {bseSyncMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE instrument sync failed. Check the backend log for the
            provider message.
          </div>
        ) : null}
        {bsePriceRefreshMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE price refresh started.
          </div>
        ) : null}
        {bsePriceRefreshMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE price refresh failed to start. Check the backend log for the
            provider message.
          </div>
        ) : null}
        {bseIndexSyncMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE index sync started.
          </div>
        ) : null}
        {bseIndexSyncMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE index sync failed. Check the backend log for the provider
            message.
          </div>
        ) : null}
        {bseIndexBackfillMutation.isSuccess ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            BSE index history backfill started.
          </div>
        ) : null}
        {bseIndexBackfillMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            BSE index history backfill failed to start. Check the backend
            log for the provider message.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ProviderStatusBadge({
  loading,
  connected,
  status,
}: {
  loading: boolean;
  connected: boolean;
  status?: string;
}) {
  if (loading) {
    return (
      <Badge variant="outline" className="bg-card text-xs">
        Checking
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
      {connected ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <XCircle className="size-3" />
      )}
      {status ?? "disconnected"}
    </Badge>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
