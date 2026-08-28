"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Eye, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CollectionVersionReplaceResult, CollectionVersionStatus } from "@/features/market-collections";
import { formatAdminDate } from "../../lib/admin-formatters";
import {
  useAdminCollectionVersionMembers,
  useAdminCollectionVersions,
  useReplaceAdminCollectionVersion,
} from "../../hooks/use-admin-market-collections";

function VersionStatusBadge({ status }: { status: CollectionVersionStatus }) {
  if (status === "current") {
    return (
      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
        Current
      </Badge>
    );
  }
  if (status === "scheduled") {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        Scheduled
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      Superseded
    </Badge>
  );
}

function VersionMembersDialog({
  collectionId,
  versionId,
  open,
  onOpenChange,
}: {
  collectionId: string;
  versionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const membersQuery = useAdminCollectionVersionMembers({
    id: open ? collectionId : null,
    versionId: open ? versionId : null,
  });
  const data = membersQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Version members{data ? ` — ${formatAdminDate(data.version.effectiveFrom)}` : ""}</DialogTitle>
          <DialogDescription>Immutable point-in-time snapshot. This list can never be edited directly.</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto rounded-[3px] border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 px-3 text-xs">Symbol</TableHead>
                <TableHead className="h-8 px-3 text-xs">Name</TableHead>
                <TableHead className="h-8 px-3 text-xs">Exchange</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.members ?? []).map((member) => (
                <TableRow key={member.instrumentId} className="border-border/60">
                  <TableCell className="px-3 font-medium text-foreground">{member.symbol}</TableCell>
                  <TableCell className="max-w-48 truncate px-3 text-muted-foreground">{member.name}</TableCell>
                  <TableCell className="px-3 text-muted-foreground uppercase">{member.exchange}</TableCell>
                </TableRow>
              ))}
              {membersQuery.isLoading && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReplaceVersionDialog({
  collectionId,
  versionId,
  effectiveFrom,
  open,
  onOpenChange,
}: {
  collectionId: string;
  versionId: string;
  effectiveFrom: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceMutation = useReplaceAdminCollectionVersion();
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [result, setResult] = useState<CollectionVersionReplaceResult | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setCsvContent(null);
      setResult(null);
      replaceMutation.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvContent(await file.text());
  };

  const handleSubmit = () => {
    if (!csvContent) return;
    replaceMutation.mutate(
      { id: collectionId, versionId, csvContent },
      { onSuccess: (data) => setResult(data) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correct version — {formatAdminDate(effectiveFrom)}</DialogTitle>
          <DialogDescription>
            Replaces this version&apos;s member snapshot only — its effective date never changes. Any
            historical backtest weeks already generated from the old snapshot will be invalidated and need
            rebuilding afterward.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Corrected CSV file</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="w-full text-sm text-muted-foreground file:mr-3 file:h-8 file:rounded-lg file:border file:border-input file:bg-transparent file:px-2.5 file:text-sm file:font-medium file:text-foreground"
              />
            </div>
            {replaceMutation.isError && (
              <p className="text-xs text-danger">{replaceMutation.error?.message ?? "Couldn't replace this version."}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-xs">
            <p className="text-foreground">
              Snapshot replaced — <span className="font-medium">{result.memberCount}</span> members.
            </p>
            {result.invalidatedWeeks.length > 0 ? (
              <p className="text-muted-foreground">
                {result.invalidatedWeeks.length} historical backtest week(s) were invalidated and need
                rebuilding via &quot;Rebuild Historical Backtest&quot; below.
              </p>
            ) : (
              <p className="text-muted-foreground">No historical backtest weeks referenced this version yet.</p>
            )}
            {result.unmatched.length > 0 && (
              <p className="text-danger">{result.unmatched.length} symbol(s) unmatched: {result.unmatched.join(", ")}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <Button type="button" disabled={!csvContent || replaceMutation.isPending} onClick={handleSubmit} className="gap-1.5">
              {replaceMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Replace snapshot
            </Button>
          ) : (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Read-only history (Effective From | Members | Source | Imported At |
// Status) plus a view-members action and an explicit, safeguarded
// replace/correction workflow (Phase D #14) - no direct editing of an
// already-created version's members from this table.
export function AdminCollectionVersionHistory({ collectionId }: { collectionId: string }) {
  const versionsQuery = useAdminCollectionVersions(collectionId);
  const versions = versionsQuery.data?.versions ?? [];
  const [viewingVersionId, setViewingVersionId] = useState<string | null>(null);
  const [replacingVersionId, setReplacingVersionId] = useState<string | null>(null);
  const replacingVersion = versions.find((version) => version.id === replacingVersionId) ?? null;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-sm">
      <h2 className="text-sm font-semibold text-foreground">Membership Version History</h2>

      {versionsQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No dated membership versions yet. Use &quot;Import CSV&quot; with an Effective From date to create
          one — this unlocks historically accurate point-in-time backtesting.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[3px] border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Effective From</TableHead>
                <TableHead className="text-xs">Members</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Imported At</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium text-foreground">{formatAdminDate(version.effectiveFrom)}</TableCell>
                  <TableCell>{version.memberCount}</TableCell>
                  <TableCell className="text-muted-foreground">{version.sourceName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatAdminDate(version.importedAt)}</TableCell>
                  <TableCell>
                    <VersionStatusBadge status={version.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setViewingVersionId(version.id)}
                      >
                        <Eye className="size-3.5" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => setReplacingVersionId(version.id)}
                      >
                        <RefreshCw className="size-3.5" />
                        Correct
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <VersionMembersDialog
        collectionId={collectionId}
        versionId={viewingVersionId}
        open={viewingVersionId !== null}
        onOpenChange={(open) => !open && setViewingVersionId(null)}
      />

      {replacingVersion && (
        <ReplaceVersionDialog
          collectionId={collectionId}
          versionId={replacingVersion.id}
          effectiveFrom={replacingVersion.effectiveFrom}
          open
          onOpenChange={(open) => !open && setReplacingVersionId(null)}
        />
      )}
    </section>
  );
}
