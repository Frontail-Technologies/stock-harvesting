"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DashboardCardData } from "@/types/dashboard";
import { cn } from "@/utils/cn";
import {
  clampDashboardPanelWidth,
  DASHBOARD_PANEL_DEFAULT_WIDTH,
  DASHBOARD_PANEL_MIN_WIDTH,
  useDashboardUiStore,
} from "../stores/dashboard-ui-store";
import { DashboardWidget, type DashboardWidgetPanelMode } from "./DashboardWidget";

const ROW_GAP_PX = 16; // matches the previous `gap-4` grid exactly

// Below this measured row width, 4 panels can't sit at their MINIMUM width
// side by side without overflowing - switch cleanly to the existing
// responsive stacked grid instead (item 6) rather than letting the row
// overflow horizontally or squeeze panels under their usable minimum.
function minimumRowWidthFor(panelCount: number) {
  return panelCount * DASHBOARD_PANEL_MIN_WIDTH + (panelCount - 1) * ROW_GAP_PX;
}

type PanelLayout = {
  card: DashboardCardData;
  width: number;
  mode: DashboardWidgetPanelMode;
};

// Resolves each panel's actual rendered width from the persisted
// preferences plus the current maximize state. Maximizing one panel gives
// it "substantially more available row width" (item 5) by shrinking every
// OTHER panel to its minimum and handing the maximized panel whatever's
// left of the measured row width - never hiding/removing the others.
function computePanelLayout(
  cards: DashboardCardData[],
  panelWidths: Record<string, number>,
  minimizedPanels: Record<string, boolean>,
  maximizedPanelId: string | null,
  rowWidth: number
): PanelLayout[] {
  if (maximizedPanelId && cards.some((card) => card.id === maximizedPanelId)) {
    const othersCount = cards.length - 1;
    const remaining = rowWidth - othersCount * DASHBOARD_PANEL_MIN_WIDTH - othersCount * ROW_GAP_PX;
    const maximizedWidth = Math.max(DASHBOARD_PANEL_MIN_WIDTH, remaining);
    return cards.map((card) => ({
      card,
      width: card.id === maximizedPanelId ? maximizedWidth : DASHBOARD_PANEL_MIN_WIDTH,
      mode: card.id === maximizedPanelId ? "maximized" : "normal",
    }));
  }

  return cards.map((card) => {
    if (minimizedPanels[card.id]) {
      return { card, width: DASHBOARD_PANEL_MIN_WIDTH, mode: "minimized" };
    }
    return {
      card,
      width: clampDashboardPanelWidth(panelWidths[card.id] ?? DASHBOARD_PANEL_DEFAULT_WIDTH),
      mode: "normal",
    };
  });
}

// One panel's own resize handle drag - mirrors the established
// scanner-ui-store.ts / ScannerWatchlistSidebar drag pattern (window-level
// pointermove/pointerup listeners, so the drag keeps tracking even if the
// pointer leaves the thin handle strip). Local `dragWidth` drives the
// rendered width during the drag itself; only the pointerup commits to the
// persisted store, so a drag that never mouses-up (e.g. cancelled) never
// writes anything.
function usePanelDrag(width: number, onCommit: (width: number) => void) {
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      const handleMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX; // handle is on the RIGHT edge - dragging right grows the panel
        setDragWidth(clampDashboardPanelWidth(startWidth + delta));
      };
      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        setDragWidth((current) => {
          if (current !== null) onCommit(current);
          return null;
        });
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [width, onCommit]
  );

  return { dragWidth, handlePointerDown };
}

function ResizablePanel({ card, width, mode }: PanelLayout) {
  const setPanelWidth = useDashboardUiStore((state) => state.setPanelWidth);
  const togglePanelMinimized = useDashboardUiStore((state) => state.togglePanelMinimized);
  const toggleMaximizedPanel = useDashboardUiStore((state) => state.toggleMaximizedPanel);
  const resetPanelWidth = useDashboardUiStore((state) => state.resetPanelWidth);

  const handleCommitWidth = useCallback((next: number) => setPanelWidth(card.id, next), [card.id, setPanelWidth]);
  const { dragWidth, handlePointerDown } = usePanelDrag(width, handleCommitWidth);
  const renderedWidth = dragWidth ?? width;
  // Free dragging only makes sense in "normal" mode - a minimized panel is
  // pinned to the minimum, and a maximized panel's width is computed from
  // the OTHER panels' minimums (see computePanelLayout), so dragging
  // either would fight that computation. The handle stays in the DOM (so
  // layout/spacing doesn't jump) but does nothing while disabled.
  const dragDisabled = mode !== "normal";

  return (
    <div
      className="relative shrink-0"
      style={{ width: renderedWidth, transition: dragWidth === null ? "width 150ms ease" : undefined }}
    >
      <DashboardWidget
        card={card}
        mode={mode}
        onToggleMinimize={() => togglePanelMinimized(card.id)}
        onToggleMaximize={() => toggleMaximizedPanel(card.id)}
      />
      {/* Subtle resize handle (item 3) - a narrow hit strip straddling the
          panel's right edge, not the whole border. Double-click resets
          this panel's width (item 9's "reset on double-click of resize
          handle" option) - kept as the only reset affordance so the
          header doesn't need a 4th icon just for this. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${card.title} panel`}
        onPointerDown={dragDisabled ? undefined : handlePointerDown}
        onDoubleClick={() => resetPanelWidth(card.id)}
        className={cn(
          "absolute top-0 -right-2 z-10 h-full w-3 touch-none select-none",
          dragDisabled ? "cursor-default" : "cursor-col-resize"
        )}
      >
        <div className="mx-auto h-full w-px bg-transparent transition-colors hover:bg-primary/50" />
      </div>
    </div>
  );
}

// The top 4 relative-strength/weekly-strong panels, resizable per item 2.
// Falls back to the ORIGINAL simple CSS-grid stacked layout (unchanged
// from before this pass) whenever the measured row can't fit all 4 panels
// at their minimum width - covers both "not measured yet" (containerWidth
// === 0, avoids a flash of the wrong layout) and genuinely narrow/mobile
// viewports (item 6). Only switches to the resizable flex row once there's
// real room for it.
export function DashboardWidgetRow({ cards }: { cards: DashboardCardData[] }) {
  const panelWidths = useDashboardUiStore((state) => state.panelWidths);
  const minimizedPanels = useDashboardUiStore((state) => state.minimizedPanels);
  const maximizedPanelId = useDashboardUiStore((state) => state.maximizedPanelId);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const rowRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setRowWidth(width);
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  const canFitResizableRow = rowWidth >= minimumRowWidthFor(cards.length);

  if (!canFitResizableRow) {
    return (
      <div ref={rowRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardWidget key={card.id} card={card} />
        ))}
      </div>
    );
  }

  const layout = computePanelLayout(cards, panelWidths, minimizedPanels, maximizedPanelId, rowWidth);

  return (
    // items-stretch (flexbox's own default, stated explicitly here) so
    // panels sharing a row equal-height the same way the original CSS
    // grid did (grid items stretch by default too) - DashboardWidget's
    // own `h-full` is what lets it actually fill that stretched height.
    // flex-wrap recomputes this per line, so a maximize-induced second
    // row still equal-heights independently, matching a grid's own
    // per-row behavior.
    <div ref={rowRef} className="flex flex-wrap items-stretch" style={{ gap: ROW_GAP_PX }}>
      {layout.map((panel) => (
        <ResizablePanel key={panel.card.id} card={panel.card} width={panel.width} mode={panel.mode} />
      ))}
    </div>
  );
}
