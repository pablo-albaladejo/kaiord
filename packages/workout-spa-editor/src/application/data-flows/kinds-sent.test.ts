import { describe, expect, it } from "vitest";

import { kindsSent } from "./kinds-sent";

describe("kindsSent", () => {
  it("should name every kind a generation carries when its health data goes", () => {
    // Arrange
    const healthSent = true;

    // Act
    const kinds = kindsSent("generation", healthSent);

    // Assert
    expect(kinds).toEqual([
      "workoutDescription",
      "aiInstructions",
      "powerPaceZones",
      "heartRateZones",
    ]);
  });

  it("should leave out the health kinds when the athlete withheld them", () => {
    // Arrange
    const healthSent = false;

    // Act
    const kinds = kindsSent("assistant", healthSent);

    // Assert
    expect(kinds).toEqual([
      "messages",
      "workouts",
      "coachingPlan",
      "dataSources",
    ]);
  });
});
