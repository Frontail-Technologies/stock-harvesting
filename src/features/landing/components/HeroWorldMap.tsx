import type { CSSProperties } from "react";
import { DottedMap, type Marker } from "@/components/ui/dotted-map";
import { cn } from "@/utils/cn";
import { flagUri } from "../lib/flag-uri";

const MAP_WIDTH = 200;
const MAP_HEIGHT = 100;

type CountryMarker = Marker & {
  code: string;
  label: string;
  tier: "primary" | "secondary" | "expanding";
  labelSide: "left" | "right";
};

const COUNTRY_MARKERS: CountryMarker[] = [
  { code: "IN", lat: 21.5, lng: 78.5, size: 0, label: "India", tier: "primary", labelSide: "left" },
  { code: "US", lat: 39.8, lng: -98.6, size: 0, label: "United States", tier: "primary", labelSide: "right" },
  { code: "JP", lat: 36.2, lng: 138.3, size: 0, label: "Japan", tier: "secondary", labelSide: "left" },
  { code: "AU", lat: -25.3, lng: 133.8, size: 0, label: "Australia", tier: "secondary", labelSide: "left" },
  { code: "GB", lat: 54, lng: -2.5, size: 0, label: "United Kingdom", tier: "secondary", labelSide: "right" },
  { code: "CA", lat: 56.1, lng: -106, size: 0, label: "Canada", tier: "secondary", labelSide: "right" },
  { code: "SG", lat: 1.35, lng: 103.8, size: 0, label: "Singapore", tier: "secondary", labelSide: "left" },
  { code: "EU", lat: 50, lng: 9, size: 0, label: "Europe", tier: "expanding", labelSide: "left" },
];

export function HeroWorldMap() {
  return (
    <div className="landing-hero-map hidden sm:block">
      <DottedMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        mapSamples={2400}
        dotRadius={0.3}
        dotColor="var(--landing-dot)"
        markers={COUNTRY_MARKERS}
        renderMarkerOverlay={({ marker, index, x, y }) => {
          const primary = marker.tier === "primary";
          const fw = primary ? 8 : 6.8;
          const fh = fw * (2 / 3);
          const anchor = marker.labelSide === "left" ? "end" : "start";
          const labelX = marker.labelSide === "left" ? x - fw / 2 - 1.6 : x + fw / 2 + 1.6;

          return (
            <g
              className="landing-map-marker"
              style={{ "--landing-map-marker-delay": `${0.3 + index * 0.08}s` } as CSSProperties}
            >
              <image
                href={flagUri(marker.code)}
                x={x - fw / 2}
                y={y - fh / 2}
                width={fw}
                height={fh}
                preserveAspectRatio="xMidYMid slice"
              />
              <rect
                x={x - fw / 2}
                y={y - fh / 2}
                width={fw}
                height={fh}
                fill="none"
                stroke={primary ? "var(--brand-gold)" : "var(--landing-border-strong)"}
                strokeWidth="0.3"
              />
              <text
                x={labelX}
                y={y + 0.9}
                textAnchor={anchor}
                fontSize={primary ? 2.4 : 2}
                className={cn(
                  "landing-market-marker-label",
                  primary
                    ? "landing-market-marker-label-primary"
                    : marker.tier === "secondary"
                      ? "landing-market-marker-label-secondary"
                      : "landing-market-marker-label-tertiary",
                )}
              >
                {marker.label}
              </text>
            </g>
          );
        }}
      />
    </div>
  );
}

