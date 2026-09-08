export type QueueFileState =
  | "ready"
  | "invalid"
  | "duplicate_code"
  | "waiting"
  | "importing"
  | "imported"
  | "partial"
  | "failed";

export type QueueItem = {
  id: string;
  file: File;
  relativePath: string;
  name: string;
  code: string;
  rawRowCount: number;
  state: QueueFileState;
  existingCollectionId?: string | null;
  matchedCount?: number;
  unmatchedSymbols?: string[];
  invalidCount?: number;
  errorMessage?: string;
};
