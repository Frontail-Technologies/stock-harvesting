"use client";

import { useState, type DragEvent } from "react";
import { FileSpreadsheet, FolderOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collectFilesFromDataTransferItems, type CollectedFile } from "../../../lib/bulk-import/collect-dropped-files";
import { cn } from "@/utils/cn";

export const SUPPORTS_DIRECTORY_INPUT =
  typeof HTMLInputElement !== "undefined" && "webkitdirectory" in HTMLInputElement.prototype;

export function BulkImportDropzone({
  onFilesSelected,
  onBrowseFiles,
  onBrowseFolder,
}: {
  onFilesSelected: (files: CollectedFile[]) => void;
  onBrowseFiles: () => void;
  onBrowseFolder: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const collected = await collectFilesFromDataTransferItems(event.dataTransfer.items);
    onFilesSelected(collected);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => void handleDrop(event)}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-muted/20 px-6 py-16 text-center transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <Upload className="size-6 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">Upload CSV files</p>
        <p className="mt-1 text-xs text-muted-foreground">Drag files or an entire folder here</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBrowseFiles}>
          <FileSpreadsheet className="size-3.5" />
          Browse files
        </Button>
        {SUPPORTS_DIRECTORY_INPUT && (
          <Button type="button" variant="outline" size="sm" onClick={onBrowseFolder}>
            <FolderOpen className="size-3.5" />
            Browse folder
          </Button>
        )}
      </div>

      <p className="text-[0.6875rem] text-muted-foreground">.csv files only</p>
    </div>
  );
}
