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
  it("should export all fixture name constants", () => {
    // Assert
    expect(FIXTURE_NAMES.INDIVIDUAL_STEPS).toBe("WorkoutIndividualSteps");
    expect(FIXTURE_NAMES.REPEAT_STEPS).toBe("WorkoutRepeatSteps");
    expect(FIXTURE_NAMES.CUSTOM_TARGET_VALUES).toBe(
      "WorkoutCustomTargetValues"
    );
    expect(FIXTURE_NAMES.REPEAT_GREATER_THAN).toBe(
      "WorkoutRepeatGreaterThanStep"
    );
  });

  it("should have exactly 4 fixture names", () => {
    // Act
    const keys = Object.keys(FIXTURE_NAMES);

    // Assert
    expect(keys).toHaveLength(4);
  });
});

describe("getFixturePath", () => {
  it("should resolve FIT fixture path correctly", () => {
    // Act
    const path = getFixturePath("fit", "WorkoutIndividualSteps.fit");

    // Assert
    expect(path).toContain("fit-files");
    expect(path).toContain("WorkoutIndividualSteps.fit");
    expect(existsSync(path)).toBe(true);
  });

  it("should resolve KRD fixture path correctly", () => {
    // Act
    const path = getFixturePath("krd", "WorkoutIndividualSteps.krd");

    // Assert
    expect(path).toContain("krd-files");
    expect(path).toContain("WorkoutIndividualSteps.krd");
    expect(existsSync(path)).toBe(true);
  });

  it("should resolve all available FIT fixtures", () => {
    // Arrange
    const fitFiles = [
      "WorkoutIndividualSteps.fit",
      "WorkoutRepeatSteps.fit",
      "WorkoutCustomTargetValues.fit",
      "WorkoutRepeatGreaterThanStep.fit",
    ];

    // Act & Assert
    for (const filename of fitFiles) {
      const path = getFixturePath("fit", filename);
      expect(existsSync(path)).toBe(true);
    }
  });

  it("should resolve all available KRD fixtures", () => {
    // Arrange
    const krdFiles = [
      "WorkoutIndividualSteps.krd",
      "WorkoutRepeatSteps.krd",
      "WorkoutCustomTargetValues.krd",
      "WorkoutRepeatGreaterThanStep.krd",
    ];

    // Act & Assert
    for (const filename of krdFiles) {
      const path = getFixturePath("krd", filename);
      expect(existsSync(path)).toBe(true);
    }
  });
});

describe("loadFitFixture", () => {
  it("should load FIT fixture as Uint8Array", () => {
    // Act
    const buffer = loadFitFixture("WorkoutIndividualSteps.fit");

    // Assert
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should load different FIT fixtures with different content", () => {
    // Act
    const buffer1 = loadFitFixture("WorkoutIndividualSteps.fit");
    const buffer2 = loadFitFixture("WorkoutRepeatSteps.fit");

    // Assert
    expect(buffer1).toBeInstanceOf(Uint8Array);
    expect(buffer2).toBeInstanceOf(Uint8Array);
    expect(buffer1.length).not.toBe(buffer2.length);
  });

  it("should load all available FIT fixtures", () => {
    // Arrange
    const fixtureNames = Object.values(FIXTURE_NAMES);

    // Act & Assert
    for (const name of fixtureNames) {
      const buffer = loadFitFixture(`${name}.fit`);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(0);
    }
  });

  it("should throw error for non-existent FIT file", () => {
    // Act & Assert
    expect(() => loadFitFixture("NonExistent.fit")).toThrow();
  });
});

describe("loadKrdFixture", () => {
  it("should load KRD fixture as parsed object", () => {
    // Act
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

    // Assert
    expect(krd).toBeDefined();
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
  });

  it("should load WorkoutIndividualSteps with expected structure", () => {
    // Act
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
    expect(krd.metadata).toBeDefined();
    expect(krd.extensions).toBeDefined();
  });

  it("should load WorkoutRepeatSteps with expected structure", () => {
    // Act
    const krd = loadKrdFixture("WorkoutRepeatSteps.krd");

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
    expect(krd.metadata).toBeDefined();
    expect(krd.extensions).toBeDefined();
  });

  it("should load all available KRD fixtures", () => {
    // Arrange
    const fixtureNames = Object.values(FIXTURE_NAMES);

    // Act & Assert
    for (const name of fixtureNames) {
      const krd = loadKrdFixture(`${name}.krd`);
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("workout");
      expect(krd.metadata).toBeDefined();
    }
  });

  it("should throw error for non-existent KRD file", () => {
    // Act & Assert
    expect(() => loadKrdFixture("NonExistent.krd")).toThrow();
  });

  it("should throw error for non-existent KRD file", () => {
    // Act & Assert
    expect(() => loadKrdFixture("NonExistent.krd")).toThrow();
  });
});

