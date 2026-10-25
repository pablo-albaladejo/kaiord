/**
 * useGridReschedule — wires `usePointerDrag` to `moveSession` backed by
 * Dexie (`useGridMove`), so the grid only reads the `bind` /
 * `dropTargetId` API. This hook is the drag's composition root.
 */

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { useGridMove } from "./use-grid-move";
import { usePointerDrag } from "./use-pointer-drag";

const dexiePersistence = () => createDexiePersistence(db);

export function useGridReschedule() {
  return usePointerDrag({ onDrop: useGridMove(dexiePersistence) });
}
