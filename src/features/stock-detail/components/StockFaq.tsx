import { ChevronDown } from "lucide-react";
import type { StockFaqItem } from "../types";

type StockFaqProps = {
  items: StockFaqItem[];
};

export function StockFaq({ items }: StockFaqProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">Frequently asked questions</h2>
      <div className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <details key={item.question} className="group py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground marker:content-none">
              {item.question}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
