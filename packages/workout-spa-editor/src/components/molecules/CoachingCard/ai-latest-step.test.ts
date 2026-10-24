import { describe, expect, it } from "vitest";

import { latestFinishedStep } from "./ai-latest-step";

const STEP_SECONDS = 720;
const BLOCK_REPEAT = 4;
const DISTANCE_M = 400;

describe("latestFinishedStep", () => {
  it("should read the step before the one still being written", () => {
    // Arrange
    const partial = {
      steps: [
        { duration: { seconds: STEP_SECONDS }, intensity: "warmup" },
        { duration: { seconds: 1 } },
      ],
    };

    // Act
    const latest = latestFinishedStep(partial);

    // Assert
    expect(latest).toEqual({
      kind: "step",
      seconds: STEP_SECONDS,
      meters: undefined,
      intensity: "warmup",
    });
  });

  it("should not report anything while the first step is being written", () => {
    // Arrange
    const partial = { steps: [{ duration: { seconds: STEP_SECONDS } }] };

    // Act
    const latest = latestFinishedStep(partial);

    // Assert
    expect(latest).toBeUndefined();
  });

  it("should describe a repetition block by its repeat count and size", () => {
    // Arrange
    const partial = {
      steps: [{ repeatCount: BLOCK_REPEAT, steps: [{}, {}, {}] }, {}],
    };

    // Act
    const latest = latestFinishedStep(partial);

    // Assert
    expect(latest).toEqual({
      kind: "block",
      repeatCount: BLOCK_REPEAT,
      steps: 3,
    });
  });

  it("should keep a distance step's meters", () => {
    // Arrange
    const partial = { steps: [{ duration: { meters: DISTANCE_M } }, {}] };

    // Act
    const latest = latestFinishedStep(partial);

    // Assert
    expect(latest).toMatchObject({ kind: "step", meters: DISTANCE_M });
  });

  it("should ignore output that is not shaped like a workout", () => {
    // Arrange
    const partials: unknown[] = [
      undefined,
      "x",
      { steps: "x" },
      { steps: [1, 2] },
    ];

    // Act
    const results = partials.map(latestFinishedStep);

    // Assert
    expect(results).toEqual([undefined, undefined, undefined, undefined]);
  });
});
