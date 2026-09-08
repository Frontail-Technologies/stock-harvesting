"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useImportAdminBulkImportFile } from "../../../hooks/use-admin-market-collections";
import { cn } from "@/utils/cn";
import type { QueueItem } from "./types";

export type RowResult = {
  state: "waiting" | "importing" | "imported" | "partial" | "failed";
  matchedCount?: number;
  unmatchedSymbols?: string[];
  errorMessage?: string;
};

function RowStatusIcon({ state }: { state: RowResult["state"] }) {
  if (state === "importing") return <Loader2 className="size-4 shrink-0 animate-spin text-primary" />;
  if (state === "imported") return <CheckCircle2 className="size-4 shrink-0 text-success" />;
  if (state === "partial") return <AlertTriangle className="size-4 shrink-0 text-warning" />;
  if (state === "failed") return <XCircle className="size-4 shrink-0 text-danger" />;
  return <span className="size-4 shrink-0" />;
}

function rowLabel(state: RowResult["state"]) {
  switch (state) {
    case "importing":
      return "Importing...";
    case "imported":
      return "Imported";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    default:
      return "Waiting";
  }
}

export function BulkImportProgress({
  items,
  effectiveFrom,
  onComplete,
  onRowClick,
}: {
  items: QueueItem[];
  effectiveFrom: string;
  onComplete: (results: Record<string, RowResult>) => void;
  onRowClick: (item: QueueItem, result: RowResult) => void;
}) {
  const importMutation = useImportAdminBulkImportFile();
  const [results, setResults] = useState<Record<string, RowResult>>(() =>
    Object.fromEntries(items.map((item) => [item.id, { state: "waiting" as const }]))
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const activeRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const finalResults: Record<string, RowResult> = {};
      for (let index = 0; index < items.length; index += 1) {
        if (cancelled) return;
        const item = items[index];
        setActiveIndex(index);
        setResults((current) => ({ ...current, [item.id]: { state: "importing" } }));

        try {
          const csvContent = await item.file.text();
          const { report } = await importMutation.mutateAsync({
            exchange: "BSE",
            filename: item.file.name,
            csvContent,
            effectiveFrom,
          });
          const issueCount = report.unmatched.length + report.invalid.length;
          const state: RowResult["state"] =
            report.matched.length === 0 && issueCount > 0 ? "failed" : issueCount > 0 ? "partial" : "imported";
          const result: RowResult = { state, matchedCount: report.matched.length, unmatchedSymbols: report.unmatched };
          finalResults[item.id] = result;
          if (!cancelled) setResults((current) => ({ ...current, [item.id]: result }));
        } catch (error) {
          const result: RowResult = {
            state: "failed",
            errorMessage: error instanceof Error ? error.message : "Import failed.",
          };
          finalResults[item.id] = result;
          if (!cancelled) setResults((current) => ({ ...current, [item.id]: result }));
        }
      }
      if (!cancelled) {
        setIsDone(true);
        onComplete(finalResults);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = Object.values(results).filter(
    (result) => result.state !== "waiting" && result.state !== "importing"
  ).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const importedCount = Object.values(results).filter((result) => result.state === "imported").length;
  const partialCount = Object.values(results).filter((result) => result.state === "partial").length;
  const failedCount = Object.values(results).filter((result) => result.state === "failed").length;

  return (
    <div className="flex flex-col gap-4">
      {isDone ? (
        <div>
          <p className="text-base font-semibold text-foreground">Import Complete</p>
          <p className="mt-1 text-sm text-muted-foreground">{items.length} collections processed</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-success">{importedCount} Imported</span>
            {partialCount > 0 && <span className="text-warning">{partialCount} Partial</span>}
            {failedCount > 0 && <span className="text-danger">{failedCount} Failed</span>}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-foreground">Importing Collections</p>
            <span className="text-sm tabular-nums text-muted-foreground">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="mt-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {completedCount} of {items.length} collections
          </p>
        </div>
      )}

      <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {items.map((item, index) => {
          const result = results[item.id] ?? { state: "waiting" as const };
          return (
            <motion.div
              key={item.id}
              ref={index === activeIndex ? activeRowRef : undefined}
              layout
              onClick={() => result.state !== "waiting" && result.state !== "importing" && onRowClick(item, result)}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2.5",
                (result.state === "partial" || result.state === "failed") && "cursor-pointer hover:bg-muted/40"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <RowStatusIcon state={result.state} />
                <span
                  className={cn(
                    "truncate text-sm",
                    result.state === "waiting" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {item.file.name}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{rowLabel(result.state)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
