import { describe, expect, it } from "vitest";

import type { Workout } from "../../types/krd";
import { asItemId } from "../providers/item-id";
import { preservedSelectionTarget } from "./preserved-selection";

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

describe("preservedSelectionTarget", () => {
  it("returns the prior selection when it is still present", () => {
    // Arrange
    const workout = workoutWith(["a", "b", "c"]);

    // Act
    const target = preservedSelectionTarget(workout, asItemId("b"), 1);

    // Assert
    expect(target).toEqual({ kind: "item", id: "b" });
  });

  it("falls back to the item now at the same-index when the prior id is gone", () => {
    // Arrange — "b" was deleted; position 1 is now "c".
    const workout = workoutWith(["a", "c"]);

    // Act
    const target = preservedSelectionTarget(workout, asItemId("b"), 1);

    // Assert
    expect(target).toEqual({ kind: "item", id: "c" });
  });

  it("falls back to the same-index item when the prior selection is null", () => {
    // Arrange
    const workout = workoutWith(["a", "b"]);

    // Act
    const target = preservedSelectionTarget(workout, null, 0);

    // Assert
    expect(target).toEqual({ kind: "item", id: "a" });
  });

  it("falls back to empty-state when no item sits at the fallback index", () => {
    // Arrange
    const workout = workoutWith(["a"]);

    // Act — fallbackIndex out of range.
    const target = preservedSelectionTarget(workout, asItemId("ghost"), 5);

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("falls back to empty-state when the workout is undefined", () => {
    // Act
    const target = preservedSelectionTarget(undefined, asItemId("x"), 0);

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("falls back to empty-state when the workout has no steps at all", () => {
    // Arrange
    const workout = workoutWith([]);

    // Act
    const target = preservedSelectionTarget(workout, null, 0);

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });
});
