import { type RefObject, useEffect } from "react";

import type { DragPreview } from "./drag-preview";
import {
  readDayElementFromPoint,
  readDayFromPoint,
} from "./use-pointer-drag-helpers";

type Args = {
  activeWorkoutId: string | null;
  enabled: boolean;
  previewRef: RefObject<DragPreview | null>;
  onDrop: (workoutId: string, targetDayISO: string) => void;
  reset: () => void;
  setDropTargetId: (id: string | null) => void;
};

export function useGlobalDragListeners({
  activeWorkoutId,
  enabled,
  previewRef,
  onDrop,
  reset,
  setDropTargetId,
}: Args): void {
  useEffect(() => {
    if (!enabled || !activeWorkoutId) return;
    const onMove = (e: PointerEvent) => {
      previewRef.current?.move(e.clientX, e.clientY);
      setDropTargetId(readDayFromPoint(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const dayEl = readDayElementFromPoint(e.clientX, e.clientY);
      const target = dayEl?.dataset.day ?? null;
      previewRef.current?.end(dayEl);
      previewRef.current = null;
      const sourceId = activeWorkoutId;
      reset();
      if (target && sourceId) onDrop(sourceId, target);
    };
    const onCancel = () => {
      previewRef.current?.end(null);
      previewRef.current = null;
      reset();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [activeWorkoutId, enabled, previewRef, onDrop, reset, setDropTargetId]);
}
