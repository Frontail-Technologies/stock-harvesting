"use client";

import { RotateCcw, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type StocksMoveFilter = "all" | "gainers" | "decliners" | "unchanged";

type StockTableToolbarProps = {
  query: string;
  moveFilter: StocksMoveFilter;
  minVolume: string;
  onQueryChange: (value: string) => void;
  onMoveFilterChange: (value: StocksMoveFilter) => void;
  onMinVolumeChange: (value: string) => void;
  onReset: () => void;
};

const moveFilters: Array<{
  value: StocksMoveFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "gainers", label: "Gainers" },
  { value: "decliners", label: "Decliners" },
  { value: "unchanged", label: "Flat" },
];

export function StockTableToolbar({
  query,
  moveFilter,
  minVolume,
  onQueryChange,
  onMoveFilterChange,
  onMinVolumeChange,
  onReset,
}: StockTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search stocks"
            className="h-8 w-64 pl-8"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-card p-0.5">
          {moveFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => onMoveFilterChange(filter.value)}
              className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors ${
                moveFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {filter.value === "gainers" && <TrendingUp className="size-3" />}
              {filter.value === "decliners" && <TrendingDown className="size-3" />}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={minVolume}
          inputMode="numeric"
          onChange={(event) => onMinVolumeChange(event.target.value)}
          placeholder="Min volume"
          className="h-8 w-32"
        />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
