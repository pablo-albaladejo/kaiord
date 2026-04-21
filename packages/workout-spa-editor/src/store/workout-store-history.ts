import type { UIWorkout } from "../types/krd-ui";
import type { ItemId } from "./providers/item-id";

const MAX_HISTORY_SIZE = 50;

type HistorySnapshotInput = {
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  // Optional to keep legacy test fixtures working. Production flows always
  // seed this via `createLoadWorkoutAction` / `createEmptyWorkoutAction`;
  // the dev-mode length-drift assert below flags any leakage of a fixture
  // that forgets to seed it.
  selectionHistory?: Array<ItemId | null>;
};

type HistorySnapshotResult = {
  currentWorkout: UIWorkout;
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  selectionHistory: Array<ItemId | null>;
};

/**
 * Push a UIWorkout snapshot onto the undo/redo history, keeping
 * `selectionHistory` exactly parallel to `workoutHistory` so undo of
 * add/paste/duplicate can restore focus to the item that was selected
 * immediately before the undone mutation.
 *
 * This is the ONLY function that appends to `workoutHistory`. Every
 * mutating action routes its push through here so the two arrays can
 * never drift in length. A CI grep invariant enforces the single-call-site
 * rule (see `.github/workflows/ci.yml`).
 *
 * DO NOT capture `pendingFocusTarget` here — undo/redo compute focus
 * targets at dispatch time via focus-rule helpers (§5 / §6), not from
 * saved targets.
 */
export const pushHistorySnapshot = (
  state: HistorySnapshotInput,
  uiWorkout: UIWorkout,
  selection: ItemId | null
): HistorySnapshotResult => {
  const newHistory = [
    ...state.workoutHistory.slice(0, state.historyIndex + 1),
    uiWorkout,
  ];
  const currentSelection = state.selectionHistory ?? [];
  const newSelection = [
    ...currentSelection.slice(0, state.historyIndex + 1),
    selection,
  ];

  // Trim to MAX_HISTORY_SIZE from the tail, keeping both arrays aligned.
  const overflow = Math.max(0, newHistory.length - MAX_HISTORY_SIZE);
  const trimmedHistory = overflow ? newHistory.slice(overflow) : newHistory;
  const trimmedSelection = overflow
    ? newSelection.slice(overflow)
    : newSelection;

  if (
    import.meta.env.MODE !== "production" &&
    trimmedHistory.length !== trimmedSelection.length
  ) {
    // Load-bearing invariant: undo/redo fallback rules index into both
    // arrays by the same `historyIndex`. Flag loudly at dev time; never
    // throw (callers must not crash mid-mutation over a logging issue).
    console.error(
      `[pushHistorySnapshot] history length drift: workoutHistory=${trimmedHistory.length} selectionHistory=${trimmedSelection.length}`
    );
  }

  return {
    currentWorkout: uiWorkout,
    workoutHistory: trimmedHistory,
    historyIndex: trimmedHistory.length - 1,
    selectionHistory: trimmedSelection,
  };
};
