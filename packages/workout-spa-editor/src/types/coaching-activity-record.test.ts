/**
 * CoachingActivityRecord — schema validation and helper tests
 */

import { describe, expect, it } from "vitest";

import {
  buildCoachingActivityId,
  coachingActivityRecordSchema,
  namespaceSourceId,
} from "./coaching-activity-record";
import {
  SAMPLE_WORKLOAD_7,
  VALID_INTENSITIES,
} from "./coaching-activity-record.test-fixtures";

const valid = {
  id: "p1:train2go:12345",
  profileId: "p1",
  source: "train2go",
  sourceId: "12345",
  date: "2026-04-13",
  sport: "cycling",
  title: "FTP test",
  status: "pending" as const,
  fetchedAt: "2026-04-28T10:00:00.000Z",
};

describe("coachingActivityRecordSchema", () => {
  it("should accept a minimal valid record", () => {
    // Arrange

    // Act

    // Assert
    expect(() => coachingActivityRecordSchema.parse(valid)).not.toThrow();
  });

  it("should preserve workload unclamped", () => {
    // Arrange

    // Act

    const record = coachingActivityRecordSchema.parse({
      ...valid,
      workload: 7,
    });

    // Assert

    expect(record.workload).toBe(SAMPLE_WORKLOAD_7);
  });

  it("should accept intensity in 1..5", () => {
    // Arrange

    // Act

    // Assert

    for (const intensity of VALID_INTENSITIES) {
      expect(() =>
        coachingActivityRecordSchema.parse({ ...valid, intensity })
      ).not.toThrow();
    }
  });

  it("should reject intensity outside 1..5", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, intensity: 6 })
    ).toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, intensity: 0 })
    ).toThrow();
  });

  it("should accept completionPercent in 0..100", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: 0 })
    ).not.toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: 100 })
    ).not.toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: 85 })
    ).not.toThrow();
  });

  it("should reject completionPercent outside 0..100", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: -1 })
    ).toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: 101 })
    ).toThrow();
  });

  it("should reject mismatched composite id", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, id: "wrong" })
    ).toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, id: "p2:train2go:12345" })
    ).toThrow();
  });

  it("should accept sourceIds with colons or hyphens (no regex on id)", () => {
    // Arrange

    // Act

    const record = {
      ...valid,
      sourceId: "abc-123:xyz",
      id: "p1:train2go:abc-123:xyz",
    };

    // Assert

    expect(() => coachingActivityRecordSchema.parse(record)).not.toThrow();
  });

  it("should reject malformed date", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, date: "13/04/2026" })
    ).toThrow();
  });

  it("should reject invalid status enum", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, status: "in-progress" })
    ).toThrow();
  });
});

describe("buildCoachingActivityId", () => {
  it("should compose the canonical id format", () => {
    // Arrange

    // Act

    // Assert
    expect(buildCoachingActivityId("p1", "train2go", "12345")).toBe(
      "p1:train2go:12345"
    );
  });
});

describe("namespaceSourceId", () => {
  it("should namespace by profile, omitting source (workout has its own column)", () => {
    // Arrange

    // Act

    // Assert
    expect(namespaceSourceId("p1", "12345")).toBe("p1:12345");
  });

  it("should produce distinct namespaces for different profiles with the same raw id", () => {
    // Arrange

    // Act

    // Assert
    expect(namespaceSourceId("p1", "12345")).not.toBe(
      namespaceSourceId("p2", "12345")
    );
  });
});
