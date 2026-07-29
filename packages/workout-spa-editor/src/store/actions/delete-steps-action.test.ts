/**
 * Bulk (multi-selection) delete — store-level contract.
 *
 * The reindex trap: `deleteStepAction` reindexes the whole list after
 * every call, so `indices.forEach(deleteStep)` removes the WRONG steps
 * from the second iteration onward. These tests pin the correct
 * filter-once / reindex-once semantics, one history snapshot, and one
 * grouped undo.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KRD, WorkoutStep } from "../../types/krd";
import { useWorkoutStore } from "../workout-store";

const STEP_COUNT = 5;
const SECONDS_PER_STEP = 10;
const UNMATCHED_STEP_INDEX = 99;
/** Any fixed instant; only its constancy matters. */
const FROZEN_CLOCK = new Date("2026-01-01T00:00:00.000Z");

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

/** Identity fingerprint of the surviving top-level steps, in list order. */
const secondsOf = (): Array<number> =>
  currentSteps()
    .filter((s) => (s as { duration?: unknown }).duration !== undefined)
    .map(
      (s) =>
        (s as WorkoutStep & { duration: { seconds: number } }).duration.seconds
    );

/**
 * Order fingerprint including blocks: "B" for a repetition block,
 * duration seconds for a step. Position of the block is what makes this
 * distinguishable from `secondsOf`.
 */
const shapeOf = (): Array<string> =>
  currentSteps().map((s) => {
    const seconds = (s as { duration?: { seconds: number } }).duration;
    return seconds ? String(seconds.seconds) : "B";
  });

const stepIndicesOf = (): Array<number> =>
  currentSteps().map((s) => (s as WorkoutStep).stepIndex);

// A block PRECEDING top-level steps is the state where the two index
// spaces come apart: `recalculateStepIndices` numbers block children
// into the top-level sequence, so a block of two children pushes the
// first top-level step to stepIndex 2 while it still sits at array
// position 1. Every plain-steps fixture has arrayIndex === stepIndex and
// therefore cannot tell a correct implementation from one that confuses
// the two. Reachable through plain UI: select two steps, cmd-G, paste.
const BLOCK_CHILDREN = 2;

const makeKrdWithLeadingBlock = (): KRD =>
  ({
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-15T10:30:00Z", sport: "cycling" },
    extensions: {
      structured_workout: {
        name: "Leading-block fixture",
        sport: "cycling",
        steps: [
          {
            id: "block-uuid",
            repeatCount: 3,
            steps: Array.from({ length: BLOCK_CHILDREN }, (_, i) => step(i)),
          },
          // stepIndex continues the top-level sequence after the block's
          // children; array positions are 1, 2, 3.
          step(BLOCK_CHILDREN),
          step(BLOCK_CHILDREN + 1),
          step(BLOCK_CHILDREN + 2),
        ],
      },
    },
  }) as unknown as KRD;

describe("deleteSteps in the divergent index state (block first)", () => {
  beforeEach(() => {
    useWorkoutStore.getState().loadWorkout(makeKrdWithLeadingBlock());
    useWorkoutStore.setState({ deletedSteps: [] });
  });

  it("should delete the step addressed by stepIndex, not by array position", () => {
    // Arrange
    const before = secondsOf();

    // Act
    // stepIndex 2 is the FIRST top-level step; array position 1.
    useWorkoutStore.getState().deleteSteps([BLOCK_CHILDREN]);

    // Assert
    expect(before).toEqual(survivors(THIRD, FOURTH, FIFTH));
    expect(secondsOf()).toEqual(survivors(FOURTH, FIFTH));
  });

  it("should restore a leading-block deletion at its original position", () => {
    // Arrange
    const before = shapeOf();
    useWorkoutStore.getState().deleteSteps([BLOCK_CHILDREN]);
    const groupId = (useWorkoutStore.getState().deletedSteps ?? [])[0]!.groupId;

    // Act
    useWorkoutStore.getState().undoDelete(groupId);

    // Assert
    expect(before).toEqual(["B", "30", "40", "50"]);
    expect(shapeOf()).toEqual(before);
  });

  it("should restore a non-contiguous group after the block in original order", () => {
    // Arrange
    const before = shapeOf();
    useWorkoutStore
      .getState()
      .deleteSteps([BLOCK_CHILDREN, BLOCK_CHILDREN + 2]);

    // Act
    const groupId = (useWorkoutStore.getState().deletedSteps ?? [])[0]!.groupId;
    useWorkoutStore.getState().undoDelete(groupId);

    // Assert
    expect(shapeOf()).toEqual(before);
  });

  it("should keep the block at the head after delete and undo", () => {
    // Arrange
    useWorkoutStore.getState().deleteSteps([BLOCK_CHILDREN]);
    const groupId = (useWorkoutStore.getState().deletedSteps ?? [])[0]!.groupId;

    // Act
    useWorkoutStore.getState().undoDelete(groupId);

    // Assert
    expect(shapeOf()[0]).toBe("B");
  });
});

