import { Badge } from "@/components/ui/badge";
import type { StockCompanyProfile as StockCompanyProfileData } from "../types";

type StockCompanyProfileProps = {
  companyName: string;
  profile: StockCompanyProfileData;
};

export function StockCompanyProfile({ companyName, profile }: StockCompanyProfileProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Inside {companyName}</h2>

      <div className="mt-3 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
        <div className="border-t border-border py-3">
          <div className="text-xs font-medium text-muted-foreground">Founded</div>
          <div className="mt-1 text-sm font-semibold text-foreground">{profile.foundedYear}</div>
        </div>
        <div className="border-t border-border py-3">
          <div className="text-xs font-medium text-muted-foreground">Employees</div>
          <div className="mt-1 text-sm font-semibold text-foreground">{profile.employees}</div>
        </div>
        <div className="border-t border-border py-3">
          <div className="text-xs font-medium text-muted-foreground">Presence</div>
          <div className="mt-1 truncate text-sm font-semibold text-foreground">
            {profile.presence.join(", ")}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-muted-foreground">Products &amp; services</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.productsServices.map((item) => (
            <Badge key={item} variant="outline" className="bg-muted text-muted-foreground">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
