"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScannerLookbackMultiplier } from "@/features/scanner/types";
import { useWeeklyStrongBacktestMembershipChanges } from "@/features/weekly-strong-backtest";
import type { WeeklyStrongBacktestMembershipChangeMember } from "@/features/weekly-strong-backtest";
import { cn } from "@/utils/cn";
import { formatMediumDate } from "../lib/format-as-of-date";
import { openChartInNewTab } from "../lib/open-chart-in-new-tab";

function MembershipChangeTable({
  title,
  count,
  previousWeekLabel,
  comparisonLabel,
  members,
  isLoading,
  isError,
  emptyTitle,
  tone,
  onRowClick,
}: {
  title: string;
  count: number;
  previousWeekLabel: string;
  comparisonLabel: string;
  members: WeeklyStrongBacktestMembershipChangeMember[];
  isLoading: boolean;
  isError: boolean;
  emptyTitle: string;
  tone: "in" | "out";
  onRowClick: (member: WeeklyStrongBacktestMembershipChangeMember) => void;
}) {
  const Icon = tone === "in" ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Icon className={cn("size-4", tone === "in" ? "text-success" : "text-danger")} />
          {title} ({count})
        </h3>
        {previousWeekLabel && (
          <p className="mt-0.5 text-xs text-muted-foreground" title={previousWeekLabel}>
            {comparisonLabel}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 w-12 px-3 text-right text-xs font-semibold text-muted-foreground">
                Sr. No.
              </TableHead>
              <TableHead className="h-8 px-3 text-xs font-semibold text-muted-foreground">
                Symbol
              </TableHead>
              <TableHead className="h-8 px-3 text-xs font-semibold text-muted-foreground">
                Stock Name
              </TableHead>
              <TableHead className="h-8 px-3 text-xs font-semibold text-muted-foreground">
                Exchange
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => (
              <TableRow
                key={`${member.exchange}:${member.symbol}`}
                onClick={() => onRowClick(member)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(member);
                  }
                }}
                tabIndex={0}
                role="button"
                className="cursor-pointer border-border/60 hover:bg-primary/5"
              >
                <TableCell className="h-10 px-3 text-right text-muted-foreground tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell className="h-10 px-3 font-semibold text-primary">{member.symbol}</TableCell>
                <TableCell className="h-10 max-w-40 truncate px-3 text-foreground">{member.name}</TableCell>
                <TableCell className="h-10 px-3 text-muted-foreground">{member.exchange}</TableCell>
              </TableRow>
            ))}

            {members.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading...
                    </span>
                  ) : isError ? (
                    "Couldn't load this list."
                  ) : (
                    <EmptyState size="compact" title={emptyTitle} className="py-0" />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function WeeklyStrongMembershipChanges({
  code,
  lookback,
}: {
  code: string;
  lookback: ScannerLookbackMultiplier;
}) {
  const {
    available,
    enteredStocks,
    exitedStocks,
    previousWeekEnding,
    inProgress,
    asOf,
    isLoading,
    isError,
  } = useWeeklyStrongBacktestMembershipChanges({ code, lookback });

  const handleRowClick = (member: WeeklyStrongBacktestMembershipChangeMember) => {
    openChartInNewTab(member.symbol, member.exchange, lookback);
  };

  const previousWeekLabel = !isLoading ? formatMediumDate(previousWeekEnding) : "";
  const comparisonLabel = inProgress
    ? `Live${asOf ? ` as of ${formatMediumDate(asOf)}` : ""} vs last completed week`
    : "vs previous week";
  const periodLabel = inProgress ? "This Week (Live)" : "This Week";

  if (!isLoading && !isError && !available) {
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <EmptyState
          size="compact"
          title="Weekly changes are not available for this result yet."
          className="py-2"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <MembershipChangeTable
        title={`Stocks In ${periodLabel}`}
        count={enteredStocks.length}
        previousWeekLabel={previousWeekLabel}
        comparisonLabel={comparisonLabel}
        members={enteredStocks}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No new stocks this week."
        tone="in"
        onRowClick={handleRowClick}
      />
      <MembershipChangeTable
        title={`Stocks Out ${periodLabel}`}
        count={exitedStocks.length}
        previousWeekLabel={previousWeekLabel}
        comparisonLabel={comparisonLabel}
        members={exitedStocks}
        isLoading={isLoading}
        isError={isError}
        emptyTitle="No stocks exited this week."
        tone="out"
        onRowClick={handleRowClick}
      />
    </div>
  );
}
