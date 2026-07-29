"use client";

import { cn } from "@/utils/cn";

type ChartScaleControlsProps = {
  autoScale: boolean;
  percentageScale: boolean;
  onToggleAutoScale: () => void;
  onTogglePercentageScale: () => void;
};

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
      className={cn(
        "flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-[0.6875rem] font-semibold transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-(--scanner-toolbar-muted) hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function ChartScaleControls({
  autoScale,
  percentageScale,
  onToggleAutoScale,
  onTogglePercentageScale,
}: ChartScaleControlsProps) {
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
    </div>
  );
}
