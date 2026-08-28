import { Spinner } from "@/components/ui/spinner";

const skeletonCardTitles = [
  "Relative Strength Index",
  "Relative Strength Sector",
  "Relative Strength Industry",
  "Weekly Strong Stock List",
];

const rowWidths = [72, 42, 36, 34, 28, 24, 22, 20, 18, 16, 15, 14];

export function DashboardGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Loading dashboard widgets"
      role="status"
    >
      {skeletonCardTitles.map((title, index) => (
        <DashboardWidgetSkeleton key={title} title={title} offset={index} />
      ))}
    </div>
  );
}

function DashboardWidgetSkeleton({
  title,
  offset,
}: {
  title: string;
  offset: number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {title}
          </div>
          <div className="mt-2 h-2.5 w-28 animate-pulse rounded-full bg-muted" />
        </div>
        <Spinner size="sm" />
      </div>

      <div className="mt-4 flex flex-col">
        {rowWidths.map((width, rowIndex) => {
          const isPositive = (rowIndex + offset) % 3 !== 0;

          return (
            <div key={`${title}-${rowIndex}`} className="flex h-7 items-center gap-2">
              <div className="h-2.5 w-14 shrink-0 animate-pulse rounded-full bg-muted" />

              <div className="flex h-5 min-w-0 flex-1 items-stretch">
                <div className="flex flex-1 items-center justify-end">
                  {!isPositive && (
                    <div
                      className="h-5 shrink-0 animate-pulse rounded-sm bg-muted"
                      style={{ width: `${width}%` }}
                    />
                  )}
                </div>
                <div className="w-px shrink-0 bg-border" />
                <div className="flex flex-1 items-center">
                  {isPositive && (
                    <div
                      className="h-5 shrink-0 animate-pulse rounded-sm bg-muted"
                      style={{ width: `${width}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-3 w-12 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
