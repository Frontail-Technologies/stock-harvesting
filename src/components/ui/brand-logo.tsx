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
};

const sizeClasses = {
  sm: {
    root: "h-10",
    image: "h-10",
  },
  md: {
    root: "h-12",
    image: "h-12",
  },
  lg: {
    root: "h-16",
    image: "h-16",
  },
};

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  size = "md",
}: BrandLogoProps) {
  const classes = sizeClasses[size];
  const { theme } = useTheme();

  return (
    <span className={cn("inline-flex items-center", classes.root, className)}>
      <span
        className={cn(
          "relative inline-flex h-full shrink-0 overflow-visible",
          markClassName,
        )}
        aria-hidden="true"
      >
        <Image
          src={getBrandLogoPath(theme)}
          alt=""
          width={420}
          height={160}
          priority
          className={cn("h-full w-auto max-w-none object-contain", classes.image)}
        />
      </span>
      {textClassName ? <span className="sr-only">Stock Harvesting</span> : null}
    </span>
  );
}
