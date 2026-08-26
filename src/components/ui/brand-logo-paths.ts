import type { Theme } from "@/features/theme";

// Mark-only artwork (no wordmark baked in) - BrandLogo renders the "Stock
// Harvesting" text itself now, see brand-logo.tsx.
//
// The file names are the opposite of the theme they render on:
// logo-dark.png is the dark-ink mark, so it's used on light backgrounds
// (light theme), and logo-light.png is the light/white mark, used on dark
// backgrounds (dark theme).
export const BRAND_LOGO_PATHS = {
  light: "/images/logo-dark.png",
  dark: "/images/logo-light.png",
} as const;

export function getBrandLogoPath(theme: Theme | "light" | "dark") {
  return theme === "dark" ? BRAND_LOGO_PATHS.dark : BRAND_LOGO_PATHS.light;
}
