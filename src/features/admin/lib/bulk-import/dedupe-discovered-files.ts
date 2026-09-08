import type { DiscoveredFileDescriptor } from "./types";

export function discoveredFileIdentityKey(file: DiscoveredFileDescriptor): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

const identityKey = discoveredFileIdentityKey;

export function dedupeDiscoveredFiles<T extends DiscoveredFileDescriptor>(files: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const file of files) {
    const key = identityKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(file);
  }
  return deduped;
}
