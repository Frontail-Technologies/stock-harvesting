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

// A conic-gradient ring (brand accent fading through gold) masked into a
// thin donut shape and rotated — reads as a premium "swoosh" rather than a
// generic browser-default spinner, while staying a single lightweight div.
export function Spinner({ size = "md", className, label }: SpinnerProps) {
  const dimension = SIZE_PX[size];
  const thickness = THICKNESS_PX[size];
  const ringMask = `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`;

  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span
        aria-hidden="true"
        className="inline-block shrink-0 animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite]"
        style={{
          width: dimension,
          height: dimension,
          background:
            "conic-gradient(from 0deg, transparent 0%, color-mix(in oklab, var(--brand-accent) 85%, transparent) 55%, var(--brand-gold) 100%)",
          WebkitMask: ringMask,
          mask: ringMask,
        }}
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
