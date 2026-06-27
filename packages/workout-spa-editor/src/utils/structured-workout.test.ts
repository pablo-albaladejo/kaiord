import { describe, expect, it } from "vitest";

import type { KRD } from "../types/krd";
import { getStructuredWorkout, withCoachNotes } from "./structured-workout";

const structuredKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps: [] } },
});

describe("withCoachNotes", () => {
  it("should set workout-level notes from a description", () => {
    // Arrange
    const krd = structuredKrd();
    const description = "Warmup Z1 — see [video](https://youtu.be/abc)";

    // Act
    const result = withCoachNotes(krd, description);

    // Assert
    expect(getStructuredWorkout(result)?.notes).toBe(description);
  });

  it("should return krd unchanged when description is empty", () => {
    // Arrange
    const krd = structuredKrd();

    // Act
    const result = withCoachNotes(krd, "");

    // Assert
    expect(result).toBe(krd);
    expect(getStructuredWorkout(result)?.notes).toBeUndefined();
  });

  it("should return krd unchanged when there is no structured workout", () => {
    // Arrange
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
    };

    // Act
    const result = withCoachNotes(krd, "some note");

    // Assert
    expect(result).toBe(krd);
  });

  it("should not mutate the original krd", () => {
    // Arrange
    const krd = structuredKrd();

    // Act
    withCoachNotes(krd, "a note");

    // Assert
    expect(getStructuredWorkout(krd)?.notes).toBeUndefined();
  });
});
