import { cn } from "@/utils/cn";

type StockSectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function StockSectionCard({ children, className }: StockSectionCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}
