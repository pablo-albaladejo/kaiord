/**
 * CoachingActivityRecord — schema validation and helper tests
 */

import { describe, expect, it } from "vitest";

import {
  buildCoachingActivityId,
  coachingActivityRecordSchema,
  namespaceSourceId,
} from "./coaching-activity-record";

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
  it("accepts a minimal valid record", () => {
    expect(() => coachingActivityRecordSchema.parse(valid)).not.toThrow();
  });

  it("preserves workload unclamped", () => {
    const record = coachingActivityRecordSchema.parse({
      ...valid,
      workload: 7,
    });
    expect(record.workload).toBe(7);
  });

  it("accepts intensity in 1..5", () => {
    for (const intensity of [1, 2, 3, 4, 5] as const) {
      expect(() =>
        coachingActivityRecordSchema.parse({ ...valid, intensity })
      ).not.toThrow();
    }
  });

  it("rejects intensity outside 1..5", () => {
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, intensity: 6 })
    ).toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, intensity: 0 })
    ).toThrow();
  });

  it("accepts completionPercent in 0..100", () => {
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

  it("rejects completionPercent outside 0..100", () => {
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: -1 })
    ).toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, completionPercent: 101 })
    ).toThrow();
  });

  it("rejects mismatched composite id", () => {
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, id: "wrong" })
    ).toThrow();
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, id: "p2:train2go:12345" })
    ).toThrow();
  });

  it("accepts sourceIds with colons or hyphens (no regex on id)", () => {
    const record = {
      ...valid,
      sourceId: "abc-123:xyz",
      id: "p1:train2go:abc-123:xyz",
    };
    expect(() => coachingActivityRecordSchema.parse(record)).not.toThrow();
  });

  it("rejects malformed date", () => {
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, date: "13/04/2026" })
    ).toThrow();
  });

  it("rejects invalid status enum", () => {
    expect(() =>
      coachingActivityRecordSchema.parse({ ...valid, status: "in-progress" })
    ).toThrow();
  });
});

describe("buildCoachingActivityId", () => {
  it("composes the canonical id format", () => {
    expect(buildCoachingActivityId("p1", "train2go", "12345")).toBe(
      "p1:train2go:12345"
    );
  });
});

describe("namespaceSourceId", () => {
  it("namespaces by profile, omitting source (workout has its own column)", () => {
    expect(namespaceSourceId("p1", "12345")).toBe("p1:12345");
  });

  it("produces distinct namespaces for different profiles with the same raw id", () => {
    expect(namespaceSourceId("p1", "12345")).not.toBe(
      namespaceSourceId("p2", "12345")
    );
  });
});
