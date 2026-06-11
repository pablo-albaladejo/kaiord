/**
 * Test Utilities - Fixtures Tests
 *
 * Unit tests for fixture loading utilities exported from test-utils.
 */

import { existsSync } from "fs";
import { describe, expect, it } from "vitest";
import {
  FIXTURE_NAMES,
  getFixturePath,
  loadFitFixture,
  loadFixturePair,
  loadKrdFixture,
  loadKrdFixtureRaw,
} from "./fixtures";

describe("FIXTURE_NAMES", () => {
  it("should export the four fixture name constants", () => {
    // Arrange

    // Act
    const keys = Object.keys(FIXTURE_NAMES);

    // Assert
    expect(keys).toHaveLength(4);
    expect(FIXTURE_NAMES.INDIVIDUAL_STEPS).toBe("WorkoutIndividualSteps");
    expect(FIXTURE_NAMES.REPEAT_STEPS).toBe("WorkoutRepeatSteps");
    expect(FIXTURE_NAMES.CUSTOM_TARGET_VALUES).toBe(
      "WorkoutCustomTargetValues"
    );
    expect(FIXTURE_NAMES.REPEAT_GREATER_THAN).toBe(
      "WorkoutRepeatGreaterThanStep"
    );
  });
});

describe("getFixturePath", () => {
  it("should resolve a fixture path that points at an existing file", () => {
    // Arrange

    // Act
    const path = getFixturePath("krd", "WorkoutIndividualSteps.krd");

    // Assert
    expect(path).toContain("test-fixtures/krd");
    expect(path).toContain("WorkoutIndividualSteps.krd");
    expect(existsSync(path)).toBe(true);
  });
});

describe("loadFitFixture", () => {
  it("should load a FIT fixture as a non-empty Uint8Array", () => {
    // Arrange

    // Act
    const buffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Assert
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should throw error for non-existent FIT file", () => {
    // Arrange

    // Act & Assert
    expect(() => loadFitFixture("NonExistent.fit")).toThrow();
  });
});

describe("loadKrdFixture", () => {
  it("should load a KRD fixture as a parsed structured-workout object", () => {
    // Arrange

    // Act
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
    expect(krd.metadata).toBeDefined();
    expect(krd.extensions).toBeDefined();
  });

  it("should throw error for non-existent KRD file", () => {
    // Arrange

    // Act & Assert
    expect(() => loadKrdFixture("NonExistent.krd")).toThrow();
  });
});

describe("loadKrdFixtureRaw", () => {
  it("should load a KRD fixture as a raw JSON string matching the parsed object", () => {
    // Arrange

    // Act
    const raw = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const parsed = loadKrdFixture("WorkoutIndividualSteps.krd");

    // Assert
    expect(typeof raw).toBe("string");
    expect(JSON.parse(raw)).toStrictEqual(parsed);
  });

  it("should throw error for non-existent KRD file", () => {
    // Arrange

    // Act & Assert
    expect(() => loadKrdFixtureRaw("NonExistent.krd")).toThrow();
  });
});

describe("loadFixturePair", () => {
  it("should load every available pair as a FIT buffer plus a parsed KRD", () => {
    // Arrange
    const fixtureNames = Object.values(FIXTURE_NAMES);

    // Act & Assert
    for (const name of fixtureNames) {
      const { fit, krd } = loadFixturePair(name);
      expect(fit).toBeInstanceOf(Uint8Array);
      expect(fit.length).toBeGreaterThan(0);
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("structured_workout");
    }
  });

  it("should throw error for non-existent fixture pair", () => {
    // Arrange

    // Act & Assert
    expect(() => loadFixturePair("NonExistent")).toThrow();
  });
});
