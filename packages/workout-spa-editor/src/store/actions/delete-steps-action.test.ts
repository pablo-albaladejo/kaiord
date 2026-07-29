/**
 * Bulk (multi-selection) delete — store-level contract.
 *
 * The reindex trap: `deleteStepAction` reindexes the whole list after
 * every call, so `indices.forEach(deleteStep)` removes the WRONG steps
 * from the second iteration onward. These tests pin the correct
 * filter-once / reindex-once semantics, one history snapshot, and one
 * grouped undo.
 */

import { beforeEach, describe, expect, it } from "vitest";

import type { KRD, WorkoutStep } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";

const STEP_COUNT = 5;
const SECONDS_PER_STEP = 10;
const UNMATCHED_STEP_INDEX = 99;

// Ordinal positions, named so the assertions read as "delete the 2nd and
// 4th; the 1st, 3rd and 5th survive".
const FIRST = 0;
const SECOND = 1;
const THIRD = 2;
const FOURTH = 3;
const FIFTH = 4;

/** Step i is identifiable by its duration: (i + 1) * SECONDS_PER_STEP. */
const secondsFor = (position: number): number =>
  (position + 1) * SECONDS_PER_STEP;

/** Expected duration fingerprint for a given set of surviving originals. */
const survivors = (...positions: Array<number>): Array<number> =>
  positions.map(secondsFor);

const step = (stepIndex: number) => ({
  stepIndex,
  durationType: "time",
  duration: { type: "time", seconds: secondsFor(stepIndex) },
  targetType: "open",
});

const makeKrd = (count: number): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "Bulk delete fixture",
        sport: "cycling",
        steps: Array.from({ length: count }, (_, i) => step(i)),
      },
    },
  }) as unknown as KRD;

const currentSteps = () =>
  useWorkoutStore.getState().currentWorkout?.extensions?.structured_workout
    ?.steps ?? [];

/** Identity fingerprint of the surviving steps, in list order. */
const secondsOf = (): Array<number> =>
  currentSteps().map(
    (s) =>
      (s as WorkoutStep & { duration: { seconds: number } }).duration.seconds
  );

const stepIndicesOf = (): Array<number> =>
  currentSteps().map((s) => (s as WorkoutStep).stepIndex);

describe("deleteSteps (bulk multi-selection delete)", () => {
  beforeEach(() => {
    useWorkoutStore.getState().loadWorkout(makeKrd(STEP_COUNT));
    // `loadWorkout` deliberately does not clear the delete trail (a
    // pre-existing quirk), so reset it here to keep each case hermetic.
    useWorkoutStore.setState({ deletedSteps: [] });
  });

  it("should delete exactly the selected steps, not reindexed neighbours", () => {
    // Arrange
    const before = secondsOf();

    // Act
    useWorkoutStore.getState().deleteSteps([SECOND, FOURTH]);

    // Assert
    expect(before).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH, FIFTH));
    expect(secondsOf()).toEqual(survivors(FIRST, THIRD, FIFTH));
  });

  it("should reindex the survivors exactly once into a dense range", () => {
    // Arrange

    // Act
    useWorkoutStore.getState().deleteSteps([SECOND, FOURTH]);

    // Assert
    expect(stepIndicesOf()).toEqual([FIRST, SECOND, THIRD]);
  });

  it("should push exactly one history snapshot for the whole bulk delete", () => {
    // Arrange
    const before = useWorkoutStore.getState().historyIndex;

    // Act
    useWorkoutStore.getState().deleteSteps([FIRST, THIRD, FIFTH]);

    // Assert
    expect(useWorkoutStore.getState().historyIndex).toBe(before + 1);
  });

  it("should restore every deleted step from a single grouped undo", () => {
    // Arrange
    useWorkoutStore.getState().deleteSteps([SECOND, FOURTH]);
    const trail = useWorkoutStore.getState().deletedSteps ?? [];
    const groupIds = [...new Set(trail.map((d) => d.groupId))];

    // Act
    useWorkoutStore.getState().undoDelete(groupIds[0]!);

    // Assert
    expect(groupIds).toHaveLength(1);
    expect(secondsOf()).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH, FIFTH));
  });

  it("should restore non-contiguous deletions to their original positions", () => {
    // Arrange
    useWorkoutStore.getState().deleteSteps([FIRST, THIRD, FIFTH]);
    const groupId = (useWorkoutStore.getState().deletedSteps ?? [])[0]!.groupId;

    // Act
    useWorkoutStore.getState().undoDelete(groupId);

    // Assert
    expect(secondsOf()).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH, FIFTH));
  });

  it("should drain the whole group from the undo trail in one undo", () => {
    // Arrange
    useWorkoutStore.getState().deleteSteps([SECOND, FOURTH]);
    const groupId = (useWorkoutStore.getState().deletedSteps ?? [])[0]!.groupId;

    // Act
    useWorkoutStore.getState().undoDelete(groupId);

    // Assert
    expect(useWorkoutStore.getState().deletedSteps ?? []).toHaveLength(0);
  });

  it("should keep two same-millisecond deletes independently undoable", () => {
    // Arrange
    useWorkoutStore.getState().deleteSteps([FIFTH]);
    useWorkoutStore.getState().deleteSteps([FIRST]);
    const trail = useWorkoutStore.getState().deletedSteps ?? [];

    // Act
    const groupIds = new Set(trail.map((d) => d.groupId));

    // Assert
    expect(trail).toHaveLength(2);
    expect(groupIds.size).toBe(2);
  });

  it("should undo only the addressed group when two groups share a timestamp", () => {
    // Arrange
    useWorkoutStore.getState().deleteSteps([FIFTH]);
    useWorkoutStore.getState().deleteSteps([FIRST]);
    const trail = useWorkoutStore.getState().deletedSteps ?? [];
    const secondGroup = trail[1]!.groupId;

    // Act
    useWorkoutStore.getState().undoDelete(secondGroup);

    // Assert
    expect(secondsOf()).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH));
    expect(useWorkoutStore.getState().deletedSteps ?? []).toHaveLength(1);
  });

  it("should ignore indices that match no step", () => {
    // Arrange

    // Act
    useWorkoutStore.getState().deleteSteps([SECOND, UNMATCHED_STEP_INDEX]);

    // Assert
    expect(secondsOf()).toEqual(survivors(FIRST, THIRD, FOURTH, FIFTH));
  });

  it("should leave the workout untouched for an empty selection", () => {
    // Arrange
    const before = useWorkoutStore.getState().historyIndex;

    // Act
    useWorkoutStore.getState().deleteSteps([]);

    // Assert
    expect(secondsOf()).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH, FIFTH));
    expect(useWorkoutStore.getState().historyIndex).toBe(before);
  });
});
