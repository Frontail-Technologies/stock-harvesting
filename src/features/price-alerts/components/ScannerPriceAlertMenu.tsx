"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrency } from "@/features/currency";
import { searchStocksApi } from "@/features/market-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";
import {
  createPriceAlert,
  getPushPublicKey,
  savePushSubscription,
  type PriceAlert,
  type PriceAlertCondition,
} from "../api/price-alerts-api";
import { ensureBrowserPushSubscription } from "../api/push-client";
import { useDeletePriceAlert, usePriceAlerts } from "../hooks/use-price-alerts";

type ScannerPriceAlertMenuProps = {
  stock: Stock;
};

// A target/condition carried over from a different symbol would be stale,
// not a convenience - the caller mounts this with
// key={`${exchange}:${symbol}`} so switching stocks remounts it with a
// clean draft (and closes an open popover/sheet) instead of resetting
// state inside an effect.
export function ScannerPriceAlertMenu({ stock }: ScannerPriceAlertMenuProps) {
  const [open, setOpen] = useState(false);
  // Decided by real viewport width, not by which TopToolbar row this
  // instance happens to be mounted in - a 320px popover can still feel
  // oversized on a narrow-but-not-quite-"sm:hidden" window (tablet
  // portrait, a resized desktop browser), so this uses its own, wider
  // threshold rather than inheriting the toolbar's 640px row-visibility
  // breakpoint.
  const isMobileViewport = useMediaQuery("(max-width: 767px)");
  const [condition, setCondition] = useState<PriceAlertCondition>("ABOVE");
  const [targetPrice, setTargetPrice] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { formatStockCurrency } = useCurrency();

  const target = useMemo(() => {
    const trimmed = targetPrice.trim();
    return trimmed ? Number(trimmed) : Number.NaN;
  }, [targetPrice]);
  const stockClosePrice =
    Number.isFinite(stock.close) && stock.close > 0 ? stock.close : null;

  // The selectedStock passed down can briefly be a stale placeholder
  // (close: 0) right after a URL-driven navigation, before the real stock
  // row has loaded - ChartInfoOverlay works around the same gap by reading
  // price from candles instead of stock.close. This popover doesn't have
  // candles on hand, so it falls back to a direct symbol lookup instead,
  // and only when the passed-in close is actually missing (the common
  // case - selecting a stock via search already carries a real price - so
  // this adds no extra request then).
  const fallbackPriceQuery = useQuery({
    queryKey: ["price-alerts", "fallback-price", stock.exchange, stock.symbol],
    queryFn: async () => {
      const response = await searchStocksApi({
        q: stock.symbol,
        exchange: stock.exchange,
        limit: 5,
      });
      return (
        response.stocks.find(
          (row) => row.symbol === stock.symbol && row.exchange === stock.exchange
        )?.close ?? null
      );
    },
    enabled: stockClosePrice === null && Boolean(stock.symbol),
    staleTime: 60_000,
  });
  const fallbackPrice =
    fallbackPriceQuery.data && fallbackPriceQuery.data > 0 ? fallbackPriceQuery.data : null;
  const currentPrice = stockClosePrice ?? fallbackPrice;
  const targetPlacementError = useMemo(() => {
    if (!Number.isFinite(target) || target <= 0 || currentPrice === null) return null;
    const formattedCurrent = formatStockCurrency(currentPrice, stock.exchange);
    if (condition === "ABOVE" && target <= currentPrice) {
      return `Target must be above the current price ${formattedCurrent}`;
    }
    if (condition === "BELOW" && target >= currentPrice) {
      return `Target must be below the current price ${formattedCurrent}`;
    }
    return null;
  }, [condition, currentPrice, target, formatStockCurrency, stock.exchange]);
  const canSubmit = Number.isFinite(target) && target > 0 && !targetPlacementError;

  const alertsQuery = usePriceAlerts({
    exchange: stock.exchange,
    symbol: stock.symbol,
    status: "ACTIVE",
  });
  const deleteMutation = useDeletePriceAlert();

  const handleTargetPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/,/g, "");
    if (/^\d*\.?\d*$/.test(value)) {
      setTargetPrice(value);
      setError(null);
      setMessage(null);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setMessage(null);
      if (targetPlacementError) throw new Error(targetPlacementError);
      const pushKey = await getPushPublicKey();
      if (!pushKey.configured || !pushKey.publicKey) {
        throw new Error("Push notifications are not configured on the backend.");
      }
      const subscription = await ensureBrowserPushSubscription(pushKey.publicKey);
      await savePushSubscription(subscription);
      return createPriceAlert({
        exchange: stock.exchange,
        symbol: stock.symbol,
        condition,
        targetPrice: target,
        currentPrice: currentPrice ?? undefined,
      });
    },
    onSuccess: () => {
      setMessage("Alert created");
      setTargetPrice("");
      void alertsQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to save alert");
    },
  });

  const triggerClassName = cn(
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60",
    open && "bg-muted text-primary"
  );

  const formBody = (
    <PriceAlertFormBody
      stock={stock}
      currentPrice={currentPrice}
      currentPriceLoading={currentPrice === null && fallbackPriceQuery.isLoading}
      formatStockCurrency={formatStockCurrency}
      condition={condition}
      onConditionChange={(next) => {
        setCondition(next);
        setError(null);
        setMessage(null);
      }}
      targetPrice={targetPrice}
      onTargetPriceChange={handleTargetPriceChange}
      targetPlacementError={targetPlacementError}
      error={error}
      message={message}
      canSubmit={canSubmit}
      isPending={createMutation.isPending}
      onSubmit={() => {
        if (canSubmit) createMutation.mutate();
      }}
      alerts={alertsQuery.data?.alerts ?? []}
      alertsLoading={alertsQuery.isLoading}
      onDeleteAlert={(id) => deleteMutation.mutate(id)}
      deletingId={deleteMutation.isPending ? (deleteMutation.variables ?? null) : null}
    />
  );

  if (isMobileViewport) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger
            render={<SheetTrigger className={triggerClassName} aria-label="Price alerts" />}
          >
            <Bell className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="scanner-portal">
            Price alerts
          </TooltipContent>
        </Tooltip>
        <SheetContent
          side="bottom"
          className="scanner-portal gap-3 px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {formBody}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={<PopoverTrigger className={triggerClassName} aria-label="Price alerts" />}
        >
          <Bell className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="scanner-portal">
          Price alerts
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        className="scanner-portal w-80 max-w-[calc(100vw-1.5rem)] p-3"
      >
        {formBody}
      </PopoverContent>
    </Popover>
  );
}

