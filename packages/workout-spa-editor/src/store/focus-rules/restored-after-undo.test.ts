import { describe, expect, it } from "vitest";

import type { Workout } from "../../types/krd";
import { asItemId } from "../providers/item-id";
import { restoredAfterUndoTarget } from "./restored-after-undo";

const makeStep = (id: string, stepIndex: number) => ({
  id: asItemId(id),
  stepIndex,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: 60 },
  targetType: "open" as const,
  target: { type: "open" as const },
});

const workoutWith = (ids: Array<string>): Workout =>
  ({
    sport: "cycling",
    steps: ids.map((id, i) => makeStep(id, i)),
  }) as unknown as Workout;

describe("restoredAfterUndoTarget", () => {
  it("focuses the restored item when it exists in the post-undo workout", () => {
    // Arrange
    const workout = workoutWith(["a", "b", "c"]);

    // Act
    const target = restoredAfterUndoTarget(workout, asItemId("b"));

    // Assert
    expect(target).toEqual({ kind: "item", id: "b" });
  });

  it("falls back to empty-state when the workout is undefined", () => {
    // Act
    const target = restoredAfterUndoTarget(undefined, asItemId("ghost"));

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("falls back to empty-state when the restored id is not present", () => {
    // Arrange
    const workout = workoutWith(["a", "b"]);

    // Act
    const target = restoredAfterUndoTarget(workout, asItemId("ghost"));

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("also resolves restored nested-step ids inside a repetition block", () => {
    // Arrange
    const workout = {
      sport: "cycling",
      steps: [
        makeStep("top-0", 0),
        {
          id: asItemId("block-1"),
          repeatCount: 2,
          steps: [makeStep("nested-0", 0), makeStep("nested-1", 1)],
        },
      ],
    } as unknown as Workout;

    // Act
    const target = restoredAfterUndoTarget(workout, asItemId("nested-1"));

    // Assert
    expect(target).toEqual({ kind: "item", id: "nested-1" });
  });
});
