import { useEffect } from "react";

import { readDayFromPoint } from "./use-pointer-drag-helpers";

type Args = {
  activeWorkoutId: string | null;
  enabled: boolean;
  onDrop: (workoutId: string, targetDayISO: string) => void;
  reset: () => void;
  setDropTargetId: (id: string | null) => void;
};

export function useGlobalDragListeners({
  activeWorkoutId,
  enabled,
  onDrop,
  reset,
  setDropTargetId,
}: Args): void {
  useEffect(() => {
    if (!enabled || !activeWorkoutId) return;
    const onMove = (e: PointerEvent) => {
      setDropTargetId(readDayFromPoint(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const target = readDayFromPoint(e.clientX, e.clientY);
      const sourceId = activeWorkoutId;
      reset();
      if (target && sourceId) onDrop(sourceId, target);
    };
    const onCancel = () => reset();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [activeWorkoutId, enabled, onDrop, reset, setDropTargetId]);
}
