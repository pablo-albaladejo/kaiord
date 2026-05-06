/**
 * History selectors
 *
 * Hooks for the editor undo/redo history (Requirement 15). `useCanUndo`
 * and `useCanRedo` invoke methods on the store (the selector returns a
 * boolean), so they re-evaluate on each store change.
 */

import { useWorkoutStore } from "../workout-store";

export const useCanUndo = () => useWorkoutStore((state) => state.canUndo());

export const useCanRedo = () => useWorkoutStore((state) => state.canRedo());

export const useUndo = () => useWorkoutStore((state) => state.undo);

export const useRedo = () => useWorkoutStore((state) => state.redo);
