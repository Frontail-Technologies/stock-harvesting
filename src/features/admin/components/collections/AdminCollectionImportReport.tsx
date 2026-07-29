import { Badge } from "@/components/ui/badge";
import type { CollectionImportReport } from "@/features/market-collections";

function ReportSection({
  label,
  count,
  items,
  tone,
}: {
  label: string;
  count: number;
  items: string[];
  tone: "neutral" | "success" | "accent" | "danger";
}) {
  if (count === 0) return null;

  const toneClass =
    tone === "success"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "accent"
      ? "border-primary/30 bg-primary/10 text-primary"
      : tone === "danger"
      ? "border-danger/30 bg-danger/10 text-danger"
      : "bg-muted text-muted-foreground";

  return (
    <details className="rounded-lg border border-border bg-background/60 p-2.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <Badge variant="outline" className={toneClass}>
          {count}
        </Badge>
      </summary>
      <div className="mt-2 max-h-40 overflow-y-auto text-xs text-muted-foreground">
        {items.join(", ")}
      </div>
    </details>
  );
}

export function AdminCollectionImportReportView({ report }: { report: CollectionImportReport }) {
  const { summary } = report;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg border border-success/30 bg-success/10 p-2">
          <div className="text-base font-semibold text-success">{summary.toAddCount}</div>
          <div className="text-muted-foreground">New</div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-2">
          <div className="text-base font-semibold text-foreground">
            {summary.toReactivateCount}
          </div>
          <div className="text-muted-foreground">Reactivated</div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-2">
          <div className="text-base font-semibold text-foreground">
            {summary.alreadyActiveCount}
          </div>
          <div className="text-muted-foreground">Unchanged</div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-2">
          <div className="text-base font-semibold text-primary">
            {summary.toDeactivateCount}
          </div>
          <div className="text-muted-foreground">Deactivated</div>
        </div>
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-2">
          <div className="text-base font-semibold text-danger">{summary.unmatchedCount}</div>
          <div className="text-muted-foreground">Unmatched</div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 p-2">
          <div className="text-base font-semibold text-foreground">
            {summary.duplicateCount + summary.invalidCount}
          </div>
          <div className="text-muted-foreground">Skipped</div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <ReportSection
          label="Matched symbols"
          count={report.matched.length}
          items={report.matched.map((row) => row.symbol)}
          tone="success"
        />
        <ReportSection
          label="Unmatched symbols (not found in instruments)"
          count={report.unmatched.length}
          items={report.unmatched}
          tone="danger"
        />
        <ReportSection
          label="Will be deactivated"
          count={report.toDeactivate.length}
          items={report.toDeactivate.map((row) => row.symbol)}
          tone="accent"
        />
        <ReportSection
          label="Duplicate rows in file"
          count={report.duplicate.length}
          items={report.duplicate}
          tone="neutral"
        />
        <ReportSection
          label="Invalid rows"
          count={report.invalid.length}
          items={report.invalid}
          tone="neutral"
        />
      </div>
    </div>
  );
}
