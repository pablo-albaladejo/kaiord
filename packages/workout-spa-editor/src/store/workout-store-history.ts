import type { UIWorkout } from "../types/krd-ui";

const MAX_HISTORY_SIZE = 50;

type HistorySnapshotInput = {
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  // Optional to keep legacy test fixtures working. Production flows always
  // seed this via `createLoadWorkoutAction` / `createEmptyWorkoutAction`.
  // When missing, the push backfills the prefix with `null`s so the two
  // arrays never return drifted (the dev-mode drift-guard would still
  // flag the upstream offender for inspection).
  selectionHistory?: Array<string | null>;
};

type HistorySnapshotResult = {
  currentWorkout: UIWorkout;
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  selectionHistory: Array<string | null>;
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
  selection: string | null
): HistorySnapshotResult => {
  // Backfill the selection prefix to match the history prefix length so
  // the two arrays never drift — even when a legacy caller omits
  // `selectionHistory` on the input shape. Missing entries become `null`,
  // which is a safe sentinel ("no selection was active at that snapshot").
  const historyPrefix = state.workoutHistory.slice(0, state.historyIndex + 1);
  const selectionPrefix = historyPrefix.map(
    (_, index) => state.selectionHistory?.[index] ?? null
  );
  const newHistory = [...historyPrefix, uiWorkout];
  const newSelection = [...selectionPrefix, selection];

  // Cap both arrays at MAX_HISTORY_SIZE by dropping the oldest entries
  // from the head; the most-recent tail (the one the user just produced)
  // is what we keep, and both arrays stay aligned at the same length.
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
