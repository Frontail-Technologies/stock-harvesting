"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import type { Stock } from "@/types/market";
import { useGlobalStockSearch } from "@/features/global-search/hooks/use-global-stock-search";
import { useSearchKeyboardNav } from "@/features/global-search/hooks/use-search-keyboard-nav";
import { useStockDestination } from "@/features/global-search/hooks/use-stock-destination";
import { GlobalSearchResultsList } from "@/features/global-search/components/GlobalSearchResultsList";

const LIST_ID = "landing-hero-search-results";

// The one client island in the (otherwise server-rendered/static) landing
// Hero - reuses the exact same search hook, destination logic, and result
// list as the app navbar and the Ctrl+K command panel. Portal-positioned
// results so they can't push Hero content down or get clipped by the
// globe/frame decoration around it.
export function LandingHeroSearch() {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const search = useGlobalStockSearch();
  const goToStock = useStockDestination();

  const handleSelect = (stock: Stock) => {
    setOpen(false);
    search.reset();
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
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open || !search.hasQuery) return;

    const updateMenuRect = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuRect({ top: rect.bottom + 8, left: rect.left, width: rect.width });
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
    <div ref={rootRef} className="relative mx-auto w-full max-w-140">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
      <input
        ref={inputRef}
        value={search.query}
        onChange={(event) => {
          search.setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search a stock, symbol or company"
        aria-label="Search a stock, symbol or company"
        role="combobox"
        aria-expanded={open && search.results.length > 0}
        aria-controls={LIST_ID}
        className="h-12 w-full rounded-lg border border-white/12 bg-white/6 pl-11 pr-4 text-sm text-white outline-none backdrop-blur-sm transition-colors placeholder:text-white/40 focus-visible:border-white/30 focus-visible:ring-1 focus-visible:ring-white/20 sm:h-13 sm:text-base"
      />

      {open && search.hasQuery && menuRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className="fixed z-50 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl"
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
