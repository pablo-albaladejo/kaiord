import { describe, expect, it } from "vitest";

import {
  aiMetaSchema,
  workoutCommentSchema,
  workoutFeedbackSchema,
  workoutRawSchema,
} from "./calendar-fragments";

describe("workoutCommentSchema", () => {
  it("should accept valid comment with ISO timestamp", () => {
    // Arrange

    // Act

    const comment = {
      author: "coach",
      text: "Great session",
      timestamp: "2025-01-15T10:30:00Z",
    };

    // Assert

    expect(workoutCommentSchema.parse(comment)).toEqual(comment);
  });

  it("should reject non-ISO timestamp", () => {
    // Arrange

    // Act

    // Assert
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

  it("should accept valid raw payload", () => {
    // Arrange

    // Act

    // Assert
    expect(workoutRawSchema.parse(validRaw)).toEqual(validRaw);
  });

  it("should accept null distance and duration", () => {
    // Arrange

    // Act

    const raw = { ...validRaw, distance: null, duration: null };

    // Assert

    expect(workoutRawSchema.parse(raw)).toEqual(raw);
  });

  it("should reject prescribedRpe below 1", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRawSchema.parse({ ...validRaw, prescribedRpe: 0 })
    ).toThrow();
  });

  it("should reject prescribedRpe above 10", () => {
    // Arrange

    // Act

    // Assert
    expect(() =>
      workoutRawSchema.parse({ ...validRaw, prescribedRpe: 11 })
    ).toThrow();
  });

  it("should accept null prescribedRpe", () => {
    // Arrange

    // Act

    const raw = { ...validRaw, prescribedRpe: null };

    // Assert

    expect(workoutRawSchema.parse(raw)).toEqual(raw);
  });
});

describe("workoutFeedbackSchema", () => {
  it("should accept all-null feedback", () => {
    // Arrange

    // Act

    const feedback = {
      actualRpe: null,
      completionNotes: null,
      completedAsPlanned: null,
      actualDuration: null,
      actualDistance: null,
      conditions: null,
      customConditions: null,
    };

    // Assert

    expect(workoutFeedbackSchema.parse(feedback)).toEqual(feedback);
  });

  it("should accept fully populated feedback", () => {
    // Arrange

    // Act

    const feedback = {
      actualRpe: 7,
      completionNotes: "Felt strong",
      completedAsPlanned: true,
      actualDuration: { value: 45, unit: "min" },
      actualDistance: { value: 10, unit: "km" },
      conditions: ["rain", "wind"],
      customConditions: ["jetlag"],
    };

    // Assert

    expect(workoutFeedbackSchema.parse(feedback)).toEqual(feedback);
  });

  it("should reject invalid condition in array", () => {
    // Arrange

    // Act

    // Assert
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
  it("should accept valid AI metadata", () => {
    // Arrange

    // Act

    const meta = {
      promptVersion: "1.2.0",
      model: "gpt-4o",
      provider: "openai",
      processedAt: "2025-01-15T12:00:00Z",
    };

    // Assert

    expect(aiMetaSchema.parse(meta)).toEqual(meta);
  });

  it("should reject non-ISO processedAt", () => {
    // Arrange

    // Act

    // Assert
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
