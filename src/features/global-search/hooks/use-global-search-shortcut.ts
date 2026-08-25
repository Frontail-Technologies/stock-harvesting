"use client";

import { useEffect } from "react";

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// Ctrl+K (or Cmd+K on Mac) opens the global command search from anywhere -
// landing or the app. Mounted exactly once (root layout), so there's only
// ever one listener regardless of how many pages/components exist.
export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.ctrlKey && !event.metaKey) return;

      // Don't hijack the shortcut while the user is actively typing
      // somewhere else in the app (a dialog's text field, an alert's
      // target-price input, etc.) - only take it over when focus isn't on
      // an editable element.
      if (isEditableElement(document.activeElement)) return;

      event.preventDefault();
      onOpen();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
