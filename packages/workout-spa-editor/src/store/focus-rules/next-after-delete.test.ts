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
  it("should focus the next sibling when one exists", () => {
    // Arrange
    const workout = {
      sport: "cycling",
      steps: [step("a", 0), step("c", 2)],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({ workout, deletedIndex: 1 });

    // Assert
    expect(target).toEqual({ kind: "item", id: "c" });
  });

  it("should focus the previous sibling when the deleted item was the tail", () => {
    // Arrange
    const workout = {
      sport: "cycling",
      steps: [step("a", 0), step("b", 1)],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({ workout, deletedIndex: 2 });

    // Assert
    expect(target).toEqual({ kind: "item", id: "b" });
  });

  it("should fall back to empty-state when the main list becomes empty", () => {
    // Arrange
    const workout = { sport: "cycling", steps: [] } as unknown as Workout;

    // Act
    const target = nextAfterDelete({ workout, deletedIndex: 0 });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });

  it("should fall back to empty-state when the workout is undefined", () => {
    // Arrange

    // Act
    const target = nextAfterDelete({ workout: undefined, deletedIndex: 0 });

    // Assert
    expect(target).toEqual({ kind: "empty-state" });
  });
});

describe("nextAfterDelete (inside a repetition block)", () => {
  it("should focus the next sibling inside the same block", () => {
    // Arrange
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

  it("should focus the previous sibling when the deleted item was the tail of the block", () => {
    // Arrange
    const workout = {
      sport: "cycling",
      steps: [block("blk-1", ["x", "y"])],
    } as unknown as Workout;

    // Act
    const target = nextAfterDelete({
      workout,
      deletedIndex: 2,
      parentBlockId: asItemId("blk-1"),
    });

    // Assert
    expect(target).toEqual({ kind: "item", id: "y" });
  });

  it("should anchor focus to the parent block card when the block became empty", () => {
    // Arrange
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

  it("should fall back to main-list rules when the parent block is gone", () => {
    // Arrange
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

    // Assert
    expect(target).toEqual({ kind: "item", id: "a" });
  });
});
