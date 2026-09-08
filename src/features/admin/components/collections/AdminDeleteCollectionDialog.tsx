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
import { useDeleteAdminMarketCollection } from "../../hooks/use-admin-market-collections";

export function AdminDeleteCollectionDialog({
  open,
  onOpenChange,
  collection,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: { id: string; name: string } | null;
  onDeleted?: () => void;
}) {
  const deleteMutation = useDeleteAdminMarketCollection();

  const handleOpenChange = (next: boolean) => {
    if (deleteMutation.isPending) return;
    onOpenChange(next);
    if (!next) deleteMutation.reset();
  };

  const handleDelete = () => {
    if (!collection) return;
    deleteMutation.mutate(collection.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Collection deleted");
        onDeleted?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {collection?.name ?? "this segment"}?</DialogTitle>
          <DialogDescription>
            This will permanently remove the collection, its membership history and backtest results.
            Stock instruments and candle data will not be deleted.
          </DialogDescription>
        </DialogHeader>

        {deleteMutation.isError ? (
          <p className="text-xs text-danger">
            {deleteMutation.error?.message ?? "Couldn't delete this segment."}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="gap-1.5"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
