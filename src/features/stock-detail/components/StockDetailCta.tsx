import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { buildFullChartHref } from "../lib/stock-detail-links";

type StockDetailCtaProps = {
  symbol: string;
  exchange: string;
};

export function StockDetailCta({ symbol, exchange }: StockDetailCtaProps) {
  return (
    <section className="flex flex-col items-center gap-4 border-t border-border py-10 text-center">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Want deeper analysis?</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Open {symbol} in the full Stock Harvesting workspace for advanced chart review, drawing
        tools, alerts, and proprietary analysis.
      </p>
      <Link
        href={buildFullChartHref(symbol, exchange)}
        className={cn(buttonVariants({ variant: "default" }), "gap-1.5")}
      >
        Open full chart
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
