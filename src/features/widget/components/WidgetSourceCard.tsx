"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ListX, MoreHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { colorForDashboardLabel, DashboardWidget, DashboardWidgetSkeleton } from "@/features/dashboard";
import { useCollectionRelativeStrength } from "@/features/market-collections";
import { useWatchlistRelativeStrength } from "@/features/watchlists";
import type { DashboardCardData, DashboardItem } from "@/types/dashboard";
import type { ResolvedWidgetSource } from "../types";

const RANKED_LIMIT = 50;

function formatAsOfDate(asOfDate: string | null): string {
  if (!asOfDate) return "";
  const parsed = new Date(`${asOfDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return `As of ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(parsed)}`;
}

type WidgetSourceCardProps = {
  source: ResolvedWidgetSource;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
};

// Renders a Segment or a Watchlist as a ranked snapshot using the exact
// same presentation Dashboard's Stock Harvest widget already uses
// (DashboardWidget) - both sources feed it the same ranked-row DTO the
// backend evaluator already produces, so there is no second ranking
// formula and no forked visual system here.
export function WidgetSourceCard({
  source,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onRemove,
}: WidgetSourceCardProps) {
  const router = useRouter();
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const isSegment = source.type === "segment";
  const isEmptyWatchlist = !isSegment && source.itemCount === 0;

  const segmentQuery = useCollectionRelativeStrength({
    code: isSegment ? source.code : "",
    limit: RANKED_LIMIT,
  });
  const watchlistQuery = useWatchlistRelativeStrength({
    id: !isSegment && !isEmptyWatchlist ? source.id : null,
    limit: RANKED_LIMIT,
  });

  const isLoading = isSegment ? segmentQuery.isLoading : watchlistQuery.isLoading;
  const metrics = isSegment ? segmentQuery.metrics : watchlistQuery.metrics;
  const asOfDate = isSegment ? segmentQuery.asOfDate : watchlistQuery.asOfDate;

  const handleItemClick = (item: DashboardItem) => {
    if (!item.exchange) return;
    router.push(`/charts?symbol=${encodeURIComponent(item.label)}&exchange=${encodeURIComponent(item.exchange)}`);
  };

  const card: DashboardCardData = useMemo(
    () => ({
      id: `${source.type}:${source.id}`,
      title: source.name,
      timestamp: formatAsOfDate(asOfDate),
      variant: "stockList",
      items: metrics.map(
        (row, index): DashboardItem => ({
          rank: index + 1,
          label: row.symbol,
          value: row.change55dPct,
          color: colorForDashboardLabel(row.symbol),
          exchange: row.exchange,
        })
      ),
      onItemClick: handleItemClick,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleItemClick is stable per render and rebuilding the memo on it would be pointless churn
    [source.type, source.id, source.name, isLoading, asOfDate, metrics]
  );

  const emptyState = isEmptyWatchlist ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
      <ListX className="size-5 text-muted-foreground/60" />
      <p className="text-xs font-medium text-muted-foreground">No stocks in this Watchlist.</p>
      <Link href="/watchlists" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Open Watchlist
      </Link>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
      <ListX className="size-5 text-muted-foreground/60" />
      <p className="text-xs font-medium text-muted-foreground">
        {isSegment ? "No stocks in this Segment." : "No ranked results available for this Watchlist yet."}
      </p>
    </div>
  );

  const headerActions = (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              aria-label={`${source.name} options`}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            />
          }
        >
          <MoreHorizontal className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{source.name} options</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem disabled={!canMoveLeft} onClick={onMoveLeft} className="gap-1.5">
          <ChevronLeft className="size-3.5" />
          Move Left
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMoveRight} onClick={onMoveRight} className="gap-1.5">
          <ChevronRight className="size-3.5" />
          Move Right
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          Remove from Widget
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Fixed height regardless of loading/row-count state - the raw
          DashboardWidget sizes to its content, so without this a card
          would visibly grow/shrink the instant real rows replace the
          loading skeleton or an empty result. Same min/max convention
          already used by the Watchlist widget cards. */}
      <div className="h-full min-h-104 max-h-112 overflow-hidden rounded-xl">
        {isLoading ? (
          <DashboardWidgetSkeleton title={source.name} offset={0} />
        ) : (
          <DashboardWidget
            card={card}
            onExpand={() => setFullViewOpen(true)}
            headerActions={headerActions}
            emptyState={emptyState}
          />
        )}
      </div>

      <Dialog open={fullViewOpen} onOpenChange={setFullViewOpen}>
        <DialogContent className="flex h-[85dvh] w-[min(96vw,900px)] max-w-[min(96vw,900px)] flex-col gap-0 p-2 pt-9 sm:max-w-[min(96vw,900px)]">
          <DialogTitle className="sr-only">{source.name}</DialogTitle>
          <div className="min-h-0 flex-1">
            <DashboardWidget card={card} expanded emptyState={emptyState} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
