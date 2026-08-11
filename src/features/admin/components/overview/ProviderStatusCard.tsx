import Link from "next/link";
import { CheckCircle2, Database, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminDataProviderStatusEntry } from "../../types";

const PROVIDER_LABELS: Record<string, string> = {
  eodhd: "EODHD",
  zerodha: "Zerodha Kite",
  "global-datafeeds": "GlobalDataFeeds (BSE)",
};

const CONNECTABLE_PROVIDERS = new Set(["zerodha"]);

export function ProviderStatusCard({ entry }: { entry: AdminDataProviderStatusEntry }) {
  const label = PROVIDER_LABELS[entry.provider] ?? entry.provider;
  const isConnectable = CONNECTABLE_PROVIDERS.has(entry.provider);

  return (
    <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="size-4.5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{label}</h3>
              <Badge
                variant="outline"
                className={
                  entry.connected
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-danger/30 bg-danger/10 text-danger"
                }
              >
                {entry.connected ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <XCircle className="size-3" />
                )}
                {entry.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground">Config</div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {entry.providerConfigured ? "Configured" : "Missing env keys"}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground">Last synced</div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {entry.lastSyncedAt ? new Date(entry.lastSyncedAt).toLocaleString() : "Not synced yet"}
          </div>
        </div>
      </div>

      {entry.errorMessage ? (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {entry.errorMessage}
        </div>
      ) : null}

      {isConnectable ? (
        <Link
          href="/admin/data-provider"
          className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
        >
          Manage connection
        </Link>
      ) : null}
    </div>
  );
}
