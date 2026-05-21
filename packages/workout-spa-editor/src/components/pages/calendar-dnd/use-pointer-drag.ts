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

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const bind = useCallback(
    (workoutId: string) => (event: React.PointerEvent) => {
      if (!enabled) return;
      // Always clear any in-flight hold timer before starting a new one,
      // otherwise a second pointerdown leaks the previous timeout and
      // `setActiveWorkoutId` can fire on the stale workout id.
      cancelHold();
      if (event.pointerType === "mouse") {
        setActiveWorkoutId(workoutId);
        return;
      }
      // Touch path: wait for the hold to elapse before activating drag.
      // If the user releases / scrolls away before the hold completes,
      // the global up/cancel listeners below clear the pending timeout.
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        setActiveWorkoutId(workoutId);
      }, TOUCH_HOLD_MS);
      const onEarlyRelease = () => {
        cancelHold();
        window.removeEventListener("pointerup", onEarlyRelease);
        window.removeEventListener("pointercancel", onEarlyRelease);
      };
      window.addEventListener("pointerup", onEarlyRelease, { once: true });
      window.addEventListener("pointercancel", onEarlyRelease, { once: true });
    },
    [enabled, cancelHold]
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
