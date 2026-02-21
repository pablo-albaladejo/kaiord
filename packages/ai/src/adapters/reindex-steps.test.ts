import { describe, it, expect } from "vitest";
import type { Workout } from "@kaiord/core";
import { reindexSteps } from "./reindex-steps";

describe("reindexSteps", () => {
  it("reindexes top-level steps sequentially", () => {
    const workout: Workout = {
      sport: "running",
      steps: [
        {
          stepIndex: 5,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 10,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
      ],
    };

    const result = reindexSteps(workout);

    expect(result.steps[0]).toMatchObject({ stepIndex: 0 });
    expect(result.steps[1]).toMatchObject({ stepIndex: 1 });
  });

  it("reindexes nested steps inside repetition blocks", () => {
    const workout: Workout = {
      sport: "cycling",
      steps: [
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 99,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "zone", value: 4 },
              },
            },
            {
              stepIndex: 88,
              durationType: "time",
              duration: { type: "time", seconds: 120 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
      ],
    };

    const result = reindexSteps(workout);
    const block = result.steps[0];
    expect("repeatCount" in block).toBe(true);
    if ("repeatCount" in block) {
      expect(block.steps[0]).toMatchObject({ stepIndex: 0 });
      expect(block.steps[1]).toMatchObject({ stepIndex: 1 });
    }
  });

  it("handles empty steps array", () => {
    const workout: Workout = { sport: "running", steps: [] };

    const result = reindexSteps(workout);

    expect(result.steps).toHaveLength(0);
    expect(result).not.toBe(workout);
  });

  it("skips RepetitionBlocks in top-level index sequence", () => {
    const workout: Workout = {
      sport: "running",
      steps: [
        {
          stepIndex: 99,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "open",
              target: { type: "open" },
            },
          ],
        },
        {
          stepIndex: 99,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
      ],
    };

    const result = reindexSteps(workout);

    expect(result.steps[0]).toMatchObject({ stepIndex: 0 });
    expect(result.steps[2]).toMatchObject({ stepIndex: 1 });
  });

  it("does not mutate the original workout", () => {
    const workout: Workout = {
      sport: "running",
      steps: [
        {
          stepIndex: 5,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "open",
          target: { type: "open" },
        },
      ],
    };

    const result = reindexSteps(workout);

    expect(result).not.toBe(workout);
    expect(result.steps[0]).toMatchObject({ stepIndex: 0 });
    expect(workout.steps[0]).toMatchObject({ stepIndex: 5 });
  });
});
