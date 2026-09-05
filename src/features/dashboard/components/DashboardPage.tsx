"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useMarketCollections, type MarketCollection } from "@/features/market-collections";
import { cn } from "@/utils/cn";
import { getCountryDisplay } from "../constants/dashboard-countries";
import { DashboardEmptyIllustration } from "./DashboardEmptyIllustration";
import { DashboardGridSkeleton } from "./DashboardWidgetSkeleton";
import { DashboardSegmentContent } from "./DashboardSegmentContent";

export function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const countryParam = searchParams.get("country");
  const segmentParam = searchParams.get("segment");

  const collectionsQuery = useMarketCollections({});
  const allCollections = collectionsQuery.collections;

  const availableCountryCodes = [...new Set(allCollections.map((c) => c.countryCode))].sort();
  const countryCode =
    (countryParam && availableCountryCodes.includes(countryParam) ? countryParam : null) ??
    availableCountryCodes[0] ??
    null;

  const collections = countryCode
    ? allCollections.filter((collection) => collection.countryCode === countryCode)
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
    if (countryParam === countryCode && segmentParam === (effectiveSegment?.code ?? null)) {
      return;
    }
    updateParams({ country: countryCode, segment: effectiveSegment?.code });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the resolved identity actually changes, not on every params/router identity change
  }, [collectionsQuery.isLoading, countryCode, effectiveSegment?.code, countryParam, segmentParam]);

  const handleCountryChange = (nextCode: string) => {
    updateParams({ country: nextCode });
  };

  const handleSegmentChange = (nextCode: string) => {
    if (!countryCode) return;
    updateParams({ country: countryCode, segment: nextCode });
  };

  const updatedAtLabel = collectionsQuery.dataUpdatedAt
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
        collectionsQuery.dataUpdatedAt
      )
    : null;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Market strength and harvest review</p>
        </div>
        {updatedAtLabel && (
          <span className="mt-1 text-xs text-muted-foreground">Updated {updatedAtLabel}</span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Country</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={availableCountryCodes.length === 0}
              className="flex h-9 min-w-32 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/50 aria-expanded:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{countryCode ? getCountryDisplay(countryCode).flag : "🌐"}</span>
              <span className="flex-1 text-left">
                {countryCode ? getCountryDisplay(countryCode).label : "No markets"}
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-32">
              {availableCountryCodes.map((code) => {
                const display = getCountryDisplay(code);
                return (
                  <DropdownMenuItem key={code} onClick={() => handleCountryChange(code)} className="gap-2">
                    {code === countryCode ? <Check className="size-3.5" /> : <span className="size-3.5" />}
                    <span>{display.flag}</span>
                    {display.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Segment</span>
          <Select
            value={effectiveSegment?.code ?? ""}
            onValueChange={handleSegmentChange}
            disabled={collectionsQuery.isLoading || collections.length === 0}
            placeholder={collectionsQuery.isLoading ? "Loading..." : "Select a segment"}
            options={collections.map((collection) => ({
              value: collection.code,
              label: collection.name,
            }))}
            triggerClassName={cn("h-9 min-w-48")}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-9 gap-1.5"
          onClick={() => collectionsQuery.refetch()}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {collectionsQuery.isLoading ? (
        <DashboardGridSkeleton />
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            illustration={<DashboardEmptyIllustration />}
            title="No segments available for this market."
            description="Try a different market, or check back once data is available."
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
