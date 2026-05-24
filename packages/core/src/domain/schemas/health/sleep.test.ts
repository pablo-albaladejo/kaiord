import { describe, expect, it } from "vitest";

import { sleepRecordSchema } from "./sleep";

const baseSleep = {
  kind: "sleep" as const,
  version: "2.0",
  startTime: "2026-05-21T23:00:00.000Z",
  endTime: "2026-05-22T07:00:00.000Z",
  totalDurationSeconds: 28800,
  stages: [
    {
      stage: "light" as const,
      startTime: "2026-05-21T23:00:00.000Z",
      durationSeconds: 10800,
    },
    {
      stage: "deep" as const,
      startTime: "2026-05-22T02:00:00.000Z",
      durationSeconds: 7200,
    },
    {
      stage: "rem" as const,
      startTime: "2026-05-22T04:00:00.000Z",
      durationSeconds: 7200,
    },
    {
      stage: "awake" as const,
      startTime: "2026-05-22T06:00:00.000Z",
      durationSeconds: 3600,
    },
  ],
};

describe("sleepRecordSchema", () => {
  it("should accept a sleep record whose stages sum exactly to totalDurationSeconds", () => {
    // Arrange
    const input = baseSleep;

    // Act
    const result = sleepRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept stages summing within the ±60s tolerance of totalDurationSeconds", () => {
    // Arrange
    const lightStageSecondsBase = baseSleep.stages[0].durationSeconds;
    const driftWithinTolerance = 30;
    const input = {
      ...baseSleep,
      stages: [
        {
          stage: "light" as const,
          startTime: "2026-05-21T23:00:00.000Z",
          durationSeconds: lightStageSecondsBase + driftWithinTolerance,
        },
        ...baseSleep.stages.slice(1),
      ],
    };

    // Act
    const result = sleepRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject stages whose sum diverges more than 60s from totalDurationSeconds", () => {
    // Arrange
    const overInflatedLightStageSeconds = 12000;
    const input = {
      ...baseSleep,
      stages: [
        {
          stage: "light" as const,
          startTime: "2026-05-21T23:00:00.000Z",
          durationSeconds: overInflatedLightStageSeconds,
        },
        ...baseSleep.stages.slice(1),
      ],
    };

    // Act
    const result = sleepRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages.some((m) => m.includes("Sum of stage durations"))).toBe(
        true
      );
    }
  });

  it("should reject a payload missing startTime", () => {
    // Arrange
    const withoutStartTime = { ...baseSleep } as Partial<typeof baseSleep>;
    delete withoutStartTime.startTime;

    // Act
    const result = sleepRecordSchema.safeParse(withoutStartTime);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.includes("startTime"))
      ).toBe(true);
    }
  });

  it("should accept a forward-compatible v2.1 payload", () => {
    // Arrange
    const input = { ...baseSleep, version: "2.1" };

    // Act
    const result = sleepRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a v1.0 payload (wrong major)", () => {
    // Arrange
    const input = { ...baseSleep, version: "1.0" };

    // Act
    const result = sleepRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a score above 100", () => {
    // Arrange
    const input = { ...baseSleep, score: 150 };

    // Act
    const result = sleepRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
