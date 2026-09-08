export type CollectedFile = { file: File; relativePath: string };

type WebkitEntryItem = DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null };

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const collected: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(collected);
          return;
        }
        collected.push(...batch);
        readBatch();
      }, reject);
    };
    readBatch();
  });
}

async function walkEntry(entry: FileSystemEntry, path: string, out: CollectedFile[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    out.push({ file, relativePath: path });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readAllEntries(reader);
    for (const child of entries) {
      await walkEntry(child, `${path}/${child.name}`, out);
    }
  }
}

export async function collectFilesFromDataTransferItems(items: DataTransferItemList): Promise<CollectedFile[]> {
  const out: CollectedFile[] = [];
  const itemArray = Array.from(items) as WebkitEntryItem[];

  for (const item of itemArray) {
    const entry = typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null;
    if (entry) {
      await walkEntry(entry, entry.name, out);
      continue;
    }
    const file = item.getAsFile();
    if (file) out.push({ file, relativePath: file.name });
  }

  return out;
}
