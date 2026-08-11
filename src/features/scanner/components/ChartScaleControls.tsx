"use client";

import type { ComponentType, SVGProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

type ChartScaleControlsProps = {
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  scannerHighlightsVisible: boolean;
  onToggleAutoScale: () => void;
  onTogglePercentageScale: () => void;
  onToggleBacktestStats: () => void;
  onToggleScannerHighlights: () => void;
};

function controlClass(active: boolean) {
  return cn(
    "flex h-6 min-w-6 cursor-pointer items-center justify-center rounded px-1.5 text-[0.6875rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
    active
      ? "bg-primary/15 text-primary"
      : "text-(--scanner-toolbar-muted) hover:bg-muted hover:text-foreground"
  );
}

function ScaleToggle({
  label,
  title,
  active,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={controlClass(active)}
    >
      {label}
    </button>
  );
}

function IconToggle({
  title,
  active,
  onClick,
  icon: Icon,
}: {
  title: string;
  active: boolean;
  onClick: () => void;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        title={title}
        aria-label={title}
        aria-pressed={active}
        onClick={onClick}
        className={controlClass(active)}
      >
        <Icon className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent side="top" className="scanner-portal">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

export function ChartScaleControls({
  autoScale,
  percentageScale,
  showBacktestStats,
  scannerHighlightsVisible,
  onToggleAutoScale,
  onTogglePercentageScale,
  onToggleBacktestStats,
  onToggleScannerHighlights,
}: ChartScaleControlsProps) {
  const scannerHighlightTitle = scannerHighlightsVisible
    ? "Hide scanner highlights"
    : "Show scanner highlights";

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-(--scanner-toolbar-border) bg-(--scanner-toolbar-bg) p-0.5">
      <ScaleToggle
        label="Auto"
        title={autoScale ? "Auto scale: on" : "Auto scale: off (drag price axis to resize)"}
        active={autoScale}
        onClick={onToggleAutoScale}
      />
      <ScaleToggle
        label="%"
        title={percentageScale ? "Percentage scale: on" : "Percentage scale: off"}
        active={percentageScale}
        onClick={onTogglePercentageScale}
      />
      <ScaleToggle
        label="Stats"
        title={showBacktestStats ? "Hide backtest stats" : "Show backtest stats"}
        active={showBacktestStats}
        onClick={onToggleBacktestStats}
      />
      <IconToggle
        title={scannerHighlightTitle}
        active={scannerHighlightsVisible}
        icon={scannerHighlightsVisible ? Eye : EyeOff}
        onClick={onToggleScannerHighlights}
      />
    </div>
  );
}
