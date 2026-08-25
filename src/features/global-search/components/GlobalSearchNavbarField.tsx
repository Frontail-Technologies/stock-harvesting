"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";
import { useGlobalStockSearch } from "../hooks/use-global-stock-search";
import { useSearchKeyboardNav } from "../hooks/use-search-keyboard-nav";
import { useStockDestination } from "../hooks/use-stock-destination";
import { GlobalSearchResultsList } from "./GlobalSearchResultsList";

const LIST_ID = "global-search-navbar-results";

type GlobalSearchNavbarFieldProps = {
  className?: string;
};

// The always-visible inline field in the authenticated app navbar (desktop
// only - AppHeader shows a search icon -> GlobalSearchMobileSheet below
// the lg breakpoint instead). Portal-positioned results, matching the
// established pattern (StockSearchCombobox, MarketSelector) rather than a
// plain absolutely-positioned dropdown, so it can't be clipped by an
// ancestor's overflow.
export function GlobalSearchNavbarField({ className }: GlobalSearchNavbarFieldProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const search = useGlobalStockSearch();
  const goToStock = useStockDestination();

  const closeAndReset = () => {
    setOpen(false);
    search.reset();
  };

  const handleSelect = (stock: Stock) => {
    closeAndReset();
    inputRef.current?.blur();
    goToStock(stock);
  };

  const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useSearchKeyboardNav(
    search.results,
    handleSelect,
    () => setOpen(false)
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (inputRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open || !search.hasQuery) return;

    const updateMenuRect = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 300) });
    };

    updateMenuRect();
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [open, search.hasQuery]);

  return (
    <div className={cn("relative w-full max-w-90 min-w-0", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={search.query}
        onChange={(event) => {
          search.setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search stocks..."
        aria-label="Search stocks"
        role="combobox"
        aria-expanded={open && search.results.length > 0}
        aria-controls={LIST_ID}
        className="h-8 w-full rounded-md border border-border/60 bg-muted/35 pl-8 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/25"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border/60 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground xl:inline-block">
        Ctrl K
      </kbd>

      {open && search.hasQuery && menuRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className="fixed z-50 max-h-80 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-xl"
            >
              <GlobalSearchResultsList
                listId={LIST_ID}
                results={search.results}
                isLoading={search.isLoading}
                isError={search.isError}
                hasQuery={search.hasQuery}
                highlightedIndex={highlightedIndex}
                onHighlight={setHighlightedIndex}
                onSelect={handleSelect}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
