/**
 * useGridReschedule — wires `usePointerDrag` to the calendar's shared move
 * flow (`useRequestMove`: same-sport check, then `moveSession`), so the
 * grid only reads the `bind` / `dropTargetId` API. Outside the flow there
 * is no drop handler, and `bind` is withheld so no card is draggable.
 */

import { useRequestMove } from "../../../contexts/session-move-context";
import { usePointerDrag } from "./use-pointer-drag";

const noDrop = () => undefined;

export function useGridReschedule() {
  const requestMove = useRequestMove();
  const drag = usePointerDrag({ onDrop: requestMove ?? noDrop });
  return { ...drag, bind: requestMove ? drag.bind : undefined };
}
