"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/utils/cn";

type ToastVariant = "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: ToastItem[];
  push: (message: string, variant: ToastVariant) => void;
  dismiss: (id: number) => void;
};

let toastCounter = 0;
const TOAST_DURATION_MS = 3200;

// A small, self-contained toast store rather than a full notification
// system - this codebase has no toast primitive anywhere else, and the
// only current callers (chart snapshot copy/link actions) just need a
// brief, dismissible confirmation or error. `toast.success`/`toast.error`
// are plain functions (not hooks) so they can be called from inside async
// click handlers, not just component bodies.
const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant) =>
    set((state) => ({
      toasts: [...state.toasts, { id: ++toastCounter, message, variant }],
    })),
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push(message, "success"),
  error: (message: string) => useToastStore.getState().push(message, "error"),
};

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(item.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.id]);

  const Icon = item.variant === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-popover px-3 py-2 text-sm font-medium text-popover-foreground shadow-2xl ring-1 ring-foreground/10 duration-150 animate-in fade-in-0 slide-in-from-bottom-2"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          item.variant === "success" ? "text-primary" : "text-destructive"
        )}
      />
      <span>{item.message}</span>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  // No toast is ever pushed before hydration (nothing calls toast.* until a
  // user interacts with the page), so this never mismatches SSR output -
  // the `typeof document` check just guards createPortal from running
  // during server rendering, the same way AppHeader's mobile drawer does.
  if (typeof document === "undefined" || toasts.length === 0) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastRow item={item} />
        </div>
      ))}
    </div>,
    document.body
  );
}
