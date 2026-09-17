"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, type SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useMarketCollections,
  type MarketCollection,
} from "@/features/market-collections";
import { cn } from "@/utils/cn";
import { getCountryDisplay } from "../constants/dashboard-countries";
import {
  DASHBOARD_WIDGET_COLUMNS_OPTIONS,
  useDashboardUiStore,
  type DashboardWidgetColumns,
} from "../stores/dashboard-ui-store";
import { DashboardEmptyIllustration } from "./DashboardEmptyIllustration";
import { DashboardGridSkeleton } from "./DashboardWidgetSkeleton";
import { DashboardSegmentContent } from "./DashboardSegmentContent";

const WIDGET_COLUMNS_OPTIONS: SelectOption[] =
  DASHBOARD_WIDGET_COLUMNS_OPTIONS.map((columns) => ({
    value: String(columns),
    label: `${columns} per row`,
  }));

export function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  const countryParam = searchParams.get("country");
  const segmentParam = searchParams.get("segment");

  const collectionsQuery = useMarketCollections({});
  const allCollections = collectionsQuery.collections;

  const widgetColumns = useDashboardUiStore((state) => state.widgetColumns);
  const setWidgetColumns = useDashboardUiStore(
    (state) => state.setWidgetColumns,
  );

  const availableCountryCodes = [
    ...new Set(allCollections.map((c) => c.countryCode)),
  ].sort();
  const countryCode =
    (countryParam && availableCountryCodes.includes(countryParam)
      ? countryParam
      : null) ??
    availableCountryCodes[0] ??
    null;

  const collections = countryCode
    ? allCollections.filter(
        (collection) => collection.countryCode === countryCode,
      )
    : ([] as MarketCollection[]);

  const requestedSegment = segmentParam
    ? collections.find((collection) => collection.code === segmentParam)
    : undefined;
  const effectiveSegment = requestedSegment ?? collections[0] ?? null;

  const updateParams = (next: { country: string; segment?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", next.country);
    if (next.segment) {
      params.set("segment", next.segment);
    } else {
      params.delete("segment");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (collectionsQuery.isLoading || !countryCode) return;
    if (
      countryParam === countryCode &&
      segmentParam === (effectiveSegment?.code ?? null)
    ) {
      return;
    }
    updateParams({ country: countryCode, segment: effectiveSegment?.code });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the resolved identity actually changes, not on every params/router identity change
  }, [
    collectionsQuery.isLoading,
    countryCode,
    effectiveSegment?.code,
    countryParam,
    segmentParam,
  ]);

  const handleCountryChange = (nextCode: string) => {
    updateParams({ country: nextCode });
  };

  const handleSegmentChange = (nextCode: string) => {
    if (!countryCode) return;
    updateParams({ country: countryCode, segment: nextCode });
  };

  const updatedAtLabel = collectionsQuery.dataUpdatedAt
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(collectionsQuery.dataUpdatedAt)
    : null;

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    try {
      await Promise.all([
        collectionsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["market-collections"] }),
        queryClient.invalidateQueries({ queryKey: ["weekly-strong-backtest"] }),
        queryClient.invalidateQueries({ queryKey: ["market-data", "index-relative-strength"] }),
      ]);
    } finally {
      setIsManualRefresh(false);
    }
  };

  const isRefreshing = isManualRefresh || collectionsQuery.isFetching;

  return (
    <div className="flex flex-col gap-3 sm:gap-7">
      <div className="flex items-end justify-between gap-3 sm:flex-wrap sm:items-start sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            Dashboard
          </h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            Market strength and harvest review
          </p>
        </div>
        {updatedAtLabel && (
          <span className="mb-0.5 shrink-0 text-right text-[10px] leading-tight text-muted-foreground sm:mt-1 sm:mb-0 sm:text-xs">
            <span className="sm:hidden">Updated </span>
            <span className="hidden sm:inline">Last refreshed </span>
            {updatedAtLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_2.25rem] gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:p-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            Country
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={availableCountryCodes.length === 0}
              className="flex h-9 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground outline-none transition-colors hover:bg-primary/10 aria-expanded:bg-primary/10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-32 sm:rounded-lg sm:px-3 sm:text-sm sm:hover:bg-muted/50 sm:aria-expanded:bg-muted/50 dark:bg-input/30"
            >
              <span className="hidden size-5 shrink-0 items-center justify-center rounded-[4px] bg-muted text-[9px] font-bold tracking-wide text-muted-foreground uppercase tabular-nums sm:flex">
                {countryCode ?? "—"}
              </span>
              <span className="min-w-0 flex-1 truncate text-left">
                {countryCode
                  ? getCountryDisplay(countryCode).label
                  : "No markets"}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-32">
              {availableCountryCodes.map((code) => {
                const display = getCountryDisplay(code);
                return (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => handleCountryChange(code)}
                    className="gap-2"
                  >
                    {code === countryCode ? (
                      <Check className="size-3.5" />
                    ) : (
                      <span className="size-3.5" />
                    )}
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-[4px] bg-muted text-[9px] font-bold tracking-wide text-muted-foreground uppercase tabular-nums">
                      {code}
                    </span>
                    {display.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            Segment
          </span>
          <Select
            value={effectiveSegment?.code ?? ""}
            onValueChange={handleSegmentChange}
            disabled={collectionsQuery.isLoading || collections.length === 0}
            placeholder={
              collectionsQuery.isLoading ? "Loading..." : "Select a segment"
            }
            options={collections.map((collection) => ({
              value: collection.code,
              label: collection.name,
            }))}
            triggerClassName={cn("h-9 w-full rounded-md px-2 text-xs sm:w-auto sm:min-w-48 sm:rounded-lg sm:px-3 sm:text-sm")}
          />
        </div>

        <div className="hidden min-w-0 flex-col gap-1.5 sm:flex">
          <span className="hidden text-xs font-medium text-muted-foreground sm:block">
            View
          </span>
          <Select
            value={String(widgetColumns)}
            onValueChange={(value) =>
              setWidgetColumns(Number(value) as DashboardWidgetColumns)
            }
            options={WIDGET_COLUMNS_OPTIONS}
            triggerClassName="h-9 w-full rounded-md px-2 text-xs sm:w-32 sm:rounded-lg sm:px-3 sm:text-sm"
          />
        </div>

        <div className="flex items-end sm:contents">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 gap-1.5 p-0 sm:ml-auto sm:w-auto sm:px-3"
            disabled={isRefreshing}
            onClick={() => void handleRefresh()}
            aria-label={isRefreshing ? "Refreshing dashboard" : "Refresh dashboard"}
            title={isRefreshing ? "Refreshing" : "Refresh"}
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">{isRefreshing ? "Refreshing" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {collectionsQuery.isLoading ? (
        <DashboardGridSkeleton />
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            illustration={<DashboardEmptyIllustration />}
            title="No segments available for this market."
          />
        </div>
      ) : effectiveSegment ? (
        <DashboardSegmentContent
          key={effectiveSegment.code}
          code={effectiveSegment.code}
          exchange={effectiveSegment.exchange}
        />
      ) : null}
    </div>
  );
}
