/**
 * usePointerDrag — low-level pointer-events drag hook for the calendar
 * Grid view.
 *
 * Gated to `window.matchMedia("(min-width: 768px)").matches`. On touch
 * devices the drag only initiates after a 200 ms hold so vertical page
 * scroll is not hijacked.
 *
 * The hook does not own the persistence call — callers pass an `onDrop`
 * callback which receives the source workout id and the day-ISO read
 * from a `[data-day]` attribute on the element under the pointer. The
 * caller is also responsible for catching persistence errors and
 * showing a toast; the hook only orchestrates the gesture and the
 * drop-target highlight.
 */

import { useCallback, useRef, useState } from "react";

import { useGlobalDragListeners } from "./use-global-drag-listeners";
import { isDesktopViewport, TOUCH_HOLD_MS } from "./use-pointer-drag-helpers";

export type UsePointerDragArgs = {
  onDrop: (workoutId: string, targetDayISO: string) => void;
};

export type UsePointerDragApi = {
  /** Active source workout id while a drag is in progress (else null). */
  activeWorkoutId: string | null;
  /** The day ISO currently under the pointer (else null). */
  dropTargetId: string | null;
  /** Returns the `onPointerDown` handler to wire onto a draggable card. */
  bind: (workoutId: string) => (event: React.PointerEvent) => void;
};

export function usePointerDrag({
  onDrop,
}: UsePointerDragArgs): UsePointerDragApi {
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabled = isDesktopViewport();

  const reset = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setActiveWorkoutId(null);
    setDropTargetId(null);
  }, []);

  const bind = useCallback(
    (workoutId: string) => (event: React.PointerEvent) => {
      if (!enabled) return;
      if (event.pointerType === "mouse") {
        setActiveWorkoutId(workoutId);
        return;
      }
      holdTimerRef.current = setTimeout(() => {
        setActiveWorkoutId(workoutId);
      }, TOUCH_HOLD_MS);
    },
    [enabled]
  );

  useGlobalDragListeners({
    activeWorkoutId,
    enabled,
    onDrop,
    reset,
    setDropTargetId,
  });

  return { activeWorkoutId, dropTargetId, bind };
}
