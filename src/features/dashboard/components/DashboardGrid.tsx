import { dashboardCards } from "@/mocks/dashboard/cards";
import { DashboardWidget } from "./DashboardWidget";

export function DashboardGrid() {
  const primaryCards = dashboardCards.slice(0, 4);
  const mixCards = dashboardCards.slice(4, 8);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-sm dark:shadow-none">
      <div className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
        {primaryCards.map((card) => (
          <DashboardWidget key={card.id} card={card} />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border border-t border-border sm:flex-row sm:divide-x sm:divide-y-0">
        {mixCards.map((card) => (
          <DashboardWidget key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
