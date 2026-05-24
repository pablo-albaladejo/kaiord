import { describe, expect, it } from "vitest";

import {
  fileTypeSchema,
  healthFileTypes,
  isHealthFileType,
  workoutLikeFileTypes,
} from "./file-type";

describe("fileTypeSchema", () => {
  it("should accept the three legacy workout/activity/course types", () => {
    // Arrange
    const cases = ["structured_workout", "recorded_activity", "course"];

    // Act
    const results = cases.map((value) => fileTypeSchema.safeParse(value));

    // Assert
    expect(results.every((r) => r.success)).toBe(true);
  });

  it("should accept the six health types introduced in v2.0", () => {
    // Arrange
    const cases = [
      "sleep_record",
      "weight_measurement",
      "hrv_summary",
      "daily_wellness",
      "body_composition",
      "stress_episode",
    ];

    // Act
    const results = cases.map((value) => fileTypeSchema.safeParse(value));

    // Assert
    expect(results.every((r) => r.success)).toBe(true);
  });

  it("should reject an unknown type", () => {
    // Arrange
    const input = "training_plan";

    // Act
    const result = fileTypeSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("workoutLikeFileTypes and healthFileTypes", () => {
  it("should partition the file type enum into exactly the nine variants", () => {
    // Arrange
    const combined = [...workoutLikeFileTypes, ...healthFileTypes];

    // Act
    const sorted = [...combined].sort();

    // Assert
    expect(combined.length).toBe(fileTypeSchema.options.length);
    expect(new Set(sorted).size).toBe(combined.length);
  });
});

describe("isHealthFileType", () => {
  it("should return true for every health type and false for workout types", () => {
    // Arrange
    const healthCases = [...healthFileTypes];
    const workoutCases = [...workoutLikeFileTypes];

    // Act
    const healthResults = healthCases.map(isHealthFileType);
    const workoutResults = workoutCases.map(isHealthFileType);

    // Assert
    expect(healthResults.every(Boolean)).toBe(true);
    expect(workoutResults.every((value) => value === false)).toBe(true);
  });
});
