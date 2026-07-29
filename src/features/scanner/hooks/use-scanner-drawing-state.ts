"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCANNER_DRAWINGS_STORAGE_PREFIX } from "../constants/storage-keys";
import { DEFAULT_CURSOR_TOOL } from "../tools/cursor-tool-config";
import { defaultDrawingStyle } from "../tools/drawing-style-config";
import type {
  DrawingController,
  DrawingDraft,
  DrawingElement,
  DrawingToolId,
  Timeframe,
} from "../types";

function createDrawingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `drawing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDrawingBase() {
  const now = Date.now();
  return {
    id: createDrawingId(),
    locked: false,
    hidden: false,
    style: defaultDrawingStyle,
    createdAt: now,
    updatedAt: now,
  };
}

function storageKey(symbol: string, timeframe: Timeframe) {
  return `${SCANNER_DRAWINGS_STORAGE_PREFIX}:${symbol}:${timeframe}`;
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

export function useScannerDrawingState(
  symbol: string,
  timeframe: Timeframe
): DrawingController {
  const key = useMemo(() => storageKey(symbol, timeframe), [symbol, timeframe]);
  const [activeTool, setActiveTool] = useState<DrawingToolId>(DEFAULT_CURSOR_TOOL);
  const [crosshairActive, setCrosshairActive] = useState(true);
  const [magnetActive, setMagnetActive] = useState(false);
  const [drawings, setDrawings] = useState<DrawingElement[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as DrawingElement[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [draftDrawing, setDraftDrawing] = useState<DrawingDraft>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [past, setPast] = useState<DrawingElement[][]>([]);
  const [future, setFuture] = useState<DrawingElement[][]>([]);
  const editSnapshotRef = useRef<DrawingElement[] | null>(null);
  const visibleDrawingCount = useMemo(
    () => drawings.filter((drawing) => !drawing.hidden).length,
    [drawings]
  );
  const hiddenDrawingCount = useMemo(
    () => drawings.filter((drawing) => drawing.hidden).length,
    [drawings]
  );
  const allDrawingsHidden = drawings.length > 0 && visibleDrawingCount === 0;

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(drawings));
  }, [drawings, key]);

  const pushHistory = useCallback((snapshot: DrawingElement[]) => {
    setPast((current) => [...current.slice(-39), snapshot]);
    setFuture([]);
  }, []);

  const commitDrawing = useCallback(
    (drawing: DrawingElement) => {
      setDrawings((current) => {
        pushHistory(current);
        return [...current, { ...drawing, updatedAt: Date.now() }];
      });
      setDraftDrawing(null);
      setSelectedDrawingId(drawing.id);
      setActiveTool(DEFAULT_CURSOR_TOOL);
    },
    [pushHistory]
  );

  const replaceDrawings = useCallback((nextDrawings: DrawingElement[]) => {
    setDrawings(nextDrawings);
    setDraftDrawing(null);
    setSelectedDrawingId(null);
    setPast([]);
    setFuture([]);
  }, []);

  const beginEdit = useCallback(() => {
    setDrawings((current) => {
      if (!editSnapshotRef.current) {
        editSnapshotRef.current = current;
        pushHistory(current);
      }
      return current;
    });
  }, [pushHistory]);

  const updateDrawing = useCallback(
    (id: string, updater: (drawing: DrawingElement) => DrawingElement) => {
      setDrawings((current) =>
        current.map((drawing) =>
          drawing.id === id
            ? { ...updater(drawing), id: drawing.id, updatedAt: Date.now() }
            : drawing
        )
      );
    },
    []
  );

  const finishEdit = useCallback(() => {
    editSnapshotRef.current = null;
  }, []);

  const deleteSelected = useCallback(() => {
    setDrawings((current) => {
      if (!selectedDrawingId) return current;
      const selected = current.find((drawing) => drawing.id === selectedDrawingId);
      if (!selected || selected.locked) return current;
      pushHistory(current);
      return current.filter((drawing) => drawing.id !== selectedDrawingId);
    });
    setSelectedDrawingId(null);
  }, [pushHistory, selectedDrawingId]);

  const clearDrawings = useCallback(() => {
    setDrawings((current) => {
      if (current.length === 0) return current;
      pushHistory(current);
      return [];
    });
    setDraftDrawing(null);
    setSelectedDrawingId(null);
  }, [pushHistory]);

  const toggleSelectedLock = useCallback(() => {
    if (!selectedDrawingId) return;
    setDrawings((current) => {
      const selected = current.find((drawing) => drawing.id === selectedDrawingId);
      if (!selected) return current;
      pushHistory(current);
      return current.map((drawing) =>
        drawing.id === selectedDrawingId
          ? { ...drawing, locked: !drawing.locked, updatedAt: Date.now() }
          : drawing
      );
    });
  }, [pushHistory, selectedDrawingId]);

  const toggleSelectedHidden = useCallback(() => {
    if (!selectedDrawingId) return;
    setDrawings((current) => {
      const selected = current.find((drawing) => drawing.id === selectedDrawingId);
      if (!selected) return current;
      pushHistory(current);
      return current.map((drawing) =>
        drawing.id === selectedDrawingId
          ? { ...drawing, hidden: !drawing.hidden, updatedAt: Date.now() }
          : drawing
      );
    });
  }, [pushHistory, selectedDrawingId]);

  const hideAllDrawings = useCallback(() => {
    setDrawings((current) => {
      if (!current.some((drawing) => !drawing.hidden)) return current;
      pushHistory(current);
      return current.map((drawing) =>
        drawing.hidden
          ? drawing
          : { ...drawing, hidden: true, updatedAt: Date.now() }
      );
    });
    setSelectedDrawingId(null);
  }, [pushHistory]);

  const showAllDrawings = useCallback(() => {
    setDrawings((current) => {
      if (!current.some((drawing) => drawing.hidden)) return current;
      pushHistory(current);
      return current.map((drawing) =>
        drawing.hidden
          ? { ...drawing, hidden: false, updatedAt: Date.now() }
          : drawing
      );
    });
    setSelectedDrawingId(null);
  }, [pushHistory]);

  const showHiddenDrawings = showAllDrawings;

  const toggleAllDrawingsVisibility = useCallback(() => {
    setDrawings((current) => {
      if (current.length === 0) return current;
      const hasVisibleDrawings = current.some((drawing) => !drawing.hidden);
      pushHistory(current);
      return current.map((drawing) => ({
        ...drawing,
        hidden: hasVisibleDrawings,
        updatedAt: Date.now(),
      }));
    });
    setSelectedDrawingId(null);
  }, [pushHistory]);

  const undo = useCallback(() => {
    setPast((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      setFuture((currentFuture) => [drawings, ...currentFuture]);
      setDrawings(previous);
      setSelectedDrawingId(null);
      setDraftDrawing(null);
      return currentPast.slice(0, -1);
    });
  }, [drawings]);

  const redo = useCallback(() => {
    setFuture((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const next = currentFuture[0];
      setPast((currentPast) => [...currentPast, drawings]);
      setDrawings(next);
      setSelectedDrawingId(null);
      setDraftDrawing(null);
      return currentFuture.slice(1);
    });
  }, [drawings]);

  useEffect(() => {
    const onPointerUp = () => finishEdit();
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) return;

      if (event.key === "Escape") {
        setDraftDrawing(null);
        setActiveTool(DEFAULT_CURSOR_TOOL);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
      }
    };

    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteSelected, finishEdit, redo, undo]);

  return {
    activeTool,
    crosshairActive,
    magnetActive,
    drawings,
    draftDrawing,
    selectedDrawingId,
    visibleDrawingCount,
    hiddenDrawingCount,
    allDrawingsHidden,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    setActiveTool,
    toggleCrosshair: () => setCrosshairActive((current) => !current),
    toggleMagnet: () => setMagnetActive((current) => !current),
    setDraftDrawing,
    replaceDrawings,
    commitDrawing,
    cancelDraft: () => setDraftDrawing(null),
    selectDrawing: setSelectedDrawingId,
    beginEdit,
    updateDrawing,
    deleteSelected,
    clearDrawings,
    toggleSelectedLock,
    toggleSelectedHidden,
    hideAllDrawings,
    showHiddenDrawings,
    showAllDrawings,
    toggleAllDrawingsVisibility,
    undo,
    redo,
  };
}
