import type { StockFinancials } from "../types";
import { StockFinancialCharts } from "./StockFinancialCharts";
import { StockFinancialStatements } from "./StockFinancialStatements";
import { StockSectionCard } from "./StockSectionCard";

type StockFinancialsSectionProps = {
  financials: StockFinancials;
  currency: string;
};

export function StockFinancialsSection({ financials, currency }: StockFinancialsSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Financials</h2>

      <StockSectionCard className="mt-3">
        <StockFinancialCharts
          profitLoss={financials.profitLoss}
          cashFlow={financials.cashFlow}
          balanceSheet={financials.balanceSheet}
        />

        <div className="mt-8 border-t border-border pt-6">
          <StockFinancialStatements financials={financials} currency={currency} />
        </div>
      </StockSectionCard>
    </section>
  );
}
