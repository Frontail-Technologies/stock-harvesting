"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { previewAdminBulkImportFile } from "../../../api/admin-api";
import type { QueueItem } from "./types";

const PREVIEW_CONCURRENCY = 4;

type PreviewOutcome = { existingCollectionId: string | null; matchedCount: number; issueCount: number } | { error: true };

async function runWithConcurrency<T>(items: T[], concurrency: number, run: (item: T) => Promise<void>) {
  let index = 0;
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (index < items.length) {
        const item = items[index];
        index += 1;
        if (item !== undefined) await run(item);
      }
    })
  );
}

export function BulkImportConfirmStep({
  items,
  effectiveFrom,
  onEffectiveFromChange,
  onBack,
  onImport,
}: {
  items: QueueItem[];
  effectiveFrom: string;
  onEffectiveFromChange: (value: string) => void;
  onBack: () => void;
  onImport: () => void;
}) {
  const [outcomes, setOutcomes] = useState<Record<string, PreviewOutcome>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void runWithConcurrency(items, PREVIEW_CONCURRENCY, async (item) => {
      try {
        const csvContent = await item.file.text();
        const { report, existingCollectionId } = await previewAdminBulkImportFile({
          exchange: "BSE",
          filename: item.file.name,
          csvContent,
        });
        if (cancelled) return;
        setOutcomes((current) => ({
          ...current,
          [item.id]: {
            existingCollectionId,
            matchedCount: report.matched.length,
            issueCount: report.unmatched.length + report.invalid.length,
          },
        }));
      } catch {
        if (cancelled) return;
        setOutcomes((current) => ({ ...current, [item.id]: { error: true } }));
      }
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedOutcomes = Object.values(outcomes).filter(
    (outcome): outcome is Extract<PreviewOutcome, { existingCollectionId: string | null }> => !("error" in outcome)
  );
  const totalStocks = resolvedOutcomes.reduce((sum, outcome) => sum + outcome.matchedCount, 0);
  const filesWithIssues = resolvedOutcomes.filter((outcome) => outcome.issueCount > 0).length;
  const existingCount = resolvedOutcomes.filter((outcome) => outcome.existingCollectionId !== null).length;
  const newCount = resolvedOutcomes.filter((outcome) => outcome.existingCollectionId === null).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-base font-semibold text-foreground">Ready to import</p>
        {isLoading ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner size="sm" />
            Validating files...
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{items.length}</span> collections
            </p>
            <p>
              <span className="font-medium text-foreground">{totalStocks}</span> stocks across all CSV files
            </p>
            {filesWithIssues > 0 && (
              <p>
                <span className="font-medium text-foreground">{filesWithIssues}</span> file
                {filesWithIssues === 1 ? "" : "s"} contain unmatched/invalid rows
              </p>
            )}
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <p>
            Existing collections: <span className="font-medium text-foreground">{existingCount}</span> will be
            updated
          </p>
          <p>
            New collections: <span className="font-medium text-foreground">{newCount}</span> will be created
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-foreground">
          Effective from <span className="text-danger">*</span>
        </label>
        <Input
          type="date"
          value={effectiveFrom}
          onChange={(event) => onEffectiveFromChange(event.target.value)}
          className="max-w-48"
        />
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={isLoading || !effectiveFrom} onClick={onImport}>
          Import {items.length} Collections
        </Button>
      </div>
    </div>
  );
}
