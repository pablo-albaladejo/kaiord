import { describe, expect, it } from "vitest";

import { plannedSessionSchema } from "./planned-session";

const validSession = {
  kind: "planned_session" as const,
  date: "2026-04-29",
  sport: "cycling",
  title: "Threshold intervals",
  coach_notes: "4x8min @ FTP",
  duration_seconds: 3600,
  workload: 82,
  intensity: 4,
  status: "pending" as const,
  completion_percent: 0,
  source: "train2go",
  source_id: "28035",
};

describe("plannedSessionSchema", () => {
  it("should accept a fully-populated planned session", () => {
    // Arrange

    // Act
    const result = plannedSessionSchema.safeParse(validSession);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should accept a minimal planned session with only required fields", () => {
    // Arrange
    const minimal = {
      kind: "planned_session" as const,
      date: "2026-04-29",
      sport: "running",
      title: "Easy run",
      status: "completed" as const,
      source: "train2go",
      source_id: "1",
    };

    // Act
    const result = plannedSessionSchema.safeParse(minimal);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject an intensity outside the 1-5 range", () => {
    // Arrange
    const invalid = { ...validSession, intensity: 6 };

    // Act
    const result = plannedSessionSchema.safeParse(invalid);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject a malformed date", () => {
    // Arrange
    const invalid = { ...validSession, date: "29-04-2026" };

    // Act
    const result = plannedSessionSchema.safeParse(invalid);

    // Assert
    expect(result.success).toBe(false);
  });
});
