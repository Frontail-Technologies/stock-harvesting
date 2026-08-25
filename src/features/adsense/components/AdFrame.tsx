import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type AdFrameProps = {
  children: ReactNode;
  className?: string;
  variant: "landing" | "scanner";
  placement: string;
};

export function AdFrame({ children, className, variant, placement }: AdFrameProps) {
  const isScanner = variant === "scanner";

  return (
    <section
      aria-label="Advertisement"
      data-adsense-placement={placement}
      className={cn(
        "w-full border-y",
        isScanner ? "py-1.5" : "py-6 sm:py-7",
        variant === "landing"
          ? "border-white/10 bg-transparent text-white/45"
          : "border-border bg-background text-muted-foreground",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto w-full",
          isScanner ? "px-2" : "px-4 sm:px-6",
          variant === "landing" ? "max-w-6xl" : "max-w-5xl"
        )}
      >
        <p
          className={cn(
            "text-center font-semibold uppercase tracking-[0.22em] opacity-70",
            isScanner ? "mb-1 text-[0.55rem]" : "mb-3 text-[0.625rem]"
          )}
        >
          Advertisement
        </p>
        <div
          className={cn(
            "mx-auto w-full max-w-[970px]",
            isScanner ? "min-h-[50px]" : "min-h-[100px]"
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
