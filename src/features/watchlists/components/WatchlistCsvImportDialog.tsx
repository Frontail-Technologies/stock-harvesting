"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { cn } from "@/utils/cn";
import { useBulkAddWatchlistItems } from "../hooks/use-watchlists";
import type { WatchlistSummary } from "../types";

type CsvItem = { symbol: string; exchange: string };

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseWatchlistCsv(content: string) {
  const rows = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseCsvLine);
  if (rows.length === 0) return { items: [] as CsvItem[], invalidRows: 0 };

  const header = rows[0].map((cell) => cell.toLowerCase());
  const symbolIndex = header.indexOf("symbol");
  const exchangeIndex = header.indexOf("exchange");
  const hasHeader = symbolIndex >= 0 || exchangeIndex >= 0;
  const symbolColumn = symbolIndex >= 0 ? symbolIndex : 0;
  const exchangeColumn = exchangeIndex >= 0 ? exchangeIndex : 1;
  const items: CsvItem[] = [];
  let invalidRows = 0;

  for (const row of rows.slice(hasHeader ? 1 : 0)) {
    const symbol = row[symbolColumn]?.trim().toUpperCase();
    const exchange = row[exchangeColumn]?.trim().toUpperCase();
    if (!symbol || !exchange || symbol.length > 64 || exchange.length > 16) {
      invalidRows += 1;
      continue;
    }
    items.push({ symbol, exchange });
  }

  return { items, invalidRows };
}

type WatchlistCsvImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlists: WatchlistSummary[];
};

export function WatchlistCsvImportDialog({
  open,
  onOpenChange,
  watchlists,
}: WatchlistCsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [watchlistId, setWatchlistId] = useState("");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<CsvItem[]>([]);
  const [invalidRows, setInvalidRows] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const bulkAdd = useBulkAddWatchlistItems();
  const selectedWatchlistId = watchlistId || watchlists[0]?.id || "";

  const reset = () => {
    setFileName("");
    setItems([]);
    setInvalidRows(0);
    setError(null);
    setIsDragging(false);
    bulkAdd.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setFileName("");
      setItems([]);
      setInvalidRows(0);
      setError("Please upload a CSV file.");
      return;
    }
    const parsed = parseWatchlistCsv(await file.text());
    setFileName(file.name);
    setItems(parsed.items);
    setInvalidRows(parsed.invalidRows);
    setError(parsed.items.length === 0 ? "No valid symbol and exchange rows were found." : null);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const downloadSample = () => {
    const blob = new Blob(["symbol,exchange\nRELIANCE,BSE\nTCS,BSE\nETERNAL,BSE\n"], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "watchlist-import-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!selectedWatchlistId || items.length === 0) return;
    setError(null);
    bulkAdd.mutate(
      { watchlistId: selectedWatchlistId, items },
      {
        onSuccess: (result) => {
          toast.success(
            `${result.added} ${result.added === 1 ? "stock" : "stocks"} added${result.skipped ? `, ${result.skipped} skipped` : ""}.`
          );
          handleOpenChange(false);
        },
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Couldn't import CSV.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Import watchlist CSV</DialogTitle>
          <DialogDescription>
            Upload up to 500 stocks using symbol and exchange columns.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Watchlist</label>
            <Select
              value={selectedWatchlistId}
              onValueChange={setWatchlistId}
              options={watchlists.map((watchlist) => ({
                value: watchlist.id,
                label: watchlist.name,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-foreground">CSV file</label>
              <Button type="button" variant="link" onClick={downloadSample} className="h-auto gap-1 p-0 text-xs">
                <Download className="size-3.5" />
                Download sample
              </Button>
            </div>
            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              className={cn(
                "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-input bg-muted/30 px-3 py-4 text-center transition-colors hover:bg-muted/50",
                isDragging && "border-primary bg-primary/10"
              )}
            >
              <FileSpreadsheet className={cn("size-5 text-muted-foreground", isDragging && "text-primary")} />
              <span className="text-xs font-medium text-foreground">
                {isDragging ? "Drop CSV here" : fileName || "Drag and drop CSV or choose file"}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground">symbol, exchange</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          {items.length > 0 && (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {items.length} valid {items.length === 1 ? "row" : "rows"}
              {invalidRows > 0 ? `, ${invalidRows} invalid skipped` : ""}
            </div>
          )}
          {items.length > 500 && (
            <p className="text-xs text-destructive">CSV files are limited to 500 stock rows.</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedWatchlistId || items.length === 0 || items.length > 500 || bulkAdd.isPending}
            className="gap-1.5"
          >
            {bulkAdd.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {bulkAdd.isPending ? "Importing..." : "Import stocks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
