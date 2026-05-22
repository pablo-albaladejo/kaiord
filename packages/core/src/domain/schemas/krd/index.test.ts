import { describe, expect, it } from "vitest";

import { krdSchema } from "./index";

const workoutKrd = {
  version: "1.0",
  type: "structured_workout" as const,
  metadata: {
    created: "2026-05-22T07:00:00.000Z",
    sport: "running",
  },
  extensions: {
    structured_workout: { name: "Test", sport: "running", steps: [] },
  },
};

const sleepKrd = {
  version: "2.0",
  type: "sleep_record" as const,
  metadata: {
    created: "2026-05-22T07:00:00.000Z",
  },
  extensions: {
    health: {
      sleep: {
        kind: "sleep" as const,
        version: "2.0",
        startTime: "2026-05-21T23:00:00.000Z",
        endTime: "2026-05-22T07:00:00.000Z",
        totalDurationSeconds: 28800,
        stages: [
          {
            stage: "light" as const,
            startTime: "2026-05-21T23:00:00.000Z",
            durationSeconds: 28800,
          },
        ],
      },
    },
  },
};

describe("krdSchema — conditional metadata.sport invariant", () => {
  it("should accept a v1.0 workout KRD with metadata.sport present", () => {
    // Arrange
    const input = workoutKrd;

    // Act
    const result = krdSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a workout KRD without metadata.sport", () => {
    // Arrange
    const input = {
      ...workoutKrd,
      metadata: { created: workoutKrd.metadata.created },
    };

    // Act
    const result = krdSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages.some((m) => m.includes("requires metadata.sport"))).toBe(
        true
      );
    }
  });

  it("should accept a v2.0 health KRD without metadata.sport", () => {
    // Arrange
    const input = sleepKrd;

    // Act
    const result = krdSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject a health KRD that carries metadata.sport", () => {
    // Arrange
    const input = {
      ...sleepKrd,
      metadata: { ...sleepKrd.metadata, sport: "running" },
    };

    // Act
    const result = krdSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages.some((m) => m.includes("must omit metadata.sport"))).toBe(
        true
      );
    }
  });
});

describe("krdSchema — extensions tagged shape", () => {
  it("should validate a health.sleep payload strictly when present", () => {
    // Arrange
    const input = {
      ...sleepKrd,
      extensions: {
        health: {
          sleep: { kind: "sleep", version: "1.0" },
        },
      },
    };

    // Act
    const result = krdSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should preserve unknown extension namespaces via catchall", () => {
    // Arrange
    const input = {
      ...workoutKrd,
      extensions: {
        structured_workout: { name: "Test", sport: "running", steps: [] },
        thirdPartyFoo: { x: 1 },
      },
    };

    // Act
    const result = krdSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data.extensions as Record<string, unknown>)?.thirdPartyFoo
      ).toEqual({ x: 1 });
    }
  });
});
