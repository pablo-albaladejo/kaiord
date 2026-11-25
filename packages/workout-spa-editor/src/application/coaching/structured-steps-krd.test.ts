/* eslint-disable no-magic-numbers -- a steps table is literal durations, watts and bpm, clearer inline */
import { describe, expect, it } from "vitest";

import type { CoachingStepGroup } from "../../types/coaching-structured-steps";
import { buildStructuredStepsKrd } from "./structured-steps-krd";

const CREATED = "2026-11-25T08:00:00.000Z";

const step = (
  durationSeconds: number,
  zone: string,
  watts: [number, number],
  bpm: [number, number]
) => ({
  durationSeconds,
  zone,
  powerWatts: { min: watts[0], max: watts[1] },
  heartRateBpm: { min: bpm[0], max: bpm[1] },
});

const TABLE: CoachingStepGroup[] = [
  { repeat: 1, steps: [step(900, "R0", [0, 120], [60, 120])] },
  {
    repeat: 5,
    steps: [
      step(60, "R1", [121, 150], [121, 130]),
      step(60, "R0", [0, 120], [60, 120]),
    ],
  },
  { repeat: 1, steps: [step(210, "R1+", [151, 180], [131, 140])] },
];

const workoutOf = (krd: ReturnType<typeof buildStructuredStepsKrd>) =>
  krd?.extensions?.structured_workout as { steps: unknown[]; sport: string };

describe("buildStructuredStepsKrd", () => {
  it("should turn each row into a timed step with power as its target and heart rate in its note", () => {
    // Arrange

    // Act
    const krd = buildStructuredStepsKrd({
      groups: TABLE,
      sport: { sport: "cycling" },
      name: "Rodaje",
      created: CREATED,
    });

    // Assert
    expect(krd?.metadata).toMatchObject({ sport: "cycling", created: CREATED });
    expect(workoutOf(krd).steps[0]).toStrictEqual({
      stepIndex: 0,
      name: "R0",
      durationType: "time",
      duration: { type: "time", seconds: 900 },
      targetType: "power",
      target: { type: "power", value: { unit: "range", min: 0, max: 120 } },
      notes: "HR 60-120 bpm",
    });
  });

  it("should turn a repeat block into one repetition holding its work and recovery steps", () => {
    // Arrange

    // Act
    const krd = buildStructuredStepsKrd({
      groups: TABLE,
      sport: { sport: "cycling" },
      created: CREATED,
    });

    // Assert
    const block = workoutOf(krd).steps[1] as {
      repeatCount: number;
      steps: { name: string; duration: { seconds: number }; notes: string }[];
    };
    expect(block.repeatCount).toBe(5);
    expect(
      block.steps.map((s) => [s.name, s.duration.seconds, s.notes])
    ).toStrictEqual([
      ["R1", 60, "HR 121-130 bpm"],
      ["R0", 60, "HR 60-120 bpm"],
    ]);
    expect(workoutOf(krd).steps).toHaveLength(3);
  });

  it("should build nothing from a table the KRD cannot hold", () => {
    // Arrange
    const tooStrong = [
      { repeat: 1, steps: [step(60, "R9", [100, 9000], [60, 120])] },
    ];

    // Act
    const krd = buildStructuredStepsKrd({
      groups: tooStrong,
      sport: { sport: "cycling" },
      created: CREATED,
    });

    // Assert
    expect(krd).toBeUndefined();
  });
});
