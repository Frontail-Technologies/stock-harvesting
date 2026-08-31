import type { Theme } from "@/features/theme";

export const BRAND_LOGO_PATHS = {
  light: "/images/logo-dark.png",
  dark: "/images/logo-light.png",
} as const;

export function getBrandLogoPath(theme: Theme | "light" | "dark") {
  return theme === "dark" ? BRAND_LOGO_PATHS.dark : BRAND_LOGO_PATHS.light;
}
