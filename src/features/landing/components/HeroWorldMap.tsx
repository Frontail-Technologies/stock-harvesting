"use client";

import { motion } from "framer-motion";
import { AU, CA, EU, GB, IN, JP, SG, US } from "country-flag-icons/string/3x2";
import { DottedMap, type Marker } from "@/components/ui/dotted-map";
import { cn } from "@/utils/cn";

const MAP_WIDTH = 200;
const MAP_HEIGHT = 100;

// country-flag-icons ships each flag as a standalone SVG string — embed as a
// data URI so the flag renders as an <image> inside the map's own SVG,
// scaling with the map (an HTML overlay didn't respect the small size).
const FLAG_SVG: Record<string, string> = { IN, US, JP, AU, GB, CA, SG, EU };
const flagUri = (code: string) =>
  `data:image/svg+xml,${encodeURIComponent(FLAG_SVG[code])}`;

type CountryMarker = Marker & {
  code: string;
  label: string;
  tier: "primary" | "secondary" | "expanding";
  labelSide: "left" | "right";
  mobileHidden?: boolean;
};

// Country-level global context — India + US primary, a few more for reach,
// Europe as broader expansion. Exchange detail lives in 04 / Market Coverage.
const COUNTRY_MARKERS: CountryMarker[] = [
  { code: "IN", lat: 21.5, lng: 78.5, size: 0, label: "India", tier: "primary", labelSide: "left" },
  { code: "US", lat: 39.8, lng: -98.6, size: 0, label: "United States", tier: "primary", labelSide: "right" },
  { code: "JP", lat: 36.2, lng: 138.3, size: 0, label: "Japan", tier: "secondary", labelSide: "left" },
  { code: "AU", lat: -25.3, lng: 133.8, size: 0, label: "Australia", tier: "secondary", labelSide: "left" },
  { code: "GB", lat: 54, lng: -2.5, size: 0, label: "United Kingdom", tier: "secondary", labelSide: "right", mobileHidden: true },
  { code: "CA", lat: 56.1, lng: -106, size: 0, label: "Canada", tier: "secondary", labelSide: "right", mobileHidden: true },
  { code: "SG", lat: 1.35, lng: 103.8, size: 0, label: "Singapore", tier: "secondary", labelSide: "left", mobileHidden: true },
  { code: "EU", lat: 50, lng: 9, size: 0, label: "Europe", tier: "expanding", labelSide: "left", mobileHidden: true },
];

export function HeroWorldMap() {
  return (
    <div className="landing-hero-map">
      <DottedMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        mapSamples={6000}
        dotRadius={0.3}
        dotColor="rgb(255 255 255 / 0.1)"
        markers={COUNTRY_MARKERS}
        renderMarkerOverlay={({ marker, index, x, y }) => {
          const primary = marker.tier === "primary";
          const fw = primary ? 8 : 6.8;
          const fh = fw * (2 / 3);
          const anchor = marker.labelSide === "left" ? "end" : "start";
          const labelX =
            marker.labelSide === "left" ? x - fw / 2 - 1.6 : x + fw / 2 + 1.6;

          return (
            <motion.g
              className={marker.mobileHidden ? "max-sm:hidden" : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.08 }}
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
                stroke={primary ? "var(--brand-gold)" : "rgb(255 255 255 / 0.35)"}
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
            </motion.g>
          );
        }}
      />
    </div>
  );
}
