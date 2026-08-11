import Image from "next/image";
import { cn } from "@/utils/cn";

type ProductScreenshotProps = {
  alt: string;
  className?: string;
  priority?: boolean;
  crop?: { aspectRatio: string; objectPosition: string };
  dark?: boolean;
  chrome?: boolean;
};

const SOURCE_WIDTH = 1919;
const SOURCE_HEIGHT = 912;
const SCREENSHOT_SIZES = "(max-width: 768px) 92vw, (max-width: 1200px) 80vw, 1120px";

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
          sizes={SCREENSHOT_SIZES}
          className={crop ? "object-cover" : "block w-full h-auto"}
          style={crop ? { objectPosition: crop.objectPosition } : undefined}
        />
      </div>
    </div>
  );
}
