import { describe, expect, it } from "vitest";

import type { Workout } from "../../types/krd";
import { asItemId } from "../providers/item-id";
import { nextAfterMultiDelete } from "./next-after-multi-delete";

const step = (id: string, stepIndex: number) => ({
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
    steps: ids.map((id, i) => step(id, i)),
  }) as unknown as Workout;

describe("nextAfterMultiDelete", () => {
  it("should focus the first remaining item after the last-deleted position (contiguous)", () => {
    // Arrange
    const workout = workoutWith(["a", "d", "e"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [1, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "d" });
  });

  it("should handle non-contiguous deletions the same way", () => {
    // Arrange
    const workout = workoutWith(["b", "d", "e"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [0, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "d" });
  });

  it("should fall back to the previous-sibling when nothing sits after the deletion", () => {
    // Arrange
    const workout = workoutWith(["a"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [1, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "a" });
  });

  it("should anchor on a surviving item when both after-last and before-first checks miss", () => {
    // Arrange
    const workout = workoutWith(["b"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [0, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "b" });
  });

  it("should return empty-state when every item was deleted", () => {
    // Arrange
    const workout = workoutWith([]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [0, 1, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("should return empty-state when workout is undefined", () => {
    // Arrange

    // Act
    const target = nextAfterMultiDelete({
      workout: undefined,
      deletedIndices: [0],
    });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("should return empty-state when no indices were passed", () => {
    // Arrange
    const workout = workoutWith(["a"]);

    // Act
    const target = nextAfterMultiDelete({ workout, deletedIndices: [] });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });
});
