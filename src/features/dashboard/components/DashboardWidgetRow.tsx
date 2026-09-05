"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { DashboardCardData } from "@/types/dashboard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/utils/cn";
import {
  clampDashboardPanelWidth,
  DASHBOARD_PANEL_DEFAULT_WIDTH,
  DASHBOARD_PANEL_MIN_WIDTH,
  useDashboardUiStore,
} from "../stores/dashboard-ui-store";
import { DashboardWidget } from "./DashboardWidget";

const ROW_GAP_PX = 16;

function minimumRowWidthFor(panelCount: number) {
  return panelCount * DASHBOARD_PANEL_MIN_WIDTH + (panelCount - 1) * ROW_GAP_PX;
}

type PanelLayout = {
  card: DashboardCardData;
  width: number;
};

function computePanelLayout(
  cards: DashboardCardData[],
  panelWidths: Record<string, number>
): PanelLayout[] {
  return cards.map((card) => ({
    card,
    width: clampDashboardPanelWidth(panelWidths[card.id] ?? DASHBOARD_PANEL_DEFAULT_WIDTH),
  }));
}

function usePanelDrag(width: number, onCommit: (width: number) => void) {
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      const handleMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
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

function ResizablePanel({ card, width }: PanelLayout) {
  const setPanelWidth = useDashboardUiStore((state) => state.setPanelWidth);
  const openExpandedPanel = useDashboardUiStore((state) => state.openExpandedPanel);
  const resetPanelWidth = useDashboardUiStore((state) => state.resetPanelWidth);

  const handleCommitWidth = useCallback((next: number) => setPanelWidth(card.id, next), [card.id, setPanelWidth]);
  const { dragWidth, handlePointerDown } = usePanelDrag(width, handleCommitWidth);
  const renderedWidth = dragWidth ?? width;

  return (
    <div
      className="relative shrink-0"
      style={{ width: renderedWidth, transition: dragWidth === null ? "width 150ms ease" : undefined }}
    >
      <DashboardWidget card={card} onExpand={() => openExpandedPanel(card.id)} />

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${card.title} panel`}
        onPointerDown={handlePointerDown}
        onDoubleClick={() => resetPanelWidth(card.id)}
        className="absolute top-0 -right-2 z-10 h-full w-3 cursor-col-resize touch-none select-none"
      >
        <div className="mx-auto h-full w-px bg-transparent transition-colors hover:bg-primary/50" />
      </div>
    </div>
  );
}

function ExpandedWidgetDialog({ cards }: { cards: DashboardCardData[] }) {
  const expandedPanelId = useDashboardUiStore((state) => state.expandedPanelId);
  const closeExpandedPanel = useDashboardUiStore((state) => state.closeExpandedPanel);
  const expandedCard = cards.find((card) => card.id === expandedPanelId) ?? null;

  return (
    <Dialog
      open={Boolean(expandedCard)}
      onOpenChange={(open) => {
        if (!open) closeExpandedPanel();
      }}
    >
      <DialogContent
        className="flex h-[85dvh] w-[min(96vw,900px)] max-w-[min(96vw,900px)] flex-col gap-0 p-2 pt-9 sm:max-w-[min(96vw,900px)]"
      >
        {expandedCard && (
          <>
            <DialogTitle className="sr-only">{expandedCard.title}</DialogTitle>
            <div className="min-h-0 flex-1">
              <DashboardWidget card={expandedCard} expanded />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DashboardWidgetRow({ cards }: { cards: DashboardCardData[] }) {
  const panelWidths = useDashboardUiStore((state) => state.panelWidths);
  const openExpandedPanel = useDashboardUiStore((state) => state.openExpandedPanel);

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
      <>
        <div ref={rowRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <DashboardWidget key={card.id} card={card} onExpand={() => openExpandedPanel(card.id)} />
          ))}
        </div>
        <ExpandedWidgetDialog cards={cards} />
      </>
    );
  }

  const layout = computePanelLayout(cards, panelWidths);

  return (
    <>
      <div ref={rowRef} className={cn("flex flex-wrap items-stretch")} style={{ gap: ROW_GAP_PX }}>
        {layout.map((panel) => (
          <ResizablePanel key={panel.card.id} card={panel.card} width={panel.width} />
        ))}
      </div>
      <ExpandedWidgetDialog cards={cards} />
    </>
  );
}
