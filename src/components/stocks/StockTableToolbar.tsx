"use client";

import { Columns3, Copy, FileSpreadsheet, Search, Settings, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StockTableToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function StockTableToolbar({ query, onQueryChange }: StockTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="size-3.5" />
          Customize Columns
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="size-3.5" />
          Copy
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileSpreadsheet className="size-3.5" />
          CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sheet className="size-3.5" />
          Excel
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search stocks"
            className="h-8 w-56 pl-8"
          />
        </div>
        <Button variant="outline" size="icon" className="size-8" title="Settings">
          <Settings className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
