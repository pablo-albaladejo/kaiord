/**
 * Test Fixtures - Usage Examples
 *
 * Demonstrates how to use shared fixtures from @kaiord/core
 */

import { describe, expect, it } from "vitest";
import { FIXTURE_NAMES, loadKrdFixture } from "./fixtures";

describe("Shared Fixtures", () => {
  it("should load WorkoutIndividualSteps fixture", () => {
    // Arrange & Act
    const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
    expect(krd.extensions?.workout).toBeDefined();
  });

  it("should load WorkoutRepeatSteps fixture", () => {
    // Arrange & Act
    const krd = loadKrdFixture(`${FIXTURE_NAMES.REPEAT_STEPS}.krd`);

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
    expect(krd.extensions?.workout?.steps).toBeDefined();
  });

  it("should load all available fixtures", () => {
    // Arrange
    const fixtureNames = Object.values(FIXTURE_NAMES);

    // Act & Assert
    for (const name of fixtureNames) {
      const krd = loadKrdFixture(`${name}.krd`);
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("workout");
    }
  });
});
