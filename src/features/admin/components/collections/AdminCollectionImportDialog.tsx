"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CollectionImportReport, CollectionImportResult } from "@/features/market-collections";
import {
  useImportAdminCollectionCsv,
  usePreviewAdminCollectionImport,
} from "../../hooks/use-admin-market-collections";
import { AdminCollectionImportReportView } from "./AdminCollectionImportReport";

type Step = "upload" | "preview" | "result";

export function AdminCollectionImportDialog({ collectionId }: { collectionId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewMutation = usePreviewAdminCollectionImport();
  const importMutation = useImportAdminCollectionCsv();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [previewReport, setPreviewReport] = useState<CollectionImportReport | null>(null);
  const [resultReport, setResultReport] = useState<CollectionImportResult | null>(null);

  const resetAll = () => {
    setStep("upload");
    setFileName(null);
    setCsvContent(null);
    setSourceName("");
    setSourceDate("");
    setEffectiveFrom("");
    setPreviewReport(null);
    setResultReport(null);
    previewMutation.reset();
    importMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetAll();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFileName(file.name);
    setCsvContent(text);
  };

  const handleDryRun = () => {
    if (!csvContent) return;
    previewMutation.mutate(
      { id: collectionId, csvContent },
      {
        onSuccess: (data) => {
          setPreviewReport(data.report);
          setStep("preview");
        },
      }
    );
  };

  const handleConfirm = () => {
    if (!csvContent || !effectiveFrom) return;
    importMutation.mutate(
      {
        id: collectionId,
        csvContent,
        sourceName: sourceName.trim() || undefined,
        sourceDate: sourceDate || undefined,
        effectiveFrom,
      },
      {
        onSuccess: (data) => {
          setResultReport(data.report);
          setStep("result");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Upload className="size-3.5" />
            Import CSV
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import constituents"}
            {step === "preview" && "Dry-run preview"}
            {step === "result" && "Import complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a CSV of constituent symbols. First column is used; a header row is auto-detected."}
            {step === "preview" &&
              "Review the changes below before confirming. Nothing has been applied yet."}
            {step === "result" && "Membership has been synchronized."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">CSV file</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="w-full text-sm text-muted-foreground file:mr-3 file:h-8 file:rounded-lg file:border file:border-input file:bg-transparent file:px-2.5 file:text-sm file:font-medium file:text-foreground"
              />
              {fileName ? (
                <span className="text-xs text-muted-foreground">Selected: {fileName}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground">
                Effective from <span className="text-danger">*</span>
              </label>
              <Input
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
              <p className="text-[0.6875rem] text-muted-foreground">
                The date this constituent list becomes authoritative for historical backtesting. Confirming
                the import creates an immutable membership snapshot dated here — it can never be silently
                overwritten by a later upload.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Source name (optional)
              </label>
              <Input
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="e.g. NSE indices CSV"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Source date (optional)
              </label>
              <Input
                type="date"
                value={sourceDate}
                onChange={(event) => setSourceDate(event.target.value)}
              />
            </div>

            {previewMutation.isError ? (
              <p className="text-xs text-danger">
                {previewMutation.error?.message ?? "Couldn't run dry-run preview."}
              </p>
            ) : null}
          </div>
        )}

        {step === "preview" && previewReport && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Effective from <span className="font-medium text-foreground">{effectiveFrom}</span> — confirming
              will create a new immutable membership version dated here.
            </p>
            <AdminCollectionImportReportView report={previewReport} />
          </div>
        )}

        {step === "result" && resultReport && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-2.5 text-sm text-success">
              <CheckCircle2 className="size-4" />
              Membership synchronized successfully.
            </div>
            {(resultReport.invalidatedCurrentMembershipRuns > 0 ||
              resultReport.invalidatedHistoricalWeeks.length > 0) && (
              <div className="flex flex-col gap-1 rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs text-primary">
                {resultReport.invalidatedCurrentMembershipRuns > 0 && (
                  <p>
                    Active membership changed — the current-membership backtest ({resultReport.invalidatedCurrentMembershipRuns}{" "}
                    week(s)) was invalidated and needs regenerating below.
                  </p>
                )}
                {resultReport.invalidatedHistoricalWeeks.length > 0 && (
                  <p>
                    {resultReport.invalidatedHistoricalWeeks.length} historical-membership week(s) fell inside this
                    version&apos;s window and were invalidated — rebuild historical backtest below.
                  </p>
                )}
              </div>
            )}
            <AdminCollectionImportReportView report={resultReport} />
          </div>
        )}

        {importMutation.isError ? (
          <p className="text-xs text-danger">
            {importMutation.error?.message ?? "Couldn't import CSV."}
          </p>
        ) : null}

        <DialogFooter>
          {step === "upload" && (
            <Button
              type="button"
              className="gap-1.5"
              disabled={!csvContent || !effectiveFrom || previewMutation.isPending}
              onClick={handleDryRun}
            >
              {previewMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              Run dry-run preview
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={importMutation.isPending}
              >
                Back
              </Button>
              <Button
                type="button"
                className="gap-1.5"
                disabled={!effectiveFrom || importMutation.isPending}
                onClick={handleConfirm}
              >
                {importMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Confirm import
              </Button>
            </>
          )}

          {step === "result" && (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
