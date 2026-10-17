import { describe, expect, it } from "vitest";

import {
  buildAthleteContext,
  MAX_ATHLETE_INSTRUCTIONS,
} from "./athlete-context";

describe("buildAthleteContext", () => {
  it("should wrap zones and instructions in their own delimiters", () => {
    // Arrange
    const input = {
      zonesText: "Pace zones: Z1 6:30-5:45/km",
      instructions: "Prefer pace targets",
    };

    // Act
    const result = buildAthleteContext(input);

    // Assert
    expect(result).toBe(
      "<athlete_zones>\nPace zones: Z1 6:30-5:45/km\n</athlete_zones>\n\n" +
        "<athlete_instructions>\nPrefer pace targets\n</athlete_instructions>"
    );
  });

  it("should return an empty string when the athlete has neither", () => {
    // Arrange
    const input = { zonesText: "  ", instructions: "" };

    // Act
    const result = buildAthleteContext(input);

    // Assert
    expect(result).toBe("");
  });

  it("should cap the athlete's instructions", () => {
    // Arrange
    const input = { instructions: "a".repeat(MAX_ATHLETE_INSTRUCTIONS + 1) };

    // Act
    const result = buildAthleteContext(input);

    // Assert
    const body = result.split("\n")[1];
    expect(body).toHaveLength(MAX_ATHLETE_INSTRUCTIONS);
  });
});
