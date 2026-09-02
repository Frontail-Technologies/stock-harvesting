import { EmptyStatePreviewCard } from "@/components/ui/empty-state";

const SPARKLINE_POINTS = "0,28 18,22 32,26 48,14 64,18 80,6 96,10 112,2";

export function ChartsEmptyIllustration() {
  return (
    <EmptyStatePreviewCard label="Charts">
      <div className="h-16 rounded-md border border-border bg-background/60 p-2">
        <svg viewBox="0 0 112 32" className="h-full w-full" role="presentation">
          <polyline
            points={SPARKLINE_POINTS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </svg>
      </div>
    </EmptyStatePreviewCard>
  );
}
