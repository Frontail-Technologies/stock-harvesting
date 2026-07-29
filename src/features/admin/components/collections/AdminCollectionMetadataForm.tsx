"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminMarketCollection } from "@/features/market-collections";
import { useUpdateAdminMarketCollection } from "../../hooks/use-admin-market-collections";

export function AdminCollectionMetadataForm({
  collection,
}: {
  collection: AdminMarketCollection;
}) {
  const updateMutation = useUpdateAdminMarketCollection();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");

  const metadataIsDirty =
    name.trim() !== collection.name || description.trim() !== (collection.description ?? "");

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:col-span-2">
      <h2 className="text-sm font-semibold text-foreground">Collection metadata</h2>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Name</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          placeholder="Optional notes about this collection"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={!metadataIsDirty || !name.trim() || updateMutation.isPending}
          onClick={() =>
            updateMutation.mutate({
              id: collection.id,
              name: name.trim(),
              description: description.trim() || null,
            })
          }
        >
          {updateMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Save changes
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate({ id: collection.id, active: !collection.active })}
        >
          {collection.active ? "Deactivate collection" : "Activate collection"}
        </Button>

        {updateMutation.isError ? (
          <span className="text-xs text-danger">Couldn&apos;t save changes.</span>
        ) : null}
      </div>
    </section>
  );
}
