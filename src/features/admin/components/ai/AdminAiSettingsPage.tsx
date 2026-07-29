"use client";

import { useState } from "react";
import { KeyRound, Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminAiKeyStatus,
  useAdminAiSettings,
  useDeleteAdminAiKey,
  useUpdateAdminAiKey,
  useUpdateAdminAiSettings,
} from "../../hooks/use-admin-ai-settings";
import { AdminSelect } from "../users/AdminSelect";

export function AdminAiSettingsPage() {
  const aiSettingsQuery = useAdminAiSettings();
  const keyStatusQuery = useAdminAiKeyStatus();
  const updateMutation = useUpdateAdminAiSettings();
  const updateKeyMutation = useUpdateAdminAiKey();
  const deleteKeyMutation = useDeleteAdminAiKey();
  const currentModel = aiSettingsQuery.data?.aiSettings.model ?? "";
  const availableModels = aiSettingsQuery.data?.availableModels ?? [];
  const keyStatus = keyStatusQuery.data?.key;
  const [draftModel, setDraftModel] = useState<string | null>(null);
  const [draftApiKey, setDraftApiKey] = useState("");
  const selectedModel = draftModel ?? currentModel;
  const modelIsDirty = Boolean(draftModel) && draftModel !== currentModel;

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">AI Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage scanner AI model selection and provider key access.
        </p>
      </div>

      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Scanner AI model
            </h2>
          </div>

          {aiSettingsQuery.isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          ) : aiSettingsQuery.isError ? (
            <p className="mt-4 text-sm text-danger">Couldn&apos;t load AI settings.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <AdminSelect
                label="Model"
                value={selectedModel}
                onChange={setDraftModel}
                options={availableModels.map((model) => ({
                  value: model.code,
                  label: model.label,
                }))}
              />

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  disabled={!modelIsDirty || updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate(
                      { model: selectedModel },
                      { onSuccess: () => setDraftModel(null) }
                    )
                  }
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save
                </Button>

                {updateMutation.isSuccess && !modelIsDirty ? (
                  <Badge variant="outline" className="bg-card text-xs">
                    Saved
                  </Badge>
                ) : null}
                {updateMutation.isError ? (
                  <span className="text-xs text-danger">Couldn&apos;t save. Try again.</span>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Key management
              </h2>
            </div>
            {keyStatus ? (
              <Badge variant="outline" className="bg-card text-xs">
                {keyStatus.source === "stored"
                  ? "Stored"
                  : keyStatus.source === "env"
                  ? "Env"
                  : "Missing"}
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
              <div className="text-xs text-muted-foreground">Current key</div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {keyStatusQuery.isLoading
                  ? "Checking..."
                  : keyStatus?.hasKey
                  ? "Configured"
                  : "Not configured"}
              </div>
              {keyStatus?.updatedAt ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(keyStatus.updatedAt).toLocaleString()}
                </div>
              ) : null}
            </div>

            <Input
              type="password"
              value={draftApiKey}
              onChange={(event) => setDraftApiKey(event.target.value)}
              placeholder="Paste Gemini API key"
              autoComplete="off"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={!draftApiKey.trim() || updateKeyMutation.isPending}
                onClick={() =>
                  updateKeyMutation.mutate(
                    { apiKey: draftApiKey.trim() },
                    { onSuccess: () => setDraftApiKey("") }
                  )
                }
              >
                {updateKeyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save key
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={keyStatus?.source !== "stored" || deleteKeyMutation.isPending}
                onClick={() => deleteKeyMutation.mutate()}
              >
                {deleteKeyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Remove
              </Button>
            </div>

            {updateKeyMutation.isSuccess ? (
              <span className="text-xs text-success">Key saved.</span>
            ) : null}
            {updateKeyMutation.isError || deleteKeyMutation.isError ? (
              <span className="text-xs text-danger">Key update failed.</span>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