describe("deleteSteps (bulk multi-selection delete)", () => {
  beforeEach(() => {
    useWorkoutStore.getState().loadWorkout(makeKrd(STEP_COUNT));
    // `loadWorkout` deliberately does not clear the delete trail (a
    // pre-existing quirk), so reset it here to keep each case hermetic.
    useWorkoutStore.setState({ deletedSteps: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("should keep two same-millisecond bulk deletes independently undoable", () => {
    // Arrange
    // Freeze the clock so both deletes genuinely land in one millisecond
    // — the collision that made a timestamp-keyed undo lose data.
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_CLOCK);
    useWorkoutStore.getState().deleteSteps([FIFTH]);
    useWorkoutStore.getState().deleteSteps([FIRST]);
    const trail = useWorkoutStore.getState().deletedSteps ?? [];

    // Act
    const timestamps = new Set(trail.map((d) => d.timestamp));
    const groupIds = new Set(trail.map((d) => d.groupId));

    // Assert
    expect(trail).toHaveLength(2);
    // The hazard is real in this fixture...
    expect(timestamps.size).toBe(1);
    // ...and the group key survives it.
    expect(groupIds.size).toBe(2);
  });

  it("should keep two same-millisecond singular deletes independently undoable", () => {
    // Arrange
    // The pre-existing data-loss path: two per-step deletes, one toast
    // each, both keyed on the same clock read.
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_CLOCK);
    useWorkoutStore.getState().deleteStep(FIFTH);
    useWorkoutStore.getState().deleteStep(FIRST);
    const trail = useWorkoutStore.getState().deletedSteps ?? [];

    // Act
    const timestamps = new Set(trail.map((d) => d.timestamp));
    const groupIds = new Set(trail.map((d) => d.groupId));

    // Assert
    expect(trail).toHaveLength(2);
    expect(timestamps.size).toBe(1);
    expect(groupIds.size).toBe(2);
  });

  it("should undo only the addressed group when two groups share a timestamp", () => {
    // Arrange
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_CLOCK);
    useWorkoutStore.getState().deleteSteps([FIFTH]);
    useWorkoutStore.getState().deleteSteps([FIRST]);
    const trail = useWorkoutStore.getState().deletedSteps ?? [];
    const secondGroup = trail[1]!.groupId;

    // Act
    useWorkoutStore.getState().undoDelete(secondGroup);

    // Assert
    expect(new Set(trail.map((d) => d.timestamp)).size).toBe(1);
    expect(secondsOf()).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH));
    expect(useWorkoutStore.getState().deletedSteps ?? []).toHaveLength(1);
  });

  it("should restore both same-millisecond deletes across two undos", () => {
    // Arrange
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_CLOCK);
    useWorkoutStore.getState().deleteStep(FIFTH);
    useWorkoutStore.getState().deleteStep(FIRST);
    const [first, second] = useWorkoutStore.getState().deletedSteps ?? [];

    // Act
    useWorkoutStore.getState().undoDelete(second!.groupId);
    useWorkoutStore.getState().undoDelete(first!.groupId);

    // Assert
    // A timestamp-keyed undo restored one and discarded the other.
    expect(secondsOf()).toEqual(survivors(FIRST, SECOND, THIRD, FOURTH, FIFTH));
    expect(useWorkoutStore.getState().deletedSteps ?? []).toHaveLength(0);
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
