"use client";

import { create } from "zustand";

type SearchModalState = {
  isOpen: boolean;
  // Whoever asked the modal to open (navbar button, mobile search icon) -
  // captured at open time so closing can return focus to it, the same way
  // a dialog opened via its own inline trigger would. Ctrl/Cmd+K has no
  // "trigger element" of its own, so it falls back to whatever already had
  // focus.
  triggerElement: HTMLElement | null;
  open: (trigger?: HTMLElement | null) => void;
  close: () => void;
};

// Ephemeral UI state, not persisted - every surface that can open the one
// canonical search modal (landing navbar, app navbar, mobile search icon,
// Ctrl+K) shares this instead of each owning its own open/closed state and
// its own copy of the search UI.
export const useSearchModalStore = create<SearchModalState>((set) => ({
  isOpen: false,
  triggerElement: null,
  open: (trigger) =>
    set({
      isOpen: true,
      triggerElement: trigger ?? (document.activeElement as HTMLElement | null),
    }),
  close: () => set({ isOpen: false }),
}));
