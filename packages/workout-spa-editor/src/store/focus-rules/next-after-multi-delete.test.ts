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
  it("focuses the first remaining item after the last-deleted position (contiguous)", () => {
    // Arrange — original [a, b, c, d, e]; deleted [b, c] at indices [1, 2];
    // post-delete workout = [a, d, e]; the item "after last-deleted" is d
    // at post-delete position (2 - 1) = 1.
    const workout = workoutWith(["a", "d", "e"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [1, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "d" });
  });

  it("handles non-contiguous deletions the same way", () => {
    // Arrange — original [a, b, c, d, e]; deleted [a, c] at indices [0, 2];
    // post-delete workout = [b, d, e]. lastDeleted=2, removedCount=2 →
    // position 2-1=1 → "d".
    const workout = workoutWith(["b", "d", "e"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [0, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "d" });
  });

  it("falls back to the previous-sibling when nothing sits after the deletion", () => {
    // Arrange — original [a, b, c]; deleted the tail [b, c] at [1, 2];
    // post-delete workout = [a]; no item after last-deleted; fallback
    // to previous-sibling of first-deleted (index 0) → "a".
    const workout = workoutWith(["a"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [1, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "a" });
  });

  it("anchors on a surviving item when both after-last and before-first checks miss", () => {
    // Arrange — original [a, b, c]; deleted [0, 2]; post-delete [b].
    // `afterLast` position = 2 - 1 = 1 → undefined (only 1 item now).
    // `firstDeleted` = 0, so no previous-sibling check applies. Without
    // the "anchor to surviving" fallback this would collapse to
    // empty-state even though "b" is still in the list.
    const workout = workoutWith(["b"]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [0, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "b" });
  });

  it("returns empty-state when every item was deleted", () => {
    // Arrange — list is empty post-delete.
    const workout = workoutWith([]);

    // Act
    const target = nextAfterMultiDelete({
      workout,
      deletedIndices: [0, 1, 2],
    });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("returns empty-state when workout is undefined", () => {
    // Act
    const target = nextAfterMultiDelete({
      workout: undefined,
      deletedIndices: [0],
    });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("returns empty-state when no indices were passed", () => {
    // Arrange
    const workout = workoutWith(["a"]);

    // Act
    const target = nextAfterMultiDelete({ workout, deletedIndices: [] });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });
});
