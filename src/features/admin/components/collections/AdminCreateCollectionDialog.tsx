"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
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
import { DEFAULT_MARKET_EXCHANGE, useMarketExchanges } from "@/features/market";
import { useCreateAdminMarketCollection } from "../../hooks/use-admin-market-collections";
import { AdminSelect } from "../users/AdminSelect";

export function AdminCreateCollectionDialog() {
  const router = useRouter();
  const createMutation = useCreateAdminMarketCollection();
  const { exchanges } = useMarketExchanges();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [exchange, setExchange] = useState<string>(DEFAULT_MARKET_EXCHANGE);
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setCode("");
    setName("");
    setExchange(DEFAULT_MARKET_EXCHANGE);
    setDescription("");
    createMutation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        code: code.trim(),
        name: name.trim(),
        exchange,
        description: description.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setOpen(false);
          resetForm();
          router.push(`/admin/market-collections/${data.collection.id}`);
        },
      }
    );
  };

  const canSubmit = code.trim().length > 0 && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            New collection
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create collection</DialogTitle>
          <DialogDescription>
            Define collection metadata. Constituents are added afterward via CSV import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Code</label>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="NIFTY50"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="NIFTY 50"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Exchange</label>
            <AdminSelect
              label="Exchange"
              value={exchange}
              onChange={setExchange}
              options={exchanges.map((item) => ({
                value: item.code,
                label: `${item.name} (${item.code})`,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              placeholder="Optional notes about this collection"
            />
          </div>

          {createMutation.isError ? (
            <p className="text-xs text-danger">
              {createMutation.error?.message ?? "Couldn't create collection."}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="gap-1.5"
            disabled={!canSubmit || createMutation.isPending}
            onClick={handleSubmit}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
