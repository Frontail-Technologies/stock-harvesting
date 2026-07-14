"use client";

import { useState } from "react";
import { AppPage, AppShell } from "@/features/layout";
import { StockTableToolbar, StocksTable } from "@/features/stocks";

export default function StocksPage() {
  const [query, setQuery] = useState("");

  return (
    <AppShell>
      <AppPage contentClassName="gap-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stocks</h1>
          <p className="text-sm text-muted-foreground">
            Browse and analyze listed stocks on NSE
          </p>
        </div>

        <StockTableToolbar query={query} onQueryChange={setQuery} />
        <StocksTable query={query} />
      </AppPage>
    </AppShell>
  );
}