describe("loadKrdFixtureRaw", () => {
  it("should load KRD fixture as raw string", () => {
    // Act
    const raw = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Assert
    expect(typeof raw).toBe("string");
    expect(raw.length).toBeGreaterThan(0);
  });

  it("should return valid JSON string", () => {
    // Act
    const raw = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Assert
    expect(() => JSON.parse(raw)).not.toThrow();
    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe("1.0");
    expect(parsed.type).toBe("workout");
  });

  it("should load raw fixture as string and match parsed fixture when parsed", () => {
    // Act
    const raw = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const parsed = loadKrdFixture("WorkoutIndividualSteps.krd");

    // Assert
    expect(typeof raw).toBe("string");
    expect(typeof parsed).toBe("object");
    expect(JSON.parse(raw)).toStrictEqual(parsed);
  });

  it("should load all available KRD fixtures as raw strings", () => {
    // Arrange
    const fixtureNames = Object.values(FIXTURE_NAMES);

    // Act & Assert
    for (const name of fixtureNames) {
      const raw = loadKrdFixtureRaw(`${name}.krd`);
      expect(typeof raw).toBe("string");
      expect(raw.length).toBeGreaterThan(0);
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });

  it("should throw error for non-existent KRD file", () => {
    // Act & Assert
    expect(() => loadKrdFixtureRaw("NonExistent.krd")).toThrow();
  });
});

describe("loadFixturePair", () => {
  it("should load both FIT and KRD fixtures", () => {
    // Act
    const { fit, krd } = loadFixturePair("WorkoutIndividualSteps");

    // Assert
    expect(fit).toBeInstanceOf(Uint8Array);
    expect(fit.length).toBeGreaterThan(0);
    expect(krd).toBeDefined();
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
  });

  it("should load WorkoutIndividualSteps pair correctly", () => {
    // Act
    const { fit, krd } = loadFixturePair("WorkoutIndividualSteps");

    // Assert
    expect(fit).toBeInstanceOf(Uint8Array);
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
    expect(krd.metadata).toBeDefined();
    expect(krd.extensions?.workout).toBeDefined();
  });

  it("should load WorkoutRepeatSteps pair correctly", () => {
    // Act
    const { fit, krd } = loadFixturePair("WorkoutRepeatSteps");

    // Assert
    expect(fit).toBeInstanceOf(Uint8Array);
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("workout");
    expect(krd.extensions).toBeDefined();
  });

  it("should load all available fixture pairs", () => {
    // Arrange
    const fixtureNames = Object.values(FIXTURE_NAMES);

    // Act & Assert
    for (const name of fixtureNames) {
      const { fit, krd } = loadFixturePair(name);
      expect(fit).toBeInstanceOf(Uint8Array);
      expect(fit.length).toBeGreaterThan(0);
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("workout");
    }
  });

  it("should load pairs using FIXTURE_NAMES constants", () => {
    // Act
    const pair1 = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
    const pair2 = loadFixturePair(FIXTURE_NAMES.REPEAT_STEPS);
    const pair3 = loadFixturePair(FIXTURE_NAMES.CUSTOM_TARGET_VALUES);
    const pair4 = loadFixturePair(FIXTURE_NAMES.REPEAT_GREATER_THAN);

    // Assert
    expect(pair1.fit).toBeInstanceOf(Uint8Array);
    expect(pair1.krd.version).toBe("1.0");
    expect(pair2.fit).toBeInstanceOf(Uint8Array);
    expect(pair2.krd.version).toBe("1.0");
    expect(pair3.fit).toBeInstanceOf(Uint8Array);
    expect(pair3.krd.version).toBe("1.0");
    expect(pair4.fit).toBeInstanceOf(Uint8Array);
    expect(pair4.krd.version).toBe("1.0");
  });

  it("should throw error for non-existent fixture pair", () => {
    // Act & Assert
    expect(() => loadFixturePair("NonExistent")).toThrow();
  });
});

describe("Path Resolution", () => {
  it("should handle both dev and production paths", () => {
    // Act
    const fitPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
    const krdPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");

    // Assert
    expect(fitPath).toContain("fixtures");
    expect(krdPath).toContain("fixtures");
    expect(existsSync(fitPath)).toBe(true);
    expect(existsSync(krdPath)).toBe(true);
  });

  it("should resolve paths consistently across all functions", () => {
    // Act
    const explicitPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
    const raw = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Assert
    expect(existsSync(explicitPath)).toBe(true);
    expect(krd).toBeDefined();
    expect(raw).toBeDefined();
    expect(JSON.parse(raw)).toStrictEqual(krd);
  });
});
