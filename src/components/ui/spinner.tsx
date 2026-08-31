import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";

type SpinnerSize = "sm" | "md" | "lg";

const SIZE_PX: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

const THICKNESS_PX: Record<SpinnerSize, number> = {
  sm: 2,
  md: 2.5,
  lg: 3.5,
};

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  label?: string;
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const dimension = SIZE_PX[size];
  const thickness = THICKNESS_PX[size];

  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span
        aria-hidden="true"
        className="app-loader shrink-0 motion-reduce:animate-none"
        style={
          {
            "--app-loader-size": `${dimension}px`,
            "--app-loader-thickness": `${thickness}px`,
          } as CSSProperties
        }
      />
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  );
}

export function SpinnerOverlay({ label }: { label?: string }) {
  return (
    <div className="flex flex-col md:h-screen items-center justify-center gap-3 py-10">
      <Spinner size="lg" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
