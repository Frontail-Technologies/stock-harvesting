"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  DEFAULT_MARKET_EXCHANGE,
  isEnabledMarketExchange,
  type MarketExchangeCode,
} from "../constants/exchanges";
import { useMarketExchanges } from "../hooks/use-market-exchanges";
import { useMarketStore } from "../stores/market-store";

type MarketSelectorProps = {
  compact?: boolean;
  className?: string;
  onExchangeChange?: (exchange: MarketExchangeCode) => void;
};

// The exchange list is ~70 items now (all EODHD exchanges plus NSE), so the
// plain unsearchable <Select> primitive that worked for 2 items doesn't
// scale — this is a text-filter combobox instead, following the same
// portal/positioning approach as components/ui/select.tsx.
export function MarketSelector({
  compact = false,
  className,
  onExchangeChange,
}: MarketSelectorProps) {
  const selectedExchange = useMarketStore((state) => state.selectedExchange);
  const setSelectedExchange = useMarketStore((state) => state.setSelectedExchange);
  const { exchanges, isLoading } = useMarketExchanges();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleExchanges = useMemo(
    () => exchanges.filter((exchange) => isEnabledMarketExchange(exchange.code)),
    [exchanges]
  );

  const selected = visibleExchanges.find((exchange) => exchange.code === selectedExchange);

  const filteredExchanges = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return visibleExchanges;

    return visibleExchanges.filter(
      (exchange) =>
        exchange.code.toLowerCase().includes(trimmed) ||
        exchange.name.toLowerCase().includes(trimmed) ||
        exchange.country.toLowerCase().includes(trimmed)
    );
  }, [query, visibleExchanges]);

  useEffect(() => {
    if (isEnabledMarketExchange(selectedExchange)) return;
    setSelectedExchange(DEFAULT_MARKET_EXCHANGE);
    onExchangeChange?.(DEFAULT_MARKET_EXCHANGE);
  }, [onExchangeChange, selectedExchange, setSelectedExchange]);

  useEffect(() => {
    if (!open) return;

    const updateMenuRect = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 8;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 640;

      if (isMobile) {
        setMenuRect({
          top: rect.bottom + 4,
          left: margin,
          width: Math.max(1, viewportWidth - margin * 2),
        });
        return;
      }

      const width = Math.max(rect.width, 260);
      const left = Math.min(rect.left, viewportWidth - width - margin);
      setMenuRect({ top: rect.bottom + 4, left: Math.max(margin, left), width });
    };

    updateMenuRect();
    inputRef.current?.focus();
    window.addEventListener("scroll", updateMenuRect, true);
    window.addEventListener("resize", updateMenuRect);
    return () => {
      window.removeEventListener("scroll", updateMenuRect, true);
      window.removeEventListener("resize", updateMenuRect);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleSelect = (code: string) => {
    setSelectedExchange(code);
    onExchangeChange?.(code);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={cn("relative", compact ? "w-24" : "w-40", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm text-foreground outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
          compact ? "h-8 rounded-md px-2 text-xs" : "h-9"
        )}
      >
        <span className="truncate">
          {selected ? (compact ? selected.code : selected.name) : isLoading ? "..." : selectedExchange}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && menuRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
              className="fixed z-9999 flex max-h-80 flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
            >
              <div className="relative shrink-0 border-b border-border p-1.5">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && filteredExchanges[0]) {
                      event.preventDefault();
                      handleSelect(filteredExchanges[0].code);
                    }
                    if (event.key === "Escape") setOpen(false);
                  }}
                  placeholder="Search exchange or country"
                  className="h-8 w-full rounded-md bg-transparent pl-7 pr-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>

              <div role="listbox" className="flex-1 overflow-y-auto p-1">
                {filteredExchanges.length === 0 ? (
                  <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
                    No exchanges found.
                  </p>
                ) : (
                  filteredExchanges.map((exchange) => {
                    const isSelected = exchange.code === selectedExchange;

                    return (
                      <button
                        key={exchange.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(exchange.code)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors sm:px-2.5 sm:py-1.5",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "text-popover-foreground hover:bg-muted"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{exchange.name}</span>
                          <span
                            className={cn(
                              "block truncate text-xs",
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}
                          >
                            {exchange.code} · {exchange.country}
                          </span>
                        </span>
                        {isSelected && <Check className="size-3.5 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
