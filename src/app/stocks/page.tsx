"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StockTableToolbar } from "@/components/stocks/StockTableToolbar";
import { StocksTable } from "@/components/stocks/StocksTable";

export default function StocksPage() {
  const [query, setQuery] = useState("");

  return (
    <AppShell>
      <div className="flex-1 bg-muted/40 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Stocks</h1>
            <p className="text-sm text-muted-foreground">
              Browse and analyze listed stocks on NSE
            </p>
          </div>

          <StockTableToolbar query={query} onQueryChange={setQuery} />
          <StocksTable query={query} />
        </div>
      </div>
    </AppShell>
  );
}
