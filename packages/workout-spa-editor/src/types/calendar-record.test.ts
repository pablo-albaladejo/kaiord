import { describe, expect, it } from "vitest";

import { workoutRecordSchema } from "./calendar-record";

const validRecord = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  profileId: "550e8400-e29b-41d4-a716-446655440001",
  date: "2025-01-15",
  sport: "running",
  source: "train2go",
  sourceId: null,
  planId: null,
  state: "raw",
  raw: null,
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: ["easy"],
  previousState: null,
  createdAt: "2025-01-15T08:00:00Z",
  modifiedAt: null,
  updatedAt: "2025-01-15T08:00:00Z",
};

describe("workoutRecordSchema", () => {
  it("should accept valid workout record", () => {
    // Arrange

    // Act

    // Assert
    expect(workoutRecordSchema.parse(validRecord)).toEqual(validRecord);
  });

  it("should reject invalid UUID", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, id: "not-a-uuid" })
    ).toThrow();
  });

  it("should reject invalid date format", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, date: "15-01-2025" })
    ).toThrow();
  });

  it("should reject invalid state", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, state: "archived" })
    ).toThrow();
  });

  it("should reject a missing profileId", () => {
    // Arrange
    const { profileId: _omit, ...without } = validRecord;
    void _omit;

    // Act

    // Assert
    expect(() => workoutRecordSchema.parse(without)).toThrow();
  });

  it("should reject an empty profileId", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, profileId: "" })
    ).toThrow();
  });

  it("should accept all workout states", () => {
    // Arrange

    const states = [
      "raw",
      "structured",
      "ready",
      "pushed",
      "modified",
      "stale",
      "skipped",
    ];

    // Act

    // Assert

    for (const state of states) {
      const record = { ...validRecord, state };

      expect(workoutRecordSchema.parse(record).state).toBe(state);
    }
  });

  it("should reject non-ISO createdAt", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRecordSchema.parse({
        ...validRecord,
        createdAt: "not-a-datetime",
      })
    ).toThrow();
  });
});
