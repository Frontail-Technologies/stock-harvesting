"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Stock } from "@/types/market";
import { useGlobalSearchShortcut } from "../hooks/use-global-search-shortcut";
import { useGlobalStockSearch } from "../hooks/use-global-stock-search";
import { useSearchKeyboardNav } from "../hooks/use-search-keyboard-nav";
import { useStockDestination } from "../hooks/use-stock-destination";
import { GlobalSearchResultsList } from "./GlobalSearchResultsList";

const LIST_ID = "global-search-command-results";

// The Ctrl+K presentation - mounted once, globally (root layout), so it
// works on the landing page and every app route alike. Reuses the exact
// same search hook, destination logic, and result list as the navbar and
// landing hero presentations.
export function GlobalSearchCommandDialog() {
  const [open, setOpen] = useState(false);
  const search = useGlobalStockSearch();
  const goToStock = useStockDestination();

  useGlobalSearchShortcut(() => setOpen(true));

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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) search.reset();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[18%] max-w-[calc(100%-2rem)] translate-y-0 gap-0 p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search stocks</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
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
            className="h-6 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
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
          className="max-h-80 overflow-y-auto"
        />
      </DialogContent>
    </Dialog>
  );
}
