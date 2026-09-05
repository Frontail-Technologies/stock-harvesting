import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { StockFaqItem } from "../types";

type StockFaqProps = {
  items: StockFaqItem[];
};

export function StockFaq({ items }: StockFaqProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Frequently asked questions</h2>
      <Accordion className="mt-2">
        {items.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionPanel>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
