import { describe, expect, it } from "vitest";

import { isRepetitionBlock, isWorkoutStep } from "../types/krd";
import type { KRD, Workout } from "../types/krd";
import { hydrateUIWorkout } from "./hydrate-ui-workout";
import { asItemId } from "./providers/item-id";

const buildKrd = (steps: Workout["steps"]): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-20T12:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      sport: "cycling",
      steps,
    } as Workout,
  },
});

const bareStep = {
  stepIndex: 0,
  durationType: "time" as const,
  duration: { type: "time" as const, seconds: 60 },
  targetType: "open" as const,
  target: { type: "open" as const },
};

describe("hydrateUIWorkout", () => {
  it("passes through a KRD without structured_workout unchanged", () => {
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-04-20T12:00:00Z", sport: "cycling" },
    };

    expect(hydrateUIWorkout(krd)).toBe(krd);
  });

  it("passes through a KRD whose extensions omit structured_workout", () => {
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-04-20T12:00:00Z", sport: "cycling" },
      extensions: { other_key: { value: 42 } },
    };

    expect(hydrateUIWorkout(krd)).toBe(krd);
  });

  it("regenerates every id by default (design decision 6)", () => {
    const ui = hydrateUIWorkout(
      buildKrd([
        { ...bareStep, id: "legacy-step-id" } as never,
        {
          id: "legacy-block",
          repeatCount: 2,
          steps: [{ ...bareStep, id: "legacy-nested" } as never],
        } as never,
      ])
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect(isWorkoutStep(step!)).toBe(true);
    expect((step as { id: string }).id).not.toBe("legacy-step-id");

    if (isRepetitionBlock(block!)) {
      expect(block.id).not.toBe("legacy-block");
      expect(block.steps[0].id ?? "").not.toBe("legacy-nested");
    }
  });

  it("preserves existing ids when preserveExistingIds: true", () => {
    const ui = hydrateUIWorkout(
      buildKrd([
        { ...bareStep, id: "keep-step" } as never,
        {
          id: "keep-block",
          repeatCount: 2,
          steps: [{ ...bareStep, id: "keep-nested" } as never],
        } as never,
      ]),
      { preserveExistingIds: true }
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect((step as { id: string }).id).toBe("keep-step");
    if (isRepetitionBlock(block!)) {
      expect(block.id).toBe("keep-block");
      expect((block.steps[0] as { id: string }).id).toBe("keep-nested");
    }
  });

  it("generates ids for steps/blocks lacking one in preserve mode", () => {
    let counter = 0;
    const deterministic = () => asItemId(`id-${counter++}`);

    const ui = hydrateUIWorkout(
      buildKrd([
        bareStep as never,
        { repeatCount: 2, steps: [bareStep] } as never,
      ]),
      { preserveExistingIds: true, idProvider: deterministic }
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect((step as { id: string }).id).toBe("id-0");
    if (isRepetitionBlock(block!)) {
      expect(block.id).toBe("id-1");
      expect((block.steps[0] as { id: string }).id).toBe("id-2");
    }
  });

  it("accepts a custom IdProvider for deterministic regeneration", () => {
    let counter = 0;
    const deterministic = () => asItemId(`uuid-${counter++}`);

    const ui = hydrateUIWorkout(buildKrd([bareStep as never]), {
      idProvider: deterministic,
    });

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    expect((steps?.[0] as { id: string }).id).toBe("uuid-0");
  });
});
