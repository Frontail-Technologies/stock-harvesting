export function findDuplicateCodeIds<T extends { id: string; code: string }>(items: T[]): Set<string> {
  const idsByCode = new Map<string, string[]>();
  for (const item of items) {
    const ids = idsByCode.get(item.code) ?? [];
    ids.push(item.id);
    idsByCode.set(item.code, ids);
  }

  const duplicateIds = new Set<string>();
  for (const ids of idsByCode.values()) {
    if (ids.length > 1) {
      for (const id of ids) duplicateIds.add(id);
    }
  }
  return duplicateIds;
}
