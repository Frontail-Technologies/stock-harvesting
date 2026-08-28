"use client";

import { List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { useScannerUiStore } from "../stores/scanner-ui-store";

type ScannerWatchlistToggleProps = {
  className?: string;
};

// Self-contained, like ThemeToggle/ScannerAccountMenu - reads and writes
// scanner-ui-store directly rather than threading open state through
// TopToolbar's props.
export function ScannerWatchlistToggle({ className }: ScannerWatchlistToggleProps) {
  const isOpen = useScannerUiStore((state) => state.isWatchlistPanelOpen);
  const toggle = useScannerUiStore((state) => state.toggleWatchlistPanel);

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={toggle}
        aria-label="Watchlists"
        aria-pressed={isOpen}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60",
          isOpen && "bg-muted text-primary",
          className
        )}
      >
        <List className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className="scanner-portal">
        Watchlists
      </TooltipContent>
    </Tooltip>
  );
}
