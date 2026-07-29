import type { DrawingElement } from "../types";
import type { BackendDrawingRow } from "../api/scanner-api.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toTimestamp(value: string, fallback: number) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : fallback;
}

export function fromBackendDrawingRow(row: BackendDrawingRow): DrawingElement | null {
  if (!row.payload || typeof row.payload !== "object") return null;

  const now = Date.now();
  const drawing = {
    ...row.payload,
    id: row.id,
    type: row.drawingType,
    locked: row.locked,
    hidden: row.hidden,
    createdAt: toTimestamp(row.createdAt, now),
    updatedAt: toTimestamp(row.updatedAt, now),
  };

  return drawing as DrawingElement;
}

export function fromBackendDrawingRows(rows: BackendDrawingRow[]) {
  return rows
    .map(fromBackendDrawingRow)
    .filter((drawing): drawing is DrawingElement => Boolean(drawing));
}

export function toBackendDrawingPayload(drawing: DrawingElement) {
  return {
    id: UUID_PATTERN.test(drawing.id) ? drawing.id : undefined,
    drawingType: drawing.type,
    payload: drawing as unknown as Record<string, unknown>,
    locked: drawing.locked,
    hidden: drawing.hidden,
  };
}
