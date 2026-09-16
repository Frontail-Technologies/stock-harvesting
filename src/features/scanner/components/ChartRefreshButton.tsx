"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useManualChartRefresh } from "@/features/market-data";
import { cn } from "@/utils/cn";

type ChartRefreshButtonProps = {
  symbol: string;
  exchange: string;
  className?: string;
};

const RESULT_RESET_DELAY_MS = 2500;

const STATUS_LABEL: Record<string, string> = {
  updated: "Updated",
  repaired: "Updated",
  "already-current": "Already current",
  failed: "Failed",
  "in-progress": "Refreshing...",
};

export function ChartRefreshButton({ symbol, exchange, className }: ChartRefreshButtonProps) {
  const refreshMutation = useManualChartRefresh();
  const [resultLabel, setResultLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!resultLabel) return;
    const timer = window.setTimeout(() => setResultLabel(null), RESULT_RESET_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [resultLabel]);

  const handleRefresh = () => {
    if (refreshMutation.isPending || !symbol) return;
    refreshMutation.mutate(
      { symbol, exchange },
      {
        onSuccess: (response) => {
          setResultLabel(STATUS_LABEL[response.status] ?? "Refresh");
          if (response.status === "failed") {
            toast.error(`Refresh failed for ${symbol}`);
          } else if (response.status === "already-current") {
            toast.success(`${symbol} is already current`);
          } else if (response.changed) {
            toast.success(`${symbol} updated`);
          }
        },
        onError: () => {
          setResultLabel("Failed");
          toast.error(`Refresh failed for ${symbol}`);
        },
      }
    );
  };

  const label = refreshMutation.isPending ? "Refreshing..." : (resultLabel ?? "Refresh");

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 gap-1.5 border-border text-xs", className)}
      onClick={handleRefresh}
      disabled={refreshMutation.isPending || !symbol}
    >
      <RefreshCw className={cn("size-3.5", refreshMutation.isPending && "animate-spin")} />
      {label}
    </Button>
  );
}