function PriceAlertFormBody({
  stock,
  currentPrice,
  currentPriceLoading,
  formatStockCurrency,
  condition,
  onConditionChange,
  targetPrice,
  onTargetPriceChange,
  targetPlacementError,
  error,
  message,
  canSubmit,
  isPending,
  onSubmit,
  alerts,
  alertsLoading,
  onDeleteAlert,
  deletingId,
}: {
  stock: Stock;
  currentPrice: number | null;
  currentPriceLoading: boolean;
  formatStockCurrency: (value: number, exchange?: string) => string;
  condition: PriceAlertCondition;
  onConditionChange: (condition: PriceAlertCondition) => void;
  targetPrice: string;
  onTargetPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
  targetPlacementError: string | null;
  error: string | null;
  message: string | null;
  canSubmit: boolean;
  isPending: boolean;
  onSubmit: () => void;
  alerts: PriceAlert[];
  alertsLoading: boolean;
  onDeleteAlert: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Price Alert
        </p>
        <p className="mt-1 text-sm font-bold text-foreground">
          {stock.symbol} <span className="font-normal text-muted-foreground">· {stock.exchange}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Current{" "}
          <span className="font-semibold text-foreground">
            {currentPrice !== null
              ? formatStockCurrency(currentPrice, stock.exchange)
              : currentPriceLoading
                ? "Checking..."
                : "—"}
          </span>
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Condition</label>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-border bg-background p-1">
          {(["ABOVE", "BELOW"] as PriceAlertCondition[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onConditionChange(option)}
              className={cn(
                "h-8 cursor-pointer rounded-md text-xs font-bold transition-colors hover:bg-muted",
                condition === option && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {option === "ABOVE" ? "Above" : "Below"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="price-alert-target" className="text-xs font-medium text-muted-foreground">
          Target Price
        </label>
        <input
          id="price-alert-target"
          type="text"
          inputMode="decimal"
          value={targetPrice}
          onChange={onTargetPriceChange}
          placeholder="0.00"
          className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary"
        />
      </div>

      {targetPlacementError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {targetPlacementError}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
          {message}
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit || isPending}
        onClick={onSubmit}
        className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        {isPending ? "Creating..." : "Create Alert"}
      </button>

      {(alertsLoading || alerts.length > 0) && (
        <div className="border-t border-border pt-3">
          <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Active Alerts
          </p>
          <div className="mt-1.5 flex max-h-36 flex-col gap-1 overflow-y-auto">
            {alertsLoading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                >
                  <span className="text-xs font-medium text-foreground">
                    {alert.condition === "ABOVE" ? "Above" : "Below"}{" "}
                    {formatStockCurrency(alert.targetPrice, stock.exchange)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      type="button"
                      aria-label="Remove alert"
                      disabled={deletingId === alert.id}
                      onClick={() => onDeleteAlert(alert.id)}
                      className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="scanner-portal">
                      Remove alert
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

