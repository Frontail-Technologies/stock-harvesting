import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { StockStrengthRiskItem } from "../types";

type StockStrengthsRisksProps = {
  strengths: StockStrengthRiskItem[];
  risks: StockStrengthRiskItem[];
};

function ListColumn({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: StockStrengthRiskItem[];
  icon: typeof CheckCircle2;
  tone: "success" | "danger";
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className={cn("size-5", tone === "success" ? "text-success" : "text-danger")} />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <ul className="mt-3 flex flex-col divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 py-2.5 text-sm text-muted-foreground">
            <span
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                tone === "success" ? "bg-success" : "bg-danger",
              )}
              aria-hidden="true"
            />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StockStrengthsRisks({ strengths, risks }: StockStrengthsRisksProps) {
  return (
    <section className="grid gap-8 sm:grid-cols-2">
      <ListColumn title="Strengths" items={strengths} icon={CheckCircle2} tone="success" />
      <ListColumn title="Risks" items={risks} icon={AlertTriangle} tone="danger" />
    </section>
  );
}
