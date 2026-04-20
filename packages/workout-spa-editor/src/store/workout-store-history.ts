import type { ItemId } from "./providers/item-id";
import type { UIWorkout } from "./workout-state.types";

export const MAX_HISTORY_SIZE = 50;

// DO NOT capture pendingFocusTarget here — undo/redo compute focus targets
// at dispatch time via focus-rule helpers.
type HistorySource = {
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  selectionHistory?: Array<ItemId | null>;
};

export type HistorySnapshotUpdate = {
  workoutHistory: Array<UIWorkout>;
  historyIndex: number;
  selectionHistory: Array<ItemId | null>;
};

const isDevMode = (): boolean => {
  const g = globalThis as { process?: { env?: { NODE_ENV?: string } } };
  const nodeEnv = g.process?.env?.NODE_ENV;
  if (nodeEnv !== undefined) return nodeEnv !== "production";
  const mode = (import.meta as { env?: { MODE?: string } }).env?.MODE;
  return mode !== "production";
};

const assertParallel = (
  history: ReadonlyArray<UIWorkout>,
  selection: ReadonlyArray<ItemId | null>
): void => {
  if (isDevMode() && history.length !== selection.length) {
    console.error(
      `[kaiord] History invariant violation: workoutHistory.length=${history.length}, selectionHistory.length=${selection.length}`
    );
  }
};

const trimToHistoryIndex = <T>(arr: Array<T>, index: number): Array<T> =>
  arr.slice(0, index + 1);

/**
 * Centralised chokepoint for appending a snapshot to the workout history
 * and its parallel selection-history array.
 *
 * Every mutating action MUST call this helper instead of pushing to
 * `workoutHistory` directly — a CI grep enforces that `workoutHistory.push`
 * appears nowhere else in the SPA.
 */
export const pushHistorySnapshot = (
  uiWorkout: UIWorkout,
  selection: ItemId | null,
  state: HistorySource
): HistorySnapshotUpdate => {
  const trimmedHistory = trimToHistoryIndex(
    state.workoutHistory,
    state.historyIndex
  );
  const trimmedSelection = trimToHistoryIndex(
    state.selectionHistory ?? [],
    state.historyIndex
  );

  trimmedHistory.push(uiWorkout);
  trimmedSelection.push(selection);

  const overflow = trimmedHistory.length - MAX_HISTORY_SIZE;
  const cappedHistory =
    overflow > 0 ? trimmedHistory.slice(overflow) : trimmedHistory;
  const cappedSelection =
    overflow > 0 ? trimmedSelection.slice(overflow) : trimmedSelection;

  assertParallel(cappedHistory, cappedSelection);

  return {
    workoutHistory: cappedHistory,
    historyIndex: cappedHistory.length - 1,
    selectionHistory: cappedSelection,
  };
};
