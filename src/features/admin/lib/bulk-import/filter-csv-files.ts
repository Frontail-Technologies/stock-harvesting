import type { DiscoveredFileDescriptor } from "./types";

export function filterCsvFiles<T extends DiscoveredFileDescriptor>(
  files: T[]
): { csvFiles: T[]; ignoredCount: number } {
  const csvFiles = files.filter((file) => /\.csv$/i.test(file.name));
  return { csvFiles, ignoredCount: files.length - csvFiles.length };
}
