"use client";

import Image from "next/image";
import { cn } from "@/utils/cn";
import { getBrandLogoPath } from "./brand-logo-paths";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";

  forceTheme?: "light" | "dark";
};

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

  return (
    <span className={cn("inline-flex items-center gap-2", classes.root, className)}>
      <span
        className={cn(
          "relative inline-flex h-full shrink-0 overflow-visible",
          markClassName,
        )}
        aria-hidden="true"
      >
        {forceTheme ? (
          <Image
            src={getBrandLogoPath(forceTheme)}
            alt=""
            width={420}
            height={420}
            loading="eager"
            className={cn("h-full w-auto max-w-none object-contain", classes.image)}
          />
        ) : (
          <>
            <Image
              src={getBrandLogoPath("light")}
              alt=""
              width={420}
              height={420}
              loading="eager"
              className={cn("h-full w-auto max-w-none object-contain dark:hidden", classes.image)}
            />
            <Image
              src={getBrandLogoPath("dark")}
              alt=""
              width={420}
              height={420}
              loading="eager"
              className={cn("hidden h-full w-auto max-w-none object-contain dark:block", classes.image)}
            />
          </>
        )}
      </span>

      <span
        className={cn(
          "inline-flex shrink-0 items-baseline gap-1 font-bold leading-none tracking-tight whitespace-nowrap",
          classes.text,
          textClassName,
        )}
      >
        <span
          className={
            forceTheme
              ? forceTheme === "dark"
                ? "text-white"
                : "text-foreground"
              : "text-foreground dark:text-white"
          }
        >
          Stock
        </span>
        <span className="text-brand-gold">Harvesting</span>
      </span>
    </span>
  );
}
