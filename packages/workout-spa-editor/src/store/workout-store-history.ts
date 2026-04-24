import type { UIWorkout } from "../types/krd-ui";
import type { HistoryEntry, UndoHistory } from "./workout-state.types";

const MAX_HISTORY_SIZE = 50;

type HistorySnapshotInput = {
  undoHistory: UndoHistory;
  historyIndex: number;
};

type HistorySnapshotResult = {
  currentWorkout: UIWorkout;
  undoHistory: UndoHistory;
  historyIndex: number;
};

/**
 * Push a HistoryEntry onto the undo/redo history.
 *
 * Replaces the former parallel-array approach (`workoutHistory` +
 * `selectionHistory`). The length invariant is now structurally enforced
 * by the single `undoHistory: Array<HistoryEntry>` field — no runtime
 * assertion or CI grep required.
 *
 * DO NOT capture `pendingFocusTarget` here — undo/redo compute focus
 * targets at dispatch time via focus-rule helpers, not from saved targets.
 */
export const pushHistorySnapshot = (
  state: HistorySnapshotInput,
  entry: HistoryEntry
): HistorySnapshotResult => {
  const historyPrefix = state.undoHistory.slice(0, state.historyIndex + 1);
  const newHistory: UndoHistory = [...historyPrefix, entry];

  const overflow = Math.max(0, newHistory.length - MAX_HISTORY_SIZE);
  const trimmed: UndoHistory = overflow ? newHistory.slice(overflow) : newHistory;

  return {
    currentWorkout: entry.workout,
    undoHistory: trimmed,
    historyIndex: trimmed.length - 1,
  };
};
