"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  Send,
  Trash2,
} from "lucide-react";
import type { Stock } from "@/types/market";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";
import {
  createToolbarGroups,
  toolbarRailIcons,
} from "../tools/chart-tool-config";
import { getCursorToolIcon } from "../tools/cursor-tool-config";
import type {
  ActionMenuItem,
  ToolMenuItem,
  ToolbarGroup,
} from "../tools/chart-tool-types";
import type { DrawingController } from "../types";
import type { Timeframe } from "../types";
import { AiSummaryButton } from "./AiSummaryButton";
import { ScannerIconButton } from "./ScannerIconButton";

type ChartToolsBarProps = {
  drawing: DrawingController;
  stock: Stock;
  timeframe: Timeframe;
  onScreenshot: () => void;
  onSend: () => void;
};

export function ChartToolsBar({
  drawing,
  stock,
  timeframe,
  onScreenshot,
  onSend,
}: ChartToolsBarProps) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(56);
  const hasSelectedDrawing = Boolean(drawing.selectedDrawingId);
  const canUseVisibility = drawing.drawings.length > 0;
  const visibilityIcon = drawing.allDrawingsHidden ? Eye : EyeOff;
  const visibilityLabel = drawing.allDrawingsHidden
    ? `Show All (${drawing.hiddenDrawingCount})`
    : `Hide All (${drawing.visibleDrawingCount})`;

  const groups = useMemo<ToolbarGroup[]>(
    () =>
      createToolbarGroups({
        crosshairActive: drawing.crosshairActive,
        magnetActive: drawing.magnetActive,
        hasSelectedDrawing,
        hasDrawings: drawing.drawings.length > 0,
      }),
    [
      drawing.crosshairActive,
      drawing.drawings.length,
      drawing.magnetActive,
      hasSelectedDrawing,
    ]
  );

  const openGroup = groups.find((group) => group.id === openGroupId) ?? null;

  const runAction = (id: ActionMenuItem["id"]) => {
    if (id === "crosshair") drawing.toggleCrosshair();
    if (id === "lock-selected") drawing.toggleSelectedLock();
    if (id === "hide-selected") drawing.toggleSelectedHidden();
    if (id === "magnet") drawing.toggleMagnet();
    if (id === "clear-drawings") drawing.clearDrawings();
  };

  const isGroupActive = (group: ToolbarGroup) =>
    group.toolIds.includes(drawing.activeTool) ||
    (group.id === "controls" && drawing.magnetActive);

  const getActiveToolItem = (group: ToolbarGroup): ToolMenuItem | null => {
    for (const section of group.sections) {
      for (const item of section.items) {
        if (item.kind === "tool" && item.id === drawing.activeTool) {
          return item;
        }
      }
    }
    return null;
  };

  const getRailIcon = (group: ToolbarGroup) => {
    const activeToolItem = getActiveToolItem(group);
    if (group.id === "select") return getCursorToolIcon(drawing.activeTool);
    return activeToolItem?.icon ?? toolbarRailIcons[group.id] ?? group.icon;
  };

  const getRailLabel = (group: ToolbarGroup) => {
    const activeToolItem = getActiveToolItem(group);
    return activeToolItem ? `${group.label}: ${activeToolItem.label}` : group.label;
  };

  return (
    <div className="relative z-40 flex h-auto w-11 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-border bg-background px-0 py-2">
      <div className="flex flex-col items-center gap-1 sm:hidden">
        <AiSummaryButton
          stock={stock}
          timeframe={timeframe}
          compact
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        />
        <ScannerIconButton
          label="Screenshot"
          icon={Camera}
          className="sm:hidden"
          onClick={onScreenshot}
        />
        <ScannerIconButton
          label="Send"
          icon={Send}
          className="sm:hidden"
          onClick={onSend}
        />
        <Separator className="my-1 h-px w-6 bg-border" />
      </div>

      {groups.map((group) => (
        <ScannerIconButton
          key={group.id}
          label={getRailLabel(group)}
          icon={getRailIcon(group)}
          active={isGroupActive(group)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const maxTop = Math.max(8, window.innerHeight - 360);
            setFlyoutTop(Math.min(Math.max(8, rect.top), maxTop));
            setOpenGroupId((current) => (current === group.id ? null : group.id));
          }}
        />
      ))}

      <Separator className="my-1 h-px w-6 bg-border" />

      <ScannerIconButton
        label="Undo"
        icon={RotateCcw}
        active={drawing.canUndo}
        className="hidden md:flex"
        onClick={drawing.undo}
      />
      <ScannerIconButton
        label="Redo"
        icon={RotateCw}
        active={drawing.canRedo}
        className="hidden md:flex"
        onClick={drawing.redo}
      />
      <ScannerIconButton
        label={visibilityLabel}
        icon={visibilityIcon}
        active={drawing.allDrawingsHidden}
        disabled={!canUseVisibility}
        onClick={drawing.toggleAllDrawingsVisibility}
      />
      <ScannerIconButton
        label="Delete"
        icon={Trash2}
        active={hasSelectedDrawing}
        className="hidden md:flex"
        onClick={drawing.deleteSelected}
      />

      {openGroup && (
        <div
          className="fixed left-12 z-[9999] max-h-[min(34rem,calc(100dvh-1rem))] w-[min(16rem,calc(100vw-4rem))] overflow-y-auto rounded-lg border border-[var(--scanner-toolbar-border)] bg-[var(--scanner-flyout-bg)] p-1 shadow-2xl"
          style={{ top: flyoutTop }}
        >
          {openGroup.sections.map((section) => (
            <div key={section.label} className="py-0.5">
              <div className="px-2 pb-0.5 pt-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.kind === "tool"
                      ? drawing.activeTool === item.id
                      : Boolean(item.active);
                  const disabled = item.kind === "action" && item.disabled;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (item.kind === "tool") {
                          drawing.setActiveTool(item.id);
                          setOpenGroupId(null);
                        } else {
                          runAction(item.id);
                          setOpenGroupId(null);
                        }
                      }}
                      className={cn(
                        "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-[0.8125rem] font-semibold text-foreground transition-colors",
                        active &&
                          "border border-[var(--scanner-flyout-selected-border)] bg-[var(--scanner-flyout-selected-bg)] text-foreground",
                        !active && "hover:bg-[var(--scanner-flyout-hover)]",
                        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
