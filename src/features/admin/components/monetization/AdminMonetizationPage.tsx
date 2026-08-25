"use client";

import { useMemo, useState } from "react";
import { Loader2, Megaphone, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdminAdPlacement, MonetizationMode } from "../../types";
import {
  useAdminMonetization,
  useUpdateAdminMonetizationPlacement,
  useUpdateAdminMonetizationSettings,
} from "../../hooks/use-admin-monetization";

const MODE_OPTIONS: { value: MonetizationMode; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "preview", label: "Preview" },
  { value: "live", label: "Live" },
];

function modeBadgeClassName(mode: MonetizationMode) {
  if (mode === "live") return "border-primary/30 bg-primary/10 text-primary";
  if (mode === "preview") return "border-border bg-card text-foreground";
  return "border-border bg-muted text-muted-foreground";
}

type PlacementStatus = { label: string; className: string };

function getPlacementStatus(
  mode: MonetizationMode,
  publisherId: string | null,
  enabled: boolean,
  slotId: string | null
): PlacementStatus {
  const muted = "border-border bg-muted text-muted-foreground";
  if (mode === "off") return { label: "Off", className: muted };
  if (!enabled) return { label: "Disabled", className: muted };
  if (mode === "preview") return { label: "Preview", className: "border-border bg-card text-foreground" };
  if (!publisherId) return { label: "Missing publisher ID", className: muted };
  if (!slotId) return { label: "Missing slot ID", className: muted };
  return { label: "Ready", className: "border-primary/30 bg-primary/10 text-primary" };
}

const PUBLISHER_ID_PATTERN = /^ca-pub-\d{10,20}$/;
const SLOT_ID_PATTERN = /^\d{6,20}$/;

type PlacementDraft = { enabled: boolean; slotId: string };

export function AdminMonetizationPage() {
  const query = useAdminMonetization();
  const updateSettings = useUpdateAdminMonetizationSettings();
  const updatePlacement = useUpdateAdminMonetizationPlacement();

  const [draftMode, setDraftMode] = useState<MonetizationMode | null>(null);
  const [draftPublisherId, setDraftPublisherId] = useState<string | null>(null);
  const [placementDrafts, setPlacementDrafts] = useState<Record<string, PlacementDraft>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const config = query.data;
  const currentMode = config?.mode ?? "off";
  const currentPublisherId = config?.publisherId ?? "";
  const mode = draftMode ?? currentMode;
  const publisherId = draftPublisherId ?? currentPublisherId;

  const placements: AdminAdPlacement[] = config?.placements ?? [];

  const effectivePlacement = (placement: AdminAdPlacement): PlacementDraft => {
    return (
      placementDrafts[placement.key] ?? {
        enabled: placement.enabled,
        slotId: placement.slotId ?? "",
      }
    );
  };

  const publisherIdError =
    publisherId.trim().length > 0 && !PUBLISHER_ID_PATTERN.test(publisherId.trim())
      ? "Publisher ID must look like ca-pub-XXXXXXXXXXXXXXX"
      : null;

  const liveNeedsPublisherId = mode === "live" && publisherId.trim().length === 0;

  const isDirty =
    draftMode !== null || draftPublisherId !== null || Object.keys(placementDrafts).length > 0;

  const placementSlotErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const placement of placements) {
      const draft = effectivePlacement(placement);
      const trimmedSlot = draft.slotId.trim();
      if (trimmedSlot.length > 0 && !SLOT_ID_PATTERN.test(trimmedSlot)) {
        errors[placement.key] = "Slot ID must be numeric";
      }
    }
    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, placementDrafts]);

  const hasBlockingErrors =
    Boolean(publisherIdError) || Object.keys(placementSlotErrors).length > 0;

  const updatePlacementDraft = (placement: AdminAdPlacement, patch: Partial<PlacementDraft>) => {
    setPlacementDrafts((current) => ({
      ...current,
      [placement.key]: { ...effectivePlacement(placement), ...patch },
    }));
  };

  const handleSave = async () => {
    if (hasBlockingErrors) return;
    setSaveError(null);
    setIsSaving(true);

    try {
      if (draftMode !== null || draftPublisherId !== null) {
        await updateSettings.mutateAsync({
          mode,
          publisherId: publisherId.trim() || null,
        });
      }

      for (const placement of placements) {
        const draft = placementDrafts[placement.key];
        if (!draft) continue;
        await updatePlacement.mutateAsync({
          key: placement.key,
          enabled: draft.enabled,
          slotId: draft.slotId.trim() || null,
        });
      }

      setDraftMode(null);
      setDraftPublisherId(null);
      setPlacementDrafts({});
      setSavedAt(Date.now());
    } catch {
      setSaveError("Couldn't save changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div>
        <p className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Monetization
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Ads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control where advertising appears across Stock Harvesting.
        </p>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : query.isError ? (
        <p className="text-sm text-danger">Couldn&apos;t load monetization settings.</p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Global status</h2>
              </div>
              <Badge variant="outline" className={modeBadgeClassName(mode)}>
                {MODE_OPTIONS.find((option) => option.value === mode)?.label}
              </Badge>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Mode</span>
              <Select
                value={mode}
                onValueChange={(value) => setDraftMode(value as MonetizationMode)}
                options={MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                triggerClassName="w-40"
              />
              {mode === "off" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No ads render anywhere. Safe default.
                </p>
              )}
              {mode === "preview" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Enabled placements show an internal placeholder only - no AdSense script loads.
                </p>
              )}
              {mode === "live" && liveNeedsPublisherId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Publisher ID is required before any placement can go live.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">AdSense configuration</h2>
            <div className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Publisher ID</span>
              <Input
                value={publisherId}
                onChange={(event) => setDraftPublisherId(event.target.value)}
                placeholder="ca-pub-________________"
                className="max-w-xs font-mono text-sm"
                aria-invalid={Boolean(publisherIdError)}
              />
              {publisherIdError && (
                <p className="text-xs text-danger">{publisherIdError}</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Placements</h2>
            <div className="mt-4 flex flex-col divide-y divide-border">
              {placements.map((placement) => {
                const draft = effectivePlacement(placement);
                const status = getPlacementStatus(mode, publisherId.trim() || null, draft.enabled, draft.slotId.trim() || null);
                const slotError = placementSlotErrors[placement.key];

                return (
                  <div key={placement.key} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{placement.label}</div>
                        <div className="text-xs text-muted-foreground">{placement.description}</div>
                      </div>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        Enabled
                        <Switch
                          checked={draft.enabled}
                          onCheckedChange={(checked) =>
                            updatePlacementDraft(placement, { enabled: checked })
                          }
                        />
                      </label>

                      <div className="flex flex-col gap-1">
                        <Input
                          value={draft.slotId}
                          onChange={(event) =>
                            updatePlacementDraft(placement, { slotId: event.target.value })
                          }
                          placeholder="Slot ID"
                          className="h-8 w-40 font-mono text-xs"
                          aria-invalid={Boolean(slotError)}
                        />
                        {slotError && <p className="text-xs text-danger">{slotError}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              className="gap-1.5"
              disabled={!isDirty || hasBlockingErrors || isSaving}
              onClick={handleSave}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save changes
            </Button>
            {!isDirty && savedAt && (
              <Badge variant="outline" className="bg-card text-xs">
                Saved
              </Badge>
            )}
            {saveError && <span className="text-xs text-danger">{saveError}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
