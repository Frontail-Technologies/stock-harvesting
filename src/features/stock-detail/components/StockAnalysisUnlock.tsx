"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useSessionStore } from "@/features/auth";
import { cn } from "@/utils/cn";
import { StockSectionCard } from "./StockSectionCard";

type StockAnalysisUnlockProps = {
  symbol: string;
};

// The single "Open full chart" action for this page already lives on the
// chart itself (StockPublicChart) - authenticated visitors don't need a
// second copy of it repeated down here, so this module simply has nothing
// to add for them and renders nothing.
export function StockAnalysisUnlock({ symbol }: StockAnalysisUnlockProps) {
  const authStatus = useSessionStore((state) => state.status);

  if (authStatus === "authenticated") return null;

  return (
    <section className="border-t border-border py-10">
      <StockSectionCard className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-6 py-8 text-center sm:px-6 sm:py-8">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="size-4.5 text-primary" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Unlock deeper stock analysis
        </h2>
        <p className="text-sm text-muted-foreground">
          Get advanced charts, technical indicators, drawing tools, alerts and StockHarvesting
          insights for {symbol}.
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <Link href="/login" className={cn(buttonVariants({ variant: "default" }), "gap-1.5")}>
            Login to Continue
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/login" className={buttonVariants({ variant: "outline" })}>
            Create Free Account
          </Link>
        </div>
      </StockSectionCard>
    </section>
  );
}
