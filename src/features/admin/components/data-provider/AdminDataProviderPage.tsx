"use client";

import { useMemo } from "react";
import { CheckCircle2, Database, ExternalLink, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAdminDataProviderStatus,
  useAdminDataProviderStatuses,
  useCreateAdminDataProviderConnectUrl,
  useSyncAdminDataProvider,
  useSyncAdminMarketDataPrices,
} from "../../hooks/use-admin-data-provider";
import { ProviderStatusCard } from "../overview/ProviderStatusCard";

export function AdminDataProviderPage() {
  const statusQuery = useAdminDataProviderStatus();
  const statusesQuery = useAdminDataProviderStatuses();
  const connectUrlMutation = useCreateAdminDataProviderConnectUrl();
  const syncMutation = useSyncAdminDataProvider();
  const priceRefreshMutation = useSyncAdminMarketDataPrices();
  const status = statusQuery.data;
  const eodhdStatus = statusesQuery.data?.providers.find(
    (entry) => entry.provider === "eodhd"
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
            a while for the full market — check Jobs for progress.
          </div>
        ) : null}
        {priceRefreshMutation.isError ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Price refresh failed to start. Check the backend log for the
            provider message.
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
