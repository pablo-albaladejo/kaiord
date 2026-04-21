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

  it("regenerates every id by default (design decision 6)", () => {
    let counter = 0;
    const deterministic = () => asItemId(`regen-${counter++}`);

    const ui = hydrateUIWorkout(
      buildKrd([
        { ...bareStep, id: "would-have-kept-step" } as never,
        {
          id: "would-have-kept-block",
          repeatCount: 2,
          steps: [{ ...bareStep, id: "would-have-kept-nested" } as never],
        } as never,
      ]),
      { idProvider: deterministic }
    );

    const steps = (ui.extensions?.structured_workout as Workout | undefined)
      ?.steps;
    const [step, block] = steps ?? [];
    expect(isWorkoutStep(step!)).toBe(true);
    expect((step as { id: string }).id).toBe("regen-0");
    assert(
      block && isRepetitionBlock(block),
      "Expected second item to be a repetition block"
    );
    expect(block.id).toBe("regen-1");
    expect((block.steps[0] as { id: string }).id).toBe("regen-2");
  });

  it("generates ids for steps/blocks lacking one (covers items without an id)", () => {
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

  it("keeps existing ids when preserveExistingIds: true (opt-in migration mode)", () => {
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
    assert(
      block && isRepetitionBlock(block),
      "Expected second item to be a repetition block"
    );
    expect(block.id).toBe("keep-block");
    expect((block.steps[0] as { id: string }).id).toBe("keep-nested");
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
