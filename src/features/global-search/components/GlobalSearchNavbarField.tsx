"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { useSearchModalStore } from "../stores/search-modal-store";

type GlobalSearchNavbarFieldProps = {
  className?: string;
};

// A compact trigger styled like a search field (not an actual input) -
// clicking it opens the one canonical GlobalStockSearchModal rather than
// rendering its own inline results dropdown. Desktop-width navbar
// presentation; narrower viewports use the icon-only trigger instead (see
// wherever this is conditionally hidden in AppHeader/Navbar).
export function GlobalSearchNavbarField({ className }: GlobalSearchNavbarFieldProps) {
  const openModal = useSearchModalStore((state) => state.open);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => openModal(triggerRef.current)}
      aria-label="Search stocks"
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-md border border-border/60 bg-muted/35 pl-2.5 pr-2 text-sm text-muted-foreground outline-none transition-colors hover:border-border hover:bg-muted/55 focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/25",
        className
      )}
    >
      <Search className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">Search stocks...</span>
      <kbd className="hidden shrink-0 rounded border border-border/60 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground xl:inline-block">
        Ctrl K
      </kbd>
    </button>
  );
}
