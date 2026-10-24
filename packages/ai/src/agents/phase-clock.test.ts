import { describe, expect, it, vi } from "vitest";

import type { GenerateProgress } from "./progress";
import { createPhaseClock } from "./phase-clock";

const REQUEST_MS = 1000;
const REASONING_MS = 30000;
const GENERATING_MS = 59000;
const RETRY_REQUEST_MS = 500;
const RETRY_REASONING_MS = 700;
const RETRY_GENERATING_MS = 29000;
const VALIDATING_MS = 300;
const UPDATES = 7;

describe("createPhaseClock", () => {
  it("should sum the time spent in each phase over every attempt", () => {
    // Arrange
    let t = 0;
    const forward = vi.fn();
    const clock = createPhaseClock(forward, () => t);
    const step = (
      update: Omit<GenerateProgress, "maxAttempts">,
      ms: number
    ) => {
      clock.observe({ ...update, maxAttempts: 3 });
      t += ms;
    };

    // Act
    step({ phase: "requesting", attempt: 1 }, REQUEST_MS);
    step({ phase: "reasoning", attempt: 1 }, REASONING_MS);
    step({ phase: "generating", attempt: 1 }, GENERATING_MS);
    step(
      { phase: "requesting", attempt: 2, retryReason: "truncated" },
      RETRY_REQUEST_MS
    );
    step({ phase: "reasoning", attempt: 2 }, RETRY_REASONING_MS);
    step({ phase: "generating", attempt: 2 }, RETRY_GENERATING_MS);
    step({ phase: "validating", attempt: 2 }, VALIDATING_MS);
    const timings = clock.stop();

    // Assert
    expect(forward).toHaveBeenCalledTimes(UPDATES);
    expect(timings).toEqual({
      attempts: 2,
      retryReasons: ["truncated"],
      phaseMs: {
        requesting: REQUEST_MS + RETRY_REQUEST_MS,
        reasoning: REASONING_MS + RETRY_REASONING_MS,
        generating: GENERATING_MS + RETRY_GENERATING_MS,
        validating: VALIDATING_MS,
      },
    });
  });
});
