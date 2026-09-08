"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueueItem } from "./types";

function StatusIcon({ state }: { state: QueueItem["state"] }) {
  if (state === "invalid") return <AlertCircle className="size-3.5 shrink-0 text-danger" />;
  if (state === "duplicate_code") return <AlertTriangle className="size-3.5 shrink-0 text-warning" />;
  return <CheckCircle2 className="size-3.5 shrink-0 text-success" />;
}

function statusLabel(state: QueueItem["state"]) {
  if (state === "duplicate_code") return "Duplicate code";
  if (state === "invalid") return "Invalid";
  return null;
}

export function BulkImportFileList({
  items,
  discoveryNote,
  onAddMore,
  onRemove,
  onPreview,
  onNext,
}: {
  items: QueueItem[];
  discoveryNote: string | null;
  onAddMore: () => void;
  onRemove: (id: string) => void;
  onPreview: (item: QueueItem) => void;
  onNext: () => void;
}) {
  const canProceed = items.some((item) => item.state === "ready");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          {items.length} CSV {items.length === 1 ? "file" : "files"} found
        </p>
        {discoveryNote && <p className="mt-0.5 text-xs text-muted-foreground">{discoveryNote}</p>}
      </div>

      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onPreview(item)}
            className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40"
          >
            <div className="flex min-w-0 items-center gap-2">
              <StatusIcon state={item.state} />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{item.file.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.name || "—"}
                  {statusLabel(item.state) && (
                    <span
                      className={item.state === "duplicate_code" ? "text-warning" : "text-danger"}
                    >
                      {" "}
                      · {statusLabel(item.state)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs tabular-nums text-muted-foreground">{item.rawRowCount} rows</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(item.id);
                }}
                aria-label={`Remove ${item.file.name}`}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={onAddMore} className="gap-1.5">
          <Plus className="size-3.5" />
          Add more files
        </Button>
        <Button type="button" size="sm" disabled={!canProceed} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
