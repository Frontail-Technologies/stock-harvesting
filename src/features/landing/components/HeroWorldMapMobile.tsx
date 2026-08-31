import type { CSSProperties } from "react";
import { DottedMap } from "@/components/ui/dotted-map";
import { cn } from "@/utils/cn";
import { flagUri } from "../lib/flag-uri";

const MAP_WIDTH = 210;
const MAP_HEIGHT = 140;

type MobileMarker = {
  code: string;
  label: string;
  tier: "primary" | "secondary";
  x: number;
  y: number;
  labelSide: "left" | "right";
};

const MOBILE_MARKERS: MobileMarker[] = [
  { code: "US", label: "United States", tier: "primary", x: 32, y: 31, labelSide: "right" },
  { code: "JP", label: "Japan", tier: "secondary", x: 178, y: 31, labelSide: "left" },
  { code: "CA", label: "Canada", tier: "secondary", x: 32, y: 70, labelSide: "right" },
  { code: "IN", label: "India", tier: "primary", x: 105, y: 70, labelSide: "left" },
  { code: "SG", label: "Singapore", tier: "secondary", x: 178, y: 70, labelSide: "left" },
  { code: "GB", label: "United Kingdom", tier: "secondary", x: 32, y: 109, labelSide: "right" },
  { code: "AU", label: "Australia", tier: "secondary", x: 178, y: 109, labelSide: "left" },
];

export function HeroWorldMapMobile() {
  return (
    <div className="landing-hero-map-mobile sm:hidden">
      <DottedMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        mapSamples={1200}
        dotRadius={0.32}
        dotColor="var(--landing-dot)"
        markers={[]}
      />
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {MOBILE_MARKERS.map((marker, index) => {
          const primary = marker.tier === "primary";
          const fw = primary ? 10 : 9;
          const fh = fw * (2 / 3);
          const anchor = marker.labelSide === "left" ? "end" : "start";
          const labelX =
            marker.labelSide === "left" ? marker.x - fw / 2 - 1.8 : marker.x + fw / 2 + 1.8;

          return (
            <g
              key={marker.code}
              className="landing-map-marker"
              style={{ "--landing-map-marker-delay": `${0.3 + index * 0.08}s` } as CSSProperties}
            >
              <image
                href={flagUri(marker.code)}
                x={marker.x - fw / 2}
                y={marker.y - fh / 2}
                width={fw}
                height={fh}
                preserveAspectRatio="xMidYMid slice"
              />
              <rect
                x={marker.x - fw / 2}
                y={marker.y - fh / 2}
                width={fw}
                height={fh}
                fill="none"
                stroke={primary ? "var(--brand-gold)" : "var(--landing-border-strong)"}
                strokeWidth="0.35"
              />
              <text
                x={labelX}
                y={marker.y + 1.6}
                textAnchor={anchor}
                fontSize={primary ? 4.8 : 4.4}
                className={cn(
                  "landing-market-marker-label",
                  primary
                    ? "landing-market-marker-label-primary"
                    : "landing-market-marker-label-secondary",
                )}
              >
                {marker.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
