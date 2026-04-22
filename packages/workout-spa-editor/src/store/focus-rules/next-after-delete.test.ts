import { describe, expect, it } from "vitest";

import type { Workout } from "../../types/krd";
import { asItemId } from "../providers/item-id";
import { nextAfterDelete } from "./next-after-delete";

const step = (id: string, stepIndex: number) => ({
  id: asItemId(id),
  stepIndex,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: 60 },
  targetType: "open" as const,
  target: { type: "open" as const },
});

const block = (id: string, innerIds: Array<string>) => ({
  id: asItemId(id),
  repeatCount: 2,
  steps: innerIds.map((iid, i) => step(iid, i)),
});

describe("nextAfterDelete (main list)", () => {
  it("focuses the next sibling when one exists", () => {
    // Arrange — deleted was at index 1; post-delete, step "c" now sits there.
    const workout = {
      sport: "cycling",
      steps: [step("a", 0), step("c", 2)],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({ workout, deletedIndex: 1 });

    // Assert
    expect(target).toEqual({ kind: "item", id: "c" });
  });

  it("focuses the previous sibling when the deleted item was the tail", () => {
    // Arrange — deleted was last; post-delete, only "a" and "b" remain.
    const workout = {
      sport: "cycling",
      steps: [step("a", 0), step("b", 1)],
    } as unknown as Workout;

    // Act — deletedIndex = 2 (past the end of the post-delete array).
    const target = nextAfterDelete({ workout, deletedIndex: 2 });

    // Assert
    expect(target).toEqual({ kind: "item", id: "b" });
  });

  it("falls back to empty-state when the main list becomes empty", () => {
    // Arrange
    const workout = { sport: "cycling", steps: [] } as unknown as Workout;

    // Act
    const target = nextAfterDelete({ workout, deletedIndex: 0 });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("falls back to empty-state when the workout is undefined", () => {
    // Act
    const target = nextAfterDelete({ workout: undefined, deletedIndex: 0 });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });
});

describe("nextAfterDelete (inside a repetition block)", () => {
  it("focuses the next sibling inside the same block", () => {
    // Arrange — block had [x, y, z]; y was deleted; now [x, z] and z sits at index 1.
    const workout = {
      sport: "cycling",
      steps: [block("blk-1", ["x", "z"])],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({
      workout,
      deletedIndex: 1,
      parentBlockId: asItemId("blk-1"),
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "z" });
  });

  it("focuses the previous sibling when the deleted item was the tail of the block", () => {
    // Arrange — deleted was tail; post-delete the block has [x, y].
    const workout = {
      sport: "cycling",
      steps: [block("blk-1", ["x", "y"])],
    } as unknown as Workout;

    // Act — deletedIndex = 2 (past end of block after delete).
    const target = nextAfterDelete({
      workout,
      deletedIndex: 2,
      parentBlockId: asItemId("blk-1"),
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "y" });
  });

  it("anchors focus to the parent block card when the block became empty", () => {
    // Arrange — the block lost its last inner step. The consumer is
    // expected to cascade into deleteRepetitionBlock next; the rule
    // parks focus on the parent in the meantime.
    const workout = {
      sport: "cycling",
      steps: [block("blk-1", [])],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({
      workout,
      deletedIndex: 0,
      parentBlockId: asItemId("blk-1"),
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "blk-1" });
  });

  it("falls back to main-list rules when the parent block is gone", () => {
    // Arrange — caller passed a block id that no longer exists.
    const workout = {
      sport: "cycling",
      steps: [step("a", 0)],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({
      workout,
      deletedIndex: 0,
      parentBlockId: asItemId("ghost-block"),
    });

    // Assert — falls through to "next in main list" which picks "a".
    expect(target).toEqual({ kind: "item", id: "a" });
  });
});
