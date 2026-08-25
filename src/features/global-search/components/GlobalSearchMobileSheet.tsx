"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Stock } from "@/types/market";
import { useGlobalStockSearch } from "../hooks/use-global-stock-search";
import { useSearchKeyboardNav } from "../hooks/use-search-keyboard-nav";
import { useStockDestination } from "../hooks/use-stock-destination";
import { GlobalSearchResultsList } from "./GlobalSearchResultsList";

const LIST_ID = "global-search-mobile-results";

type GlobalSearchMobileSheetProps = {
  className?: string;
};

// The narrow-viewport presentation for the authenticated app navbar - a
// compact icon that opens a full-width bottom sheet, instead of squeezing
// an inline field into an already-tight mobile header.
export function GlobalSearchMobileSheet({ className }: GlobalSearchMobileSheetProps) {
  const [open, setOpen] = useState(false);
  const search = useGlobalStockSearch();
  const goToStock = useStockDestination();

  const handleSelect = (stock: Stock) => {
    setOpen(false);
    search.reset();
    goToStock(stock);
  };

  const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useSearchKeyboardNav(
    search.results,
    handleSelect,
    () => setOpen(false)
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) search.reset();
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={className}
              aria-label="Search stocks"
              onClick={() => setOpen(true)}
            />
          }
        >
          <Search className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Search stocks</TooltipContent>
      </Tooltip>

      <SheetContent side="bottom" className="gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle>Search stocks</SheetTitle>
        </SheetHeader>

        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/35 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search symbol or company..."
            aria-label="Search stocks"
            role="combobox"
            aria-expanded={search.results.length > 0}
            aria-controls={LIST_ID}
            className="h-11 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <GlobalSearchResultsList
          listId={LIST_ID}
          results={search.results}
          isLoading={search.isLoading}
          isError={search.isError}
          hasQuery={search.hasQuery}
          highlightedIndex={highlightedIndex}
          onHighlight={setHighlightedIndex}
          onSelect={handleSelect}
          className="max-h-[60dvh] overflow-y-auto"
        />
      </SheetContent>
    </Sheet>
  );
}
