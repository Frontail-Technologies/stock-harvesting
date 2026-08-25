import { AU, CA, EU, GB, IN, JP, SG, US } from "country-flag-icons/string/3x2";

const FLAG_SVG: Record<string, string> = { IN, US, JP, AU, GB, CA, SG, EU };

export function flagUri(code: string) {
  return `data:image/svg+xml,${encodeURIComponent(FLAG_SVG[code])}`;
}
