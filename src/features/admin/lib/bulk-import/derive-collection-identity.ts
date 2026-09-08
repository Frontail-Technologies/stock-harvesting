const TRAILING_BRACKET_PATTERN = /\[([^\]]*)\]\s*\.*\s*$/;

function slugify(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeBseCollectionFilename(filename: string): { name: string; code: string } {
  const basename = filename.split(/[/\\]/).pop() ?? filename;

  let name = basename.replace(/\.csv$/i, "");

  const bracketMatch = name.match(TRAILING_BRACKET_PATTERN);
  const bracketContent = bracketMatch?.[1]?.trim() ?? "";

  name = name.replace(TRAILING_BRACKET_PATTERN, "");
  name = name.replace(/\s+/g, " ");
  name = name.replace(/^[\s.]+|[\s.]+$/g, "");

  const code = bracketContent.length > 0 ? slugify(bracketContent) : slugify(name);

  return { name, code };
}
