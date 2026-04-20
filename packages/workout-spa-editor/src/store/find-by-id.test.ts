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

const buildWorkout = (): Workout =>
  ({
    sport: "cycling",
    steps: [
      step("top-0", 0),
      block("block-1", 3, [step("inner-0", 0), step("inner-1", 1)]),
      step("top-2", 2),
    ],
  }) as unknown as Workout;

describe("findById", () => {
  it("returns null for missing workout or id", () => {
    expect(findById(undefined, asItemId("x"))).toBeNull();
    expect(findById(buildWorkout(), null)).toBeNull();
    expect(findById(buildWorkout(), "")).toBeNull();
  });

  it("finds a top-level step with its flat index", () => {
    const hit = findById(buildWorkout(), asItemId("top-2"));
    expect(hit).toEqual({
      kind: "step",
      step: expect.objectContaining({ id: "top-2" }),
      index: 2,
    });
  });

  it("finds a repetition block at its flat index", () => {
    const hit = findById(buildWorkout(), asItemId("block-1"));
    expect(hit?.kind).toBe("block");
    if (hit?.kind === "block") {
      expect(hit.index).toBe(1);
      expect(hit.block.id).toBe("block-1");
    }
  });

  it("finds a nested step with both its block and step indices", () => {
    const hit = findById(buildWorkout(), asItemId("inner-1"));
    expect(hit?.kind).toBe("nested-step");
    if (hit?.kind === "nested-step") {
      expect(hit.blockIndex).toBe(1);
      expect(hit.stepIndex).toBe(1);
      expect(hit.step.id).toBe("inner-1");
      expect(hit.block.id).toBe("block-1");
    }
  });

  it("returns null when the id is not in the workout", () => {
    expect(findById(buildWorkout(), asItemId("ghost"))).toBeNull();
  });
});
