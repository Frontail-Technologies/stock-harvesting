import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserPlan } from "@/types/user";

const FEATURES = [
  "200 scans per day",
  "Advanced scanners",
  "Real-time signals",
  "Priority support",
  "API access",
];

export function PlanCard({ plan = "pro" }: { plan?: UserPlan }) {
  const planLabel = plan === "pro" ? "Pro" : "Free";

  return (
    <div className="rounded-lg max-w-[300px] border border-border bg-card p-5 text-card-foreground shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Your Plan</h3>
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">
        {planLabel} Plan
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Check className="size-3.5 shrink-0 text-success" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2">
        <Button className="w-full bg-primary text-primary-foreground hover:bg-brand-gold-soft">
          Upgrade Plan
        </Button>
        <Button variant="outline" className="w-full">
          Manage Billing
        </Button>
      </div>
    </div>
  );
}
