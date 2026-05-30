import { describe, expect, it } from "vitest";

import type { KRD } from "../../../types/krd";
import { buildWorkoutRecord } from "./build-workout-record";

const KRD_FIXTURE: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-05-30T00:00:00.000Z", sport: "cycling" },
  extensions: { structured_workout: { sport: "cycling", steps: [] } },
};

describe("buildWorkoutRecord", () => {
  it("should build an ai-generated structured record", async () => {
    // Arrange
    const input = {
      profileId: "p1",
      sport: "cycling",
      prompt: "45 min Z2",
      title: "Endurance ride",
      krd: KRD_FIXTURE,
    };

    // Act
    const record = await buildWorkoutRecord(input);

    // Assert
    expect(record.source).toBe("ai-generated");
    expect(record.state).toBe("structured");
    expect(record.profileId).toBe("p1");
    expect(record.raw?.description).toBe("45 min Z2");
    expect(record.raw?.rawHash.length).toBeGreaterThan(0);
    expect(record.krd).toBe(KRD_FIXTURE);
  });
});
