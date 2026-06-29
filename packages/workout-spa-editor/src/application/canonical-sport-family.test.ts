import { describe, expect, it } from "vitest";

import { canonicalSportFamily } from "./canonical-sport-family";

describe("canonicalSportFamily", () => {
  it.each([
    { input: "swim", expected: "swimming" },
    { input: "open_water_swim", expected: "swimming" },
    { input: "lap_swimming", expected: "swimming" },
    { input: "pool_swim", expected: "swimming" },
    { input: "bike", expected: "cycling" },
    { input: "cycling", expected: "cycling" },
    { input: "road_cycling", expected: "cycling" },
    { input: "gravel_cycling", expected: "cycling" },
    { input: "mountain_biking", expected: "cycling" },
    { input: "indoor_cycling", expected: "cycling" },
    { input: "virtual_cycle", expected: "cycling" },
    { input: "run", expected: "running" },
    { input: "running", expected: "running" },
    { input: "trail_running", expected: "running" },
    { input: "treadmill_running", expected: "running" },
    { input: "track_running", expected: "running" },
    { input: "gym", expected: "strength" },
    { input: "strength", expected: "strength" },
    { input: "strength_training", expected: "strength" },
    { input: "weightlifting", expected: "strength" },
    { input: "core", expected: "strength" },
    { input: "yoga", expected: "yoga" },
    { input: "kayaking", expected: "kayaking" },
    { input: "pilates", expected: "pilates" },
    { input: "SWIM", expected: "swimming" },
    { input: "Cycling", expected: "cycling" },
  ])(
    "should map $input to canonical family $expected",
    ({ input, expected }) => {
      // Arrange

      // Act
      const result = canonicalSportFamily(input);

      // Assert
      expect(result).toBe(expected);
    }
  );
});
