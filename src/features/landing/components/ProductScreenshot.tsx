"use client";

import Image from "next/image";
import { cn } from "@/utils/cn";

type ProductScreenshotProps = {
  /** Alt text describing what this particular crop/section shows. */
  alt: string;
  className?: string;
  priority?: boolean;
  /** Crops the same source screenshot to a different region for reuse
   * across sections without fabricating separate mock UI. */
  crop?: { aspectRatio: string; objectPosition: string };
  /** Dark panel variant for the hero, where the screenshot sits directly
   * on the navy background rather than a light section. */
  dark?: boolean;
  /** The scanner's own toolbar is already visible in the screenshot —
   * the macOS-style traffic-light chrome bar is only useful when the
   * frame needs to read as "a webpage", not as a real desktop tool. */
  chrome?: boolean;
};

const SOURCE_WIDTH = 1919;
const SOURCE_HEIGHT = 912;

// Real product screenshot in a frame — used across the landing page
// instead of illustrated mock panels.
export function ProductScreenshot({
  alt,
  className,
  priority,
  crop,
  dark = false,
  chrome = true,
}: ProductScreenshotProps) {
  return (
    <div
      className={cn(
        "landing-screenshot-frame",
        dark && "landing-screenshot-frame-dark",
        className,
      )}
    >
      {chrome ? (
        <div className="landing-screenshot-chrome">
          <span className="landing-screenshot-dot bg-[#ff5f57]" />
          <span className="landing-screenshot-dot bg-[#febc2e]" />
          <span className="landing-screenshot-dot bg-[#28c840]" />
        </div>
      ) : null}
      <div
        className={crop ? "relative w-full overflow-hidden" : undefined}
        style={crop ? { aspectRatio: crop.aspectRatio } : undefined}
      >
        <Image
          src="/scanner-view.png"
          alt={alt}
          width={crop ? undefined : SOURCE_WIDTH}
          height={crop ? undefined : SOURCE_HEIGHT}
          fill={Boolean(crop)}
          priority={priority}
          unoptimized={true}
          className={crop ? "object-cover" : "block w-full h-auto"}
          style={crop ? { objectPosition: crop.objectPosition } : undefined}
        />
      </div>
    </div>
  );
}
