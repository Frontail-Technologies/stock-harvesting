"use client";

import { create } from "zustand";

type SearchModalState = {
  isOpen: boolean;

  triggerElement: HTMLElement | null;
  open: (trigger?: HTMLElement | null) => void;
  close: () => void;
};

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
