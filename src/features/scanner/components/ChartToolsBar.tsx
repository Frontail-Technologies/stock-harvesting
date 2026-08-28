"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  MoreHorizontal,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";
import type { Stock } from "@/types/market";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  ToolbarMenuItem,
  ToolbarSection,
} from "../tools/chart-tool-types";
import type { DrawingController, ScannerChartType } from "../types";
import { ChartSnapshotMenu } from "./ChartSnapshotMenu";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { ScannerIconButton } from "./ScannerIconButton";
import { ShareMenu } from "./ShareMenu";

type ChartToolsBarProps = {
  drawing: DrawingController;
  stock: Stock;
  chartType: ScannerChartType;
  onChartTypeChange: (chartType: ScannerChartType) => void;
};

const MOBILE_PRIMARY_GROUP_IDS = ["select", "lines", "ruler"];

export function ChartToolsBar({
  drawing,
  stock,
  chartType,
  onChartTypeChange,
}: ChartToolsBarProps) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [mobileSheetGroupId, setMobileSheetGroupId] = useState<string | "more" | null>(null);
  const [flyoutTop, setFlyoutTop] = useState(56);
  const railRef = useRef<HTMLDivElement>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
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
  const mobilePrimaryGroups = groups.filter((group) =>
    MOBILE_PRIMARY_GROUP_IDS.includes(group.id)
  );
  const mobileSheetGroups =
    mobileSheetGroupId === "more"
      ? groups
      : groups.filter((group) => group.id === mobileSheetGroupId);

  useEffect(() => {
    if (!openGroupId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (railRef.current?.contains(target)) return;
      if (flyoutRef.current?.contains(target)) return;
      setOpenGroupId(null);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenGroupId(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroupId]);

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

  const selectMenuItem = (item: ToolbarMenuItem) => {
    if (item.kind === "tool") {
      drawing.setActiveTool(item.id);
    } else {
      runAction(item.id);
    }
    setOpenGroupId(null);
    setMobileSheetGroupId(null);
  };

  const renderMenuSections = (sections: ToolbarSection[], compact = false) =>
    sections.map((section) => (
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
                onClick={() => selectMenuItem(item)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 text-left font-semibold text-foreground transition-colors",
                  compact ? "h-11 text-sm" : "h-8 text-[0.8125rem]",
                  active && "bg-(--scanner-flyout-selected-bg) text-foreground",
                  !active && "cursor-pointer hover:bg-[var(--scanner-flyout-hover)]",
                  disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "shrink-0",
                    compact ? "size-4" : "size-3.5",
                    active && "text-primary"
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    ));

  return (
    <div
      ref={railRef}
      className="relative z-40 flex h-auto w-11 shrink-0 flex-col items-center gap-1 overflow-y-auto rounded-[3px] border-r border-border/60 bg-background px-0 py-2"
    >
      <div className="flex flex-col items-center gap-1 sm:hidden">
        <ChartTypeSelector value={chartType} onChange={onChartTypeChange} compact />
        <ChartSnapshotMenu stock={stock} compact className="sm:hidden" />
        <ShareMenu stock={stock} compact className="sm:hidden" />
        <Separator className="my-1 h-px w-6 bg-border" />
        {mobilePrimaryGroups.map((group) => (
          <ScannerIconButton
            key={group.id}
            label={getRailLabel(group)}
            icon={getRailIcon(group)}
            active={isGroupActive(group)}
            onClick={() => setMobileSheetGroupId(group.id)}
          />
        ))}
        <ScannerIconButton
          label="More tools"
          icon={MoreHorizontal}
          active={mobileSheetGroupId === "more"}
          onClick={() => setMobileSheetGroupId("more")}
        />
      </div>

      <div className="hidden flex-col items-center gap-1 sm:flex">
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
      </div>

      {openGroup && (
        <div
          ref={flyoutRef}
          className="fixed left-12 z-[9999] max-h-[min(34rem,calc(100dvh-1rem))] w-[min(16rem,calc(100vw-4rem))] overflow-y-auto rounded-lg border border-[var(--scanner-toolbar-border)] bg-[var(--scanner-flyout-bg)] p-1 shadow-2xl"
          style={{ top: flyoutTop }}
        >
          {renderMenuSections(openGroup.sections)}
        </div>
      )}

      <Sheet open={mobileSheetGroupId !== null} onOpenChange={(open) => !open && setMobileSheetGroupId(null)}>
        <SheetContent
          side="bottom"
          className="scanner-portal gap-3 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:hidden"
        >
          <SheetHeader>
            <SheetTitle>
              {mobileSheetGroupId === "more"
                ? "Tools"
                : mobileSheetGroups[0]?.label ?? "Tools"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex max-h-[65dvh] flex-col gap-3 overflow-y-auto pr-1">
            {mobileSheetGroups.map((group) => (
              <div key={group.id} className="rounded-md border border-border bg-background/35 p-1">
                {mobileSheetGroupId === "more" && (
                  <div className="px-2 pb-1 pt-1 text-xs font-bold text-foreground">
                    {group.label}
                  </div>
                )}
                {renderMenuSections(group.sections, true)}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
