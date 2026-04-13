import { describe, expect, it } from "vitest";

import {
  aiMetaSchema,
  conditionSchema,
  valueWithUnitSchema,
  workoutCommentSchema,
  workoutFeedbackSchema,
  workoutRawSchema,
  workoutRecordSchema,
  workoutStateSchema,
} from "./calendar-schemas";

describe("workoutStateSchema", () => {
  it("accepts all valid states", () => {
    const states = [
      "raw",
      "structured",
      "ready",
      "pushed",
      "modified",
      "stale",
      "skipped",
    ];

    for (const state of states) {
      expect(workoutStateSchema.parse(state)).toBe(state);
    }
  });

  it("rejects invalid state", () => {
    expect(() => workoutStateSchema.parse("invalid")).toThrow();
  });
});

describe("conditionSchema", () => {
  it("accepts all valid conditions", () => {
    const conditions = [
      "rain",
      "wind",
      "heat",
      "cold",
      "fatigue",
      "injury",
      "altitude",
      "indoor",
    ];

    for (const condition of conditions) {
      expect(conditionSchema.parse(condition)).toBe(condition);
    }
  });

  it("rejects invalid condition", () => {
    expect(() => conditionSchema.parse("snow")).toThrow();
  });
});

describe("valueWithUnitSchema", () => {
  it("accepts valid value with unit", () => {
    const result = valueWithUnitSchema.parse({ value: 10.5, unit: "km" });

    expect(result).toEqual({ value: 10.5, unit: "km" });
  });

  it("rejects missing unit", () => {
    expect(() => valueWithUnitSchema.parse({ value: 10 })).toThrow();
  });
});

describe("workoutCommentSchema", () => {
  it("accepts valid comment with ISO timestamp", () => {
    const comment = {
      author: "coach",
      text: "Great session",
      timestamp: "2025-01-15T10:30:00Z",
    };

    expect(workoutCommentSchema.parse(comment)).toEqual(comment);
  });

  it("rejects non-ISO timestamp", () => {
    expect(() =>
      workoutCommentSchema.parse({
        author: "coach",
        text: "note",
        timestamp: "not-a-date",
      })
    ).toThrow();
  });
});

describe("workoutRawSchema", () => {
  const validRaw = {
    title: "Easy run",
    description: "Zone 2 easy",
    comments: [],
    distance: { value: 10, unit: "km" },
    duration: null,
    prescribedRpe: 5,
    rawHash: "abc123",
  };

  it("accepts valid raw payload", () => {
    expect(workoutRawSchema.parse(validRaw)).toEqual(validRaw);
  });

  it("accepts null distance and duration", () => {
    const raw = { ...validRaw, distance: null, duration: null };

    expect(workoutRawSchema.parse(raw)).toEqual(raw);
  });

  it("rejects prescribedRpe below 1", () => {
    expect(() =>
      workoutRawSchema.parse({ ...validRaw, prescribedRpe: 0 })
    ).toThrow();
  });

  it("rejects prescribedRpe above 10", () => {
    expect(() =>
      workoutRawSchema.parse({ ...validRaw, prescribedRpe: 11 })
    ).toThrow();
  });

  it("accepts null prescribedRpe", () => {
    const raw = { ...validRaw, prescribedRpe: null };

    expect(workoutRawSchema.parse(raw)).toEqual(raw);
  });
});

describe("workoutFeedbackSchema", () => {
  it("accepts all-null feedback", () => {
    const feedback = {
      actualRpe: null,
      completionNotes: null,
      completedAsPlanned: null,
      actualDuration: null,
      actualDistance: null,
      conditions: null,
      customConditions: null,
    };

    expect(workoutFeedbackSchema.parse(feedback)).toEqual(feedback);
  });

  it("accepts fully populated feedback", () => {
    const feedback = {
      actualRpe: 7,
      completionNotes: "Felt strong",
      completedAsPlanned: true,
      actualDuration: { value: 45, unit: "min" },
      actualDistance: { value: 10, unit: "km" },
      conditions: ["rain", "wind"],
      customConditions: ["jetlag"],
    };

    expect(workoutFeedbackSchema.parse(feedback)).toEqual(feedback);
  });

  it("rejects invalid condition in array", () => {
    expect(() =>
      workoutFeedbackSchema.parse({
        actualRpe: null,
        completionNotes: null,
        completedAsPlanned: null,
        actualDuration: null,
        actualDistance: null,
        conditions: ["tornado"],
        customConditions: null,
      })
    ).toThrow();
  });
});

describe("aiMetaSchema", () => {
  it("accepts valid AI metadata", () => {
    const meta = {
      promptVersion: "1.2.0",
      model: "gpt-4o",
      provider: "openai",
      processedAt: "2025-01-15T12:00:00Z",
    };

    expect(aiMetaSchema.parse(meta)).toEqual(meta);
  });

  it("rejects non-ISO processedAt", () => {
    expect(() =>
      aiMetaSchema.parse({
        promptVersion: "1.0.0",
        model: "m",
        provider: "p",
        processedAt: "yesterday",
      })
    ).toThrow();
  });
});

describe("workoutRecordSchema", () => {
  const validRecord = {
    id: "550e8400-e29b-41d4-a716-446655440000",
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

  it("accepts valid workout record", () => {
    expect(workoutRecordSchema.parse(validRecord)).toEqual(validRecord);
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, id: "not-a-uuid" })
    ).toThrow();
  });

  it("rejects invalid date format", () => {
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, date: "15-01-2025" })
    ).toThrow();
  });

  it("rejects invalid state", () => {
    expect(() =>
      workoutRecordSchema.parse({ ...validRecord, state: "archived" })
    ).toThrow();
  });

  it("accepts all workout states", () => {
    const states = [
      "raw",
      "structured",
      "ready",
      "pushed",
      "modified",
      "stale",
      "skipped",
    ];

    for (const state of states) {
      const record = { ...validRecord, state };

      expect(workoutRecordSchema.parse(record).state).toBe(state);
    }
  });

  it("rejects non-ISO createdAt", () => {
    expect(() =>
      workoutRecordSchema.parse({
        ...validRecord,
        createdAt: "not-a-datetime",
      })
    ).toThrow();
  });
});
