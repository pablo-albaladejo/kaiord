import { assert, describe, expect, it } from "vitest";

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

  it("preserves existing ids by default (legacy block-* consumers)", () => {
    const ui = hydrateUIWorkout(
      buildKrd([
        { ...bareStep, id: "keep-step" } as never,
        {
          id: "block-123-abc",
          repeatCount: 2,
          steps: [{ ...bareStep, id: "keep-nested" } as never],
        } as never,
      ])
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect(isWorkoutStep(step!)).toBe(true);
    expect((step as { id: string }).id).toBe("keep-step");
    assert(
      block && isRepetitionBlock(block),
      "Expected second item to be a repetition block"
    );
    expect(block.id).toBe("block-123-abc");
    expect((block.steps[0] as { id: string }).id).toBe("keep-nested");
  });

  it("generates ids for steps/blocks lacking one in the default (preserve) mode", () => {
    let counter = 0;
    const deterministic = () => asItemId(`id-${counter++}`);

    const ui = hydrateUIWorkout(
      buildKrd([
        bareStep as never,
        { repeatCount: 2, steps: [bareStep] } as never,
      ]),
      { idProvider: deterministic }
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect((step as { id: string }).id).toBe("id-0");
    assert(
      block && isRepetitionBlock(block),
      "Expected second item to be a repetition block"
    );
    expect(block.id).toBe("id-1");
    expect((block.steps[0] as { id: string }).id).toBe("id-2");
  });

  it("regenerates every id when preserveExistingIds: false (paste-path trust boundary)", () => {
    const ui = hydrateUIWorkout(
      buildKrd([
        { ...bareStep, id: "clipboard-step" } as never,
        {
          id: "clipboard-block",
          repeatCount: 2,
          steps: [{ ...bareStep, id: "clipboard-nested" } as never],
        } as never,
      ]),
      { preserveExistingIds: false }
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect((step as { id: string }).id).not.toBe("clipboard-step");
    assert(
      block && isRepetitionBlock(block),
      "Expected second item to be a repetition block"
    );
    expect(block.id).not.toBe("clipboard-block");
    expect((block.steps[0] as { id: string }).id).not.toBe("clipboard-nested");
  });

  it("accepts a custom IdProvider for deterministic regeneration", () => {
    let counter = 0;
    const deterministic = () => asItemId(`uuid-${counter++}`);

    const ui = hydrateUIWorkout(buildKrd([bareStep as never]), {
      idProvider: deterministic,
      preserveExistingIds: false,
    });

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    expect((steps?.[0] as { id: string }).id).toBe("uuid-0");
  });
});
