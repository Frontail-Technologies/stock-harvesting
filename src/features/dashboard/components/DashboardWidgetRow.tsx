"use client";

import type { DashboardCardData } from "@/types/dashboard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/utils/cn";
import { DASHBOARD_WIDGET_GRID_CLASS, useDashboardUiStore } from "../stores/dashboard-ui-store";
import { DashboardWidget } from "./DashboardWidget";

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

// Fixed, non-resizable grid for the 4 primary analysis widgets - the
// desktop column count (2 or 4 per row) is the one user-selectable
// setting (see dashboard-ui-store's `widgetColumns`); mobile/tablet always
// collapse per DASHBOARD_WIDGET_GRID_CLASS regardless of that selection.
export function DashboardWidgetRow({ cards }: { cards: DashboardCardData[] }) {
  const widgetColumns = useDashboardUiStore((state) => state.widgetColumns);
  const openExpandedPanel = useDashboardUiStore((state) => state.openExpandedPanel);

  return (
    <>
      <div className={cn("grid gap-4", DASHBOARD_WIDGET_GRID_CLASS[widgetColumns])}>
        {cards.map((card) => (
          <DashboardWidget key={card.id} card={card} onExpand={() => openExpandedPanel(card.id)} />
        ))}
      </div>
      <ExpandedWidgetDialog cards={cards} />
    </>
  );
}
