import { describe, expect, it } from "vitest";

import type { KRD } from "../types/krd";
import { classifyImportedKrd } from "./classify-imported-krd";

const krd = (overrides: Partial<KRD>): KRD =>
  ({
    version: "2.0",
    type: "structured_workout",
    metadata: { created: "2026-04-29T06:30:00.000Z", sport: "cycling" },
    ...overrides,
  }) as KRD;

describe("classifyImportedKrd", () => {
  it("should classify a recorded_activity as an activity", () => {
    // Arrange
    const input = krd({ type: "recorded_activity", records: [] });

    // Act
    const result = classifyImportedKrd(input);

    // Assert
    expect(result).toEqual({ kind: "activity", ambiguous: false });
  });

  it("should classify a structured_workout with no executed data as a workout", () => {
    // Arrange
    const input = krd({ type: "structured_workout" });

    // Act
    const result = classifyImportedKrd(input);

    // Assert
    expect(result).toEqual({ kind: "workout", ambiguous: false });
  });

  it("should classify a file carrying records/laps as an activity", () => {
    // Arrange
    const input = krd({
      type: "structured_workout",
      records: [{ timestamp: "2026-04-29T06:30:01.000Z" }],
    });

    // Act
    const result = classifyImportedKrd(input);

    // Assert
    expect(result).toEqual({ kind: "activity", ambiguous: false });
  });

  it("should default an inconclusive file to activity with a warning", () => {
    // Arrange
    const input = krd({ type: "course" });

    // Act
    const result = classifyImportedKrd(input);

    // Assert
    expect(result).toEqual({ kind: "activity", ambiguous: true });
  });
});
