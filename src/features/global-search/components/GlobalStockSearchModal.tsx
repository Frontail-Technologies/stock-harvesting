"use client";

import { useEffect, useMemo, useRef } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import { isEnabledMarketExchange, useMarketExchanges } from "@/features/market";
import { exchangeCountryFlagUri } from "@/features/market/lib/exchange-country-flag";
import type { Stock } from "@/types/market";
import { useGlobalSearchShortcut } from "../hooks/use-global-search-shortcut";
import { useGlobalStockSearch } from "../hooks/use-global-stock-search";
import { useSearchKeyboardNav } from "../hooks/use-search-keyboard-nav";
import { useStockDestination } from "../hooks/use-stock-destination";
import { useSearchModalStore } from "../stores/search-modal-store";
import { GlobalSearchResultsList } from "./GlobalSearchResultsList";

const LIST_ID = "global-search-modal-results";

const FILTER_TRIGGER_CLASS =
  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-transparent px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:border-muted-foreground hover:bg-muted aria-expanded:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60";

export function GlobalStockSearchModal() {
  const isOpen = useSearchModalStore((state) => state.isOpen);
  const triggerElement = useSearchModalStore((state) => state.triggerElement);
  const openModal = useSearchModalStore((state) => state.open);
  const closeModal = useSearchModalStore((state) => state.close);

  const search = useGlobalStockSearch();
  const goToStock = useStockDestination();
  const { exchanges } = useMarketExchanges();
  const inputRef = useRef<HTMLInputElement>(null);

  useGlobalSearchShortcut(() => openModal());

  const handleSelect = (stock: Stock) => {
    closeModal();
    search.reset();
    goToStock(stock);
  };

  const handleClose = () => {
    closeModal();
    triggerElement?.focus();
  };

  const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useSearchKeyboardNav(
    search.results,
    handleSelect,
    handleClose
  );

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  const indiaExchanges = useMemo(
    () =>
      exchanges.filter(
        (exchange) => exchange.country === "India" && isEnabledMarketExchange(exchange.code)
      ),
    [exchanges]
  );
  const indiaFlag = exchangeCountryFlagUri("India");

  useEffect(() => {
    if (indiaExchanges.length === 0) return;
    if (indiaExchanges.some((exchange) => exchange.code === search.exchange)) return;
    search.setExchange(indiaExchanges[0].code);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the available exchange list itself changes, not on every search.exchange/setExchange identity change
  }, [indiaExchanges]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          data-slot="global-search-modal"
          aria-label="Search stocks"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 outline-none duration-100",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",

            "sm:top-[12%] sm:left-1/2 sm:h-auto sm:max-h-[620px] sm:w-full sm:max-w-[820px] sm:-translate-x-1/2 sm:rounded-xl sm:border sm:border-border",

            "max-sm:inset-0 max-sm:h-full max-sm:w-full max-sm:rounded-none"
          )}
        >
          <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-3.5">
            <Search className="size-4.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search.query}
              onChange={(event) => search.setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search symbol or company..."
              aria-label="Search stocks"
              role="combobox"
              aria-expanded={search.results.length > 0}
              aria-controls={LIST_ID}
              className="h-7 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[0.6875rem] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
            <DialogPrimitive.Close
              aria-label="Close search"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex shrink-0 flex-col gap-2.5 border-b border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">

              <DropdownMenu>
                <DropdownMenuTrigger className={FILTER_TRIGGER_CLASS}>
                  {indiaFlag && (
                    // eslint-disable-next-line @next/next/no-img-element -- inline data-URI SVG flag; next/image adds no value and can't optimize a data URI
                    <img src={indiaFlag} alt="" aria-hidden="true" className="h-3 w-4 rounded-xs object-cover" />
                  )}
                  India
                  <ChevronDown className="size-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-32">
                  <DropdownMenuItem className="gap-1.5">
                    <Check className="size-3.5" />
                    India
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className={FILTER_TRIGGER_CLASS}>
                  Stocks
                  <ChevronDown className="size-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-28">
                  <DropdownMenuItem className="gap-1.5">
                    <Check className="size-3.5" />
                    Stocks
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                disabled
                title="Sector data isn't available yet"
                className={cn(FILTER_TRIGGER_CLASS, "cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent")}
              >
                All sectors
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </div>
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
            emptyBeforeQuery={`Start typing to search ${search.exchange} stocks`}

            className="min-h-0 max-sm:flex-1 overflow-y-auto sm:min-h-[350px] sm:max-h-[420px]"
          />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
