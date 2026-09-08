"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RowResult } from "./BulkImportProgress";
import type { QueueItem } from "./types";

export function BulkImportResultDetailsDialog({
  item,
  result,
  onClose,
}: {
  item: QueueItem | null;
  result: RowResult | null;
  onClose: () => void;
}) {
  const unmatchedSymbols = result?.unmatchedSymbols ?? [];

  return (
    <Dialog open={Boolean(item && result)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item?.file.name}</DialogTitle>
          <DialogDescription>{result?.state === "failed" ? "Import failed" : "Partial import"}</DialogDescription>
        </DialogHeader>

        {result?.errorMessage ? (
          <p className="text-sm text-danger">{result.errorMessage}</p>
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1 text-muted-foreground">
              <p>{item?.rawRowCount} CSV rows</p>
              <p>
                <span className="font-medium text-foreground">{result?.matchedCount ?? 0}</span> imported
              </p>
              <p>
                <span className="font-medium text-foreground">{unmatchedSymbols.length}</span> unmatched
              </p>
            </div>

            {unmatchedSymbols.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Unmatched:</p>
                <div className="mt-1 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {unmatchedSymbols.map((symbol) => (
                    <span
                      key={symbol}
                      className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
