"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminPath } from "@/utils/seo";
import { countRawCsvRows } from "../../../lib/bulk-import/count-raw-csv-rows";
import { type CollectedFile } from "../../../lib/bulk-import/collect-dropped-files";
import { dedupeDiscoveredFiles, discoveredFileIdentityKey } from "../../../lib/bulk-import/dedupe-discovered-files";
import { normalizeBseCollectionFilename } from "../../../lib/bulk-import/derive-collection-identity";
import { filterCsvFiles } from "../../../lib/bulk-import/filter-csv-files";
import { findDuplicateCodeIds } from "../../../lib/bulk-import/find-duplicate-code-ids";
import type { DiscoveredFileDescriptor } from "../../../lib/bulk-import/types";
import { BulkImportConfirmStep } from "./BulkImportConfirmStep";
import { BulkImportDropzone, SUPPORTS_DIRECTORY_INPUT } from "./BulkImportDropzone";
import { BulkImportFileList } from "./BulkImportFileList";
import { BulkImportPreviewDialog } from "./BulkImportPreviewDialog";
import { BulkImportProgress, type RowResult } from "./BulkImportProgress";
import { BulkImportResultDetailsDialog } from "./BulkImportResultDetailsDialog";
import type { QueueItem } from "./types";

type Step = "dropzone" | "list" | "confirm" | "progress";
type Candidate = DiscoveredFileDescriptor & { file: File };

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function buildQueueItems(collected: CollectedFile[], existingKeys: Set<string>) {
  const candidates: Candidate[] = collected.map((entry) => ({
    name: entry.file.name,
    size: entry.file.size,
    lastModified: entry.file.lastModified,
    relativePath: entry.relativePath,
    file: entry.file,
  }));

  const { csvFiles, ignoredCount } = filterCsvFiles(candidates);
  const deduped = dedupeDiscoveredFiles(csvFiles).filter(
    (candidate) => !existingKeys.has(discoveredFileIdentityKey(candidate))
  );

  const newItems: QueueItem[] = await Promise.all(
    deduped.map(async (candidate) => {
      const text = await candidate.file.text();
      const rawRowCount = countRawCsvRows(text);
      const { name, code } = normalizeBseCollectionFilename(candidate.file.name);
      return {
        id: crypto.randomUUID(),
        file: candidate.file,
        relativePath: candidate.relativePath,
        name,
        code,
        rawRowCount,
        state: rawRowCount === 0 || name.length === 0 ? ("invalid" as const) : ("ready" as const),
      };
    })
  );

  return { newItems, csvFileCount: csvFiles.length, ignoredCount };
}

function withDuplicateCodeMarking(items: QueueItem[]): QueueItem[] {
  const markableItems = items.filter((item) => item.state === "ready" || item.state === "duplicate_code");
  const duplicateIds = findDuplicateCodeIds(markableItems);

  return items.map((item) => {
    if (item.state !== "ready" && item.state !== "duplicate_code") return item;
    return { ...item, state: duplicateIds.has(item.id) ? "duplicate_code" : "ready" };
  });
}

export function AdminBulkImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("dropzone");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [discoveryNote, setDiscoveryNote] = useState<string | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState(todayDateString());
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);
  const [isImportDone, setIsImportDone] = useState(false);
  const [detailsSelection, setDetailsSelection] = useState<{ item: QueueItem; result: RowResult } | null>(null);

  const readyItems = items.filter((item) => item.state === "ready");

  const handleFilesSelected = async (collected: CollectedFile[]) => {
    const existingKeys = new Set(
      items.map((item) =>
        discoveredFileIdentityKey({
          name: item.file.name,
          size: item.file.size,
          lastModified: item.file.lastModified,
          relativePath: item.relativePath,
        })
      )
    );
    const { newItems, csvFileCount, ignoredCount } = await buildQueueItems(collected, existingKeys);

    setItems((current) => withDuplicateCodeMarking([...current, ...newItems]));
    setDiscoveryNote(
      ignoredCount > 0 ? `${csvFileCount} CSV files found · ${ignoredCount} unsupported files ignored` : null
    );
    setStep("list");
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void handleFilesSelected(files.map((file) => ({ file, relativePath: file.webkitRelativePath || file.name })));
  };

  const handleReset = () => {
    setStep("dropzone");
    setItems([]);
    setDiscoveryNote(null);
    setIsImportDone(false);
    setEffectiveFrom(todayDateString());
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(adminPath("/admin/market-collections"))}
          className="-ml-2 gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Bulk Import Collections</h1>
        {step === "dropzone" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Upload CSV files or drop a folder containing CSV files.
          </p>
        )}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        {step === "dropzone" && (
          <BulkImportDropzone
            onFilesSelected={(files) => void handleFilesSelected(files)}
            onBrowseFiles={() => fileInputRef.current?.click()}
            onBrowseFolder={() => folderInputRef.current?.click()}
          />
        )}

        {step === "list" && (
          <BulkImportFileList
            items={items}
            discoveryNote={discoveryNote}
            onAddMore={() => fileInputRef.current?.click()}
            onRemove={(id) => setItems((current) => withDuplicateCodeMarking(current.filter((item) => item.id !== id)))}
            onPreview={setPreviewItem}
            onNext={() => setStep("confirm")}
          />
        )}

        {step === "confirm" && (
          <BulkImportConfirmStep
            items={readyItems}
            effectiveFrom={effectiveFrom}
            onEffectiveFromChange={setEffectiveFrom}
            onBack={() => setStep("list")}
            onImport={() => setStep("progress")}
          />
        )}

        {step === "progress" && (
          <>
            <BulkImportProgress
              items={readyItems}
              effectiveFrom={effectiveFrom}
              onComplete={() => setIsImportDone(true)}
              onRowClick={(item, result) => setDetailsSelection({ item, result })}
            />
            {isImportDone && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Import More
                </Button>
                <Link href={adminPath("/admin/market-collections")}>
                  <Button type="button">View Collections</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      {SUPPORTS_DIRECTORY_INPUT && (
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error - webkitdirectory is a non-standard attribute not in React's JSX typings
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      )}

      <BulkImportPreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />
      <BulkImportResultDetailsDialog
        item={detailsSelection?.item ?? null}
        result={detailsSelection?.result ?? null}
        onClose={() => setDetailsSelection(null)}
      />
    </div>
  );
}
