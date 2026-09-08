"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useBulkDeleteAdminMarketCollections } from "../../hooks/use-admin-market-collections";

export function AdminBulkDeleteCollectionsDialog({
  open,
  onOpenChange,
  collectionIds,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionIds: string[];
  onDeleted?: () => void;
}) {
  const bulkDeleteMutation = useBulkDeleteAdminMarketCollections();
  const count = collectionIds.length;

  const handleOpenChange = (next: boolean) => {
    if (bulkDeleteMutation.isPending) return;
    onOpenChange(next);
    if (!next) bulkDeleteMutation.reset();
  };

  const handleDelete = () => {
    bulkDeleteMutation.mutate(collectionIds, {
      onSuccess: (data) => {
        onOpenChange(false);
        toast.success(`${data.deletedCount} collection${data.deletedCount === 1 ? "" : "s"} deleted`);
        onDeleted?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {count} collection{count === 1 ? "" : "s"}?</DialogTitle>
          <DialogDescription>
            This will permanently delete {count} collection{count === 1 ? "" : "s"}, their memberships/history,
            and their collection-specific backtests. Shared stock instruments and candles will remain untouched.
          </DialogDescription>
        </DialogHeader>

        {bulkDeleteMutation.isError ? (
          <p className="text-xs text-danger">
            {bulkDeleteMutation.error?.message ?? "Couldn't delete these segments."}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={bulkDeleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="gap-1.5"
            onClick={handleDelete}
            disabled={bulkDeleteMutation.isPending || count === 0}
          >
            {bulkDeleteMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete {count} Collection{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
