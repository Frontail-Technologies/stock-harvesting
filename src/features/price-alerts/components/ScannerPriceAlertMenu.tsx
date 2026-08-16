"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";
import {
  createPriceAlert,
  getPushPublicKey,
  savePushSubscription,
  type PriceAlertCondition,
} from "../api/price-alerts-api";
import { ensureBrowserPushSubscription } from "../api/push-client";

type ScannerPriceAlertMenuProps = {
  stock: Stock;
  compact?: boolean;
};

export function ScannerPriceAlertMenu({
  stock,
  compact = false,
}: ScannerPriceAlertMenuProps) {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<PriceAlertCondition>("ABOVE");
  const [targetPrice, setTargetPrice] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const target = useMemo(() => {
    const trimmed = targetPrice.trim();
    return trimmed ? Number(trimmed) : Number.NaN;
  }, [targetPrice]);
  const currentPrice = Number.isFinite(stock.close) && stock.close > 0 ? stock.close : null;
  const targetPlacementError = useMemo(() => {
    if (!Number.isFinite(target) || target <= 0 || currentPrice === null) return null;
    if (condition === "ABOVE" && target <= currentPrice) {
      return "For ABOVE alerts, target must be greater than the current price.";
    }
    if (condition === "BELOW" && target >= currentPrice) {
      return "For BELOW alerts, target must be lower than the current price.";
    }
    return null;
  }, [condition, currentPrice, target]);
  const canSubmit = Number.isFinite(target) && target > 0 && !targetPlacementError;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

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
      setMessage("Alert saved");
      setTargetPrice("");
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to save alert");
    },
  });

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          compact ? "size-9" : "size-9",
          open && "border-primary text-foreground"
        )}
        aria-label="Price alert"
        aria-expanded={open}
        title="Price alert"
      >
        <Bell className="size-4" />
      </button>

      {open && (
        <div
          className="scanner-portal absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-2xl"
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="px-1 pb-2 text-sm font-bold text-foreground">
            {stock.symbol} price alert
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-background p-1">
            {(["ABOVE", "BELOW"] as PriceAlertCondition[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setCondition(option);
                  setError(null);
                  setMessage(null);
                }}
                className={cn(
                  "h-8 cursor-pointer rounded-md text-xs font-bold transition-colors hover:bg-muted",
                  condition === option && "bg-primary text-primary-foreground hover:bg-primary"
                )}
              >
                {option === "ABOVE" ? "Price above" : "Price below"}
              </button>
            ))}
          </div>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={targetPrice}
            onChange={handleTargetPriceChange}
            placeholder="Target price"
            className="mt-2 h-9 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary"
          />
          {targetPlacementError && (
            <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
              {targetPlacementError}
            </div>
          )}
          {error && (
            <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-2 rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
              {message}
            </div>
          )}
          <button
            type="button"
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => {
              if (canSubmit) createMutation.mutate();
            }}
            className="mt-2 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bell className="size-4" />
            {createMutation.isPending ? "Saving..." : "Save alert"}
          </button>
        </div>
      )}
    </div>
  );
}
