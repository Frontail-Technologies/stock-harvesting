"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePreviewAdminBulkImportFile } from "../../../hooks/use-admin-market-collections";
import { cn } from "@/utils/cn";
import type { QueueItem } from "./types";

const PREVIEW_ROW_LIMIT = 10;

type PreviewRow = { symbol: string; status: "Valid" | "Unmatched" | "Invalid" | "Duplicate" };

function PreviewDialogBody({ item }: { item: QueueItem }) {
  const previewMutation = usePreviewAdminBulkImportFile();
  const [readError, setReadError] = useState<string | null>(null);

  useEffect(() => {
    item.file
      .text()
      .then((csvContent) => {
        previewMutation.mutate({ exchange: "BSE", filename: item.file.name, csvContent });
      })
      .catch(() => setReadError("Couldn't read this file."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const report = previewMutation.data?.report;
  const rows: PreviewRow[] = report
    ? [
        ...report.matched.map((row) => ({ symbol: row.symbol, status: "Valid" as const })),
        ...report.unmatched.map((symbol) => ({ symbol, status: "Unmatched" as const })),
        ...report.invalid.map((symbol) => ({ symbol, status: "Invalid" as const })),
        ...report.duplicate.map((symbol) => ({ symbol, status: "Duplicate" as const })),
      ]
    : [];
  const visibleRows = rows.slice(0, PREVIEW_ROW_LIMIT);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item.file.name}</DialogTitle>
        <DialogDescription>
          Collection: {item.name} · {item.rawRowCount} rows
        </DialogDescription>
      </DialogHeader>

      {readError || previewMutation.isError ? (
        <p className="text-sm text-danger">
          {readError ?? previewMutation.error?.message ?? "This file couldn't be validated."}
        </p>
      ) : previewMutation.isPending || !report ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="sm" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No symbols found in this file.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-2 text-xs font-semibold text-muted-foreground">Symbol</TableHead>
                <TableHead className="h-8 px-2 text-right text-xs font-semibold text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row, index) => (
                <TableRow key={`${row.symbol}-${index}`} className="hover:bg-transparent">
                  <TableCell className="h-8 px-2 font-medium text-foreground">{row.symbol}</TableCell>
                  <TableCell className="h-8 px-2 text-right">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        row.status === "Valid" ? "text-success" : "text-muted-foreground"
                      )}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > PREVIEW_ROW_LIMIT && (
            <p className="text-center text-xs text-muted-foreground">
              Showing first {PREVIEW_ROW_LIMIT} rows of {rows.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}

export function BulkImportPreviewDialog({ item, onClose }: { item: QueueItem | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {item && <PreviewDialogBody key={item.id} item={item} />}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
