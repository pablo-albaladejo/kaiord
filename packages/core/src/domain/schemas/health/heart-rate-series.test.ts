import { describe, expect, it } from "vitest";

import { heartRateSeriesSchema } from "./heart-rate-series";

const baseStartTime = "2026-07-10T05:30:00.000Z";
const BPM_58 = 58;
const BPM_59 = 59;
const BPM_60 = 60;
const BPM_61 = 61;
const BPM_62 = 62;
const BPM_OUT_OF_RANGE = 301;

describe("heartRateSeriesSchema", () => {
  it("should accept a valid uniform-interval heart-rate series", () => {
    // Arrange
    const input = {
      kind: "heart-rate-series" as const,
      version: "2.0",
      startTime: baseStartTime,
      intervalSeconds: 60,
      samples: [BPM_58, BPM_60, BPM_62, BPM_61, BPM_59],
    };

    // Act
    const result = heartRateSeriesSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a series with a null gap in the middle", () => {
    // Arrange
    const input = {
      kind: "heart-rate-series" as const,
      version: "2.0",
      startTime: baseStartTime,
      intervalSeconds: 60,
      samples: [BPM_58, BPM_60, null, BPM_61, BPM_59],
    };

    // Act
    const result = heartRateSeriesSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an empty samples array", () => {
    // Arrange
    const input = {
      kind: "heart-rate-series" as const,
      version: "2.0",
      startTime: baseStartTime,
      intervalSeconds: 60,
      samples: [],
    };

    // Act
    const result = heartRateSeriesSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an all-null samples array", () => {
    // Arrange
    const input = {
      kind: "heart-rate-series" as const,
      version: "2.0",
      startTime: baseStartTime,
      intervalSeconds: 60,
      samples: [null, null, null],
    };

    // Act
    const result = heartRateSeriesSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(
        messages.some((m) => m.includes("At least one non-null sample"))
      ).toBe(true);
    }
  });

  it("should reject a sample above 300 bpm", () => {
    // Arrange
    const input = {
      kind: "heart-rate-series" as const,
      version: "2.0",
      startTime: baseStartTime,
      intervalSeconds: 60,
      samples: [BPM_58, BPM_OUT_OF_RANGE, BPM_59],
    };

    // Act
    const result = heartRateSeriesSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a payload with a bad version", () => {
    // Arrange
    const input = {
      kind: "heart-rate-series" as const,
      version: "3.0",
      startTime: baseStartTime,
      intervalSeconds: 60,
      samples: [BPM_58, BPM_60],
    };

    // Act
    const result = heartRateSeriesSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
