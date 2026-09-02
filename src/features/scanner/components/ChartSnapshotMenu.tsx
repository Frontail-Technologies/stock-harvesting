"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import type { Stock } from "@/types/market";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { useScannerUiStore } from "../stores/scanner-ui-store";

type ChartSnapshotMenuProps = {
  stock: Stock;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
};

const ACTION_COOLDOWN_MS = 1200;

export function ChartSnapshotMenu({ compact, className, disabled }: ChartSnapshotMenuProps) {
  const requestCapture = useScannerUiStore((state) => state.requestCapture);
  const [busy, setBusy] = useState(false);

  const [hasNativeShare] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current);
    };
  }, []);

  const withCooldown = (run: () => void) => {
    if (busy) return;
    setBusy(true);
    try {
      run();
    } finally {
      cooldownRef.current = window.setTimeout(() => setBusy(false), ACTION_COOLDOWN_MS);
    }
  };

  const handleDownload = () => withCooldown(() => requestCapture("download"));
  const handleCopyImage = () => withCooldown(() => requestCapture("copy"));
  const handleShare = () => withCooldown(() => requestCapture("share"));

  const handleOpenInNewTab = () =>
    withCooldown(() => {

      const newTab = window.open("", "_blank");
      requestCapture("open-tab", newTab);
    });

  return (
    <Tooltip>
      <DropdownMenu>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              disabled={disabled}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Chart snapshot"
                  disabled={disabled}
                  className={cn(
                    "cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed",
                    className,
                  )}
                />
              }
            />
          }
        >
          <Camera className="size-4" />
        </TooltipTrigger>
        <TooltipContent side={compact ? "right" : "bottom"} className="scanner-portal">
          Chart snapshot
        </TooltipContent>
        <DropdownMenuContent
          align={compact ? "start" : "end"}
          side={compact ? "right" : "bottom"}
          className="scanner-portal w-64"
        >
          <div className="px-1.5 pb-1.5 pt-1">
            <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Chart Snapshot
            </span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDownload}
            disabled={busy}
            className="cursor-pointer gap-2"
          >
            <Download className="size-4 text-muted-foreground" />
            Download image
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleCopyImage}
            disabled={busy}
            className="cursor-pointer gap-2"
          >
            <Copy className="size-4 text-muted-foreground" />
            Copy image
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleOpenInNewTab}
            disabled={busy}
            className="cursor-pointer gap-2"
          >
            <ExternalLink className="size-4 text-muted-foreground" />
            Open in new tab
          </DropdownMenuItem>
          {hasNativeShare && (
            <DropdownMenuItem
              onClick={handleShare}
              disabled={busy}
              className="cursor-pointer gap-2"
            >
              <Share2 className="size-4 text-muted-foreground" />
              Share image
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  );
}
