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
    <div className="min-w-0 rounded-lg border border-border bg-card px-3 py-3 text-card-foreground shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[0.8125rem] font-semibold text-foreground">
            {title}
          </div>
          <div className="mt-2 h-2.5 w-28 animate-pulse rounded-full bg-muted" />
        </div>
        <Spinner size="sm" />
      </div>

      <div className="mt-5 flex flex-col">
        {rowWidths.map((width, rowIndex) => {
          const isRightSide = (rowIndex + offset) % 3 === 0;

          return (
            <div key={`${title}-${rowIndex}`} className="flex items-center gap-2 py-0.5">
              <div className="h-3 w-16 shrink-0 animate-pulse rounded-full bg-muted" />

              <div className="relative h-5 min-w-0 flex-1">
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
                <div
                  className="absolute inset-y-1 animate-pulse rounded-sm bg-muted"
                  style={{
                    width: `${width / 2}%`,
                    left: isRightSide ? "50%" : `${50 - width / 2}%`,
                  }}
                />
              </div>

              <div className="h-3 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
            </div>
          );
        })}
      </div>

      <div className="mt-3 h-3 w-12 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
