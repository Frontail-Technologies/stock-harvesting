"use client";

import Image from "next/image";
import { useTheme } from "@/features/theme";
import { cn } from "@/utils/cn";
import { getBrandLogoPath } from "./brand-logo-paths";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
  /**
   * Forces a specific logo variant regardless of the app-wide theme toggle
   * — for surfaces that are permanently light or dark (landing, login)
   * rather than following the visitor's stored preference.
   */
  forceTheme?: "light" | "dark";
};

// text sizes are deliberately much larger than the mark's own height class
// (e.g. "sm" pairs a 40px-tall mark with 30px type) - a glyph's cap-height
// is only ~70% of its font-size, so matching font-size to the mark's pixel
// height renders text that visibly reads as smaller than the mark next to
// it. These are picked to bring cap-height close to the mark's height
// instead of matching the font-size number to it.
const sizeClasses = {
  sm: {
    root: "h-10",
    image: "h-10",
    text: "text-3xl",
  },
  md: {
    root: "h-12",
    image: "h-12",
    text: "text-4xl",
  },
  lg: {
    root: "h-16",
    image: "h-16",
    text: "text-5xl",
  },
};

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  size = "md",
  forceTheme,
}: BrandLogoProps) {
  const classes = sizeClasses[size];
  const { theme } = useTheme();
  const resolvedTheme = forceTheme ?? theme;

  return (
    <span className={cn("inline-flex items-center gap-2", classes.root, className)}>
      <span
        className={cn(
          "relative inline-flex h-full shrink-0 overflow-visible",
          markClassName,
        )}
        aria-hidden="true"
      >
        <Image
          src={getBrandLogoPath(resolvedTheme)}
          alt=""
          width={420}
          height={420}
          loading="eager"
          className={cn("h-full w-auto max-w-none object-contain", classes.image)}
        />
      </span>
      {/* The mark-only artwork has no wordmark baked in anymore - "Stock"
          follows the resolved theme's ink color the same way the mark
          itself does, "Harvesting" stays the brand gold in both themes,
          matching the previous cropped artwork's own two-tone wordmark. */}
      <span
        className={cn(
          "inline-flex shrink-0 items-baseline gap-1 font-bold leading-none tracking-tight whitespace-nowrap",
          classes.text,
          textClassName,
        )}
      >
        <span className={resolvedTheme === "dark" ? "text-white" : "text-foreground"}>
          Stock
        </span>
        <span className="text-brand-gold">Harvesting</span>
      </span>
    </span>
  );
}
