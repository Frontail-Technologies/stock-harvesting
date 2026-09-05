import { Globe } from "lucide-react";
import type { StockCompanyProfile } from "../types";

type StockCompanyOverviewProps = {
  companyName: string;
  profile: StockCompanyProfile;
};

export function StockCompanyOverview({ companyName, profile }: StockCompanyOverviewProps) {
  const facts: Array<{ label: string; value: string }> = [
    { label: "Sector", value: profile.sector },
    { label: "Industry", value: profile.industry },
    { label: "Founded", value: String(profile.foundedYear) },
    { label: "Headquarters", value: profile.headquarters },
    { label: "Employees", value: profile.employees },
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">About {companyName}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {profile.description}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-5">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-1 border-t border-border py-3">
            <span className="text-xs font-medium text-muted-foreground">{fact.label}</span>
            <span className="truncate text-sm font-medium text-foreground">{fact.value}</span>
          </div>
        ))}
      </div>

      {profile.website && (
        <a
          href={profile.website}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Globe className="size-3.5" />
          {profile.website.replace(/^https?:\/\//, "")}
        </a>
      )}
    </section>
  );
}
