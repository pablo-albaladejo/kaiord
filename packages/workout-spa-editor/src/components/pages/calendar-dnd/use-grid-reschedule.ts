/**
 * useGridReschedule — wires `usePointerDrag` to the calendar's shared move
 * flow (`useRequestMove`: same-sport check, then `moveSession`), so the
 * grid only reads the `bind` / `dropTargetId` API.
 */

import { useRequestMove } from "../session-move/SessionMoveProvider";
import { usePointerDrag } from "./use-pointer-drag";

export function useGridReschedule() {
  return usePointerDrag({ onDrop: useRequestMove() });
}
