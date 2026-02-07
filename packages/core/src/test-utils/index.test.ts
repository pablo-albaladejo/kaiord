/**
 * Test Utilities - Index Re-exports Tests
 *
 * Tests for re-exported functions from test-utils index.
 * This ensures the public API exports work correctly.
 */

import { describe, expect, it } from "vitest";
import {
  FIXTURE_NAMES,
  getFixturePath,
  loadFitFixture,
  loadFixturePair,
  loadKrdFixture,
  loadKrdFixtureRaw,
} from "./index";

describe("test-utils index re-exports", () => {
  it("should export FIXTURE_NAMES constant", () => {
    // Assert
    expect(FIXTURE_NAMES).toBeDefined();
    expect(FIXTURE_NAMES.INDIVIDUAL_STEPS).toBe("WorkoutIndividualSteps");
    expect(FIXTURE_NAMES.REPEAT_STEPS).toBe("WorkoutRepeatSteps");
  });

  it("should export getFixturePath function", () => {
    // Act
    const path = getFixturePath("fit", "WorkoutIndividualSteps.fit");

    // Assert
    expect(path).toBeDefined();
    expect(path).toContain("WorkoutIndividualSteps.fit");
  });

  it("should export loadFitFixture function", () => {
    // Act
    const buffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Assert
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should export loadKrdFixture function", () => {
    // Act
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

    // Assert
    expect(krd).toBeDefined();
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
  });

  it("should export loadKrdFixtureRaw function", () => {
    // Act
    const raw = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Assert
    expect(typeof raw).toBe("string");
    expect(raw.length).toBeGreaterThan(0);
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("should export loadFixturePair function", () => {
    // Act
    const { fit, krd } = loadFixturePair("WorkoutIndividualSteps");

    // Assert
    expect(fit).toBeInstanceOf(Uint8Array);
    expect(krd).toBeDefined();
    expect(krd.version).toBe("1.0");
  });
});
