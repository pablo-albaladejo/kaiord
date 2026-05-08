import { describe, expect, it } from "vitest";

import type { Workout } from "../types/krd";
import { findById } from "./find-by-id";
import { asItemId } from "./providers/item-id";

const step = (id: string, stepIndex: number) => ({
  id: asItemId(id),
  stepIndex,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: 60 },
  targetType: "open" as const,
  target: { type: "open" as const },
});

const block = (id: string, repeatCount: number, children: Array<unknown>) => ({
  id: asItemId(id),
  repeatCount,
  steps: children,
});

const FIXTURE_REPEAT_COUNT = 3;

const buildWorkout = (): Workout =>
  ({
    sport: "cycling",
    steps: [
      step("top-0", 0),
      block("block-1", FIXTURE_REPEAT_COUNT, [
        step("inner-0", 0),
        step("inner-1", 1),
      ]),
      step("top-2", 2),
    ],
  }) as unknown as Workout;

describe("findById", () => {
  it("should return null for missing workout or id", () => {
    // Arrange

    // Act

    // Assert
    expect(findById(undefined, asItemId("x"))).toBeNull();
    expect(findById(buildWorkout(), null)).toBeNull();
    expect(findById(buildWorkout(), "")).toBeNull();
  });

  it("should find a top-level step with its flat index", () => {
    // Arrange

    // Act
    const hit = findById(buildWorkout(), asItemId("top-2"));

    // Assert
    expect(hit).toEqual({
      kind: "step",
      step: expect.objectContaining({ id: "top-2" }),
      index: 2,
    });
  });

  it("should find a repetition block at its flat index", () => {
    // Arrange

    // Act
    const hit = findById(buildWorkout(), asItemId("block-1"));

    // Assert
    expect(hit?.kind).toBe("block");
    if (hit?.kind === "block") {
      expect(hit.index).toBe(1);
      expect(hit.block.id).toBe("block-1");
    }
  });

  it("should find a nested step with both its block and step indices", () => {
    // Arrange

    // Act
    const hit = findById(buildWorkout(), asItemId("inner-1"));

    // Assert
    expect(hit?.kind).toBe("nested-step");
    if (hit?.kind === "nested-step") {
      expect(hit.blockIndex).toBe(1);
      expect(hit.stepIndex).toBe(1);
      expect(hit.step.id).toBe("inner-1");
      expect(hit.block.id).toBe("block-1");
    }
  });

  it("should return null when the id is not in the workout", () => {
    // Arrange

    // Act

    // Assert
    expect(findById(buildWorkout(), asItemId("ghost"))).toBeNull();
  });
});
