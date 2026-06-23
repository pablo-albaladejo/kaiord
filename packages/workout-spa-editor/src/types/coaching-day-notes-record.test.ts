/**
 * Tests for the CoachingDayNotesRecord schema: valid round-trip, the
 * composite-id refinement, and the strict no-extra-fields guard (which
 * doubles as the avatar-URL exclusion guarantee).
 */
import { describe, expect, it } from "vitest";

import {
  buildCoachingDayNotesId,
  coachingDayNotesRecordSchema,
} from "./coaching-day-notes-record";

const valid = {
  id: "p1:train2go:2026-06-07",
  profileId: "p1",
  source: "train2go",
  date: "2026-06-07",
  comments: [
    {
      author: "Daniel Blanco Galindo",
      isOwn: false,
      timestamp: "2026-06-01 17:26:22",
      text: "Notas recordatorio…",
    },
  ],
  fetchedAt: "2026-06-12T10:00:00.000Z",
};

describe("coachingDayNotesRecordSchema", () => {
  it("should accept a valid record unchanged", () => {
    // Arrange
    const input = valid;

    // Act
    const result = coachingDayNotesRecordSchema.parse(input);

    // Assert
    expect(result).toEqual(valid);
  });

  it("should reject a record whose id does not match profileId:source:date", () => {
    // Arrange
    const input = { ...valid, id: "p1:train2go:2026-06-08" };

    // Act
    const result = coachingDayNotesRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an unknown top-level field such as an avatar URL", () => {
    // Arrange
    const input = { ...valid, avatarUrl: "https://example.com/a.png" };

    // Act
    const result = coachingDayNotesRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject an unknown field on a comment entry", () => {
    // Arrange
    const input = {
      ...valid,
      comments: [{ ...valid.comments[0], avatar: "https://x/a.png" }],
    };

    // Act
    const result = coachingDayNotesRecordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should build the canonical composite id", () => {
    // Arrange
    const parts = ["p1", "train2go", "2026-06-07"] as const;

    // Act
    const id = buildCoachingDayNotesId(...parts);

    // Assert
    expect(id).toBe("p1:train2go:2026-06-07");
  });
});
