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

// Text controls (Auto/%/Stats) use a neutral surface + a tiny bottom
// indicator for "selected" instead of yellow text - a whole label turning
// brand-yellow read as cheap/decorative rather than an intentional accent.
// Icon-only controls (the highlight-visibility eye) are the one place a
// yellow icon is fine, since the color reads as state on the glyph itself,
// not as body text.
function controlClass(active: boolean) {
  return cn(
    "relative flex h-6 min-w-6 cursor-pointer items-center justify-center rounded px-1.5 text-[0.6875rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    active
      ? "bg-muted text-foreground after:absolute after:inset-x-1.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
      : "text-(--scanner-toolbar-muted) hover:bg-muted hover:text-foreground"
  );
}

function iconControlClass(active: boolean) {
  return cn(
    "flex h-6 min-w-6 cursor-pointer items-center justify-center rounded px-1.5 text-[0.6875rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    active
      ? "bg-muted text-primary"
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
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={title}
        aria-pressed={active}
        onClick={onClick}
        className={controlClass(active)}
      >
        {label}
      </TooltipTrigger>
      <TooltipContent side="top" className="scanner-portal">
        {title}
      </TooltipContent>
    </Tooltip>
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
        type="button"
        aria-label={title}
        aria-pressed={active}
        onClick={onClick}
        className={iconControlClass(active)}
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
    <div className="flex shrink-0 items-center gap-0.5">
      <ScaleToggle
        label="Auto"
        title={autoScale ? "Turn off auto scale" : "Turn on auto scale"}
        active={autoScale}
        onClick={onToggleAutoScale}
      />
      <ScaleToggle
        label="%"
        title={percentageScale ? "Switch to price scale" : "Switch to percentage scale"}
        active={percentageScale}
        onClick={onTogglePercentageScale}
      />
      <ScaleToggle
        label="Stats"
        title={showBacktestStats ? "Hide performance stats" : "Show performance stats"}
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
