import { createMockLogger, loadKrdFixture } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { convertKRDToZwift } from "./krd-to-zwift.converter";

// Characterization tests for convertKRDToZwift. Capture current behavior
// against canonical KRD fixtures so the converter cannot regress without
// a deliberate test update. Production code is not modified by PR3.
describe("convertKRDToZwift (characterization)", () => {
  it("should emit an XML declaration and workout_file root element", () => {
    // Arrange
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
    const logger = createMockLogger();

    // Act
    const xml = convertKRDToZwift(krd, logger);

    // Assert
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<workout_file");
    expect(xml).toContain("</workout_file>");
  });

  it("should declare the kaiord namespace on the workout_file root", () => {
    // Arrange
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
    const logger = createMockLogger();

    // Act
    const xml = convertKRDToZwift(krd, logger);

    // Assert
    expect(xml).toContain(
      'xmlns:kaiord="http://kaiord.dev/zwift-extensions/1.0"'
    );
  });

  it("should include the workout name from extensions.structured_workout", () => {
    // Arrange
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
    const logger = createMockLogger();

    // Act
    const xml = convertKRDToZwift(krd, logger);

    // Assert
    expect(xml).toContain("<name>Example 1</name>");
  });

  it("should emit a SteadyState block for individual steps fixture", () => {
    // Arrange
    const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
    const logger = createMockLogger();

    // Act
    const xml = convertKRDToZwift(krd, logger);

    // Assert
    expect(xml).toContain("<workout>");
    expect(xml).toContain("SteadyState");
  });

  it("should emit a repeating IntervalsT block for the repeat fixture", () => {
    // Arrange
    const krd = loadKrdFixture("WorkoutRepeatSteps.krd");
    const logger = createMockLogger();

    // Act
    const xml = convertKRDToZwift(krd, logger);

    // Assert
    expect(xml).toContain("<workout>");
    expect(xml).toContain("IntervalsT");
  });

  it("should throw when extensions.structured_workout is missing", () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    const krd = {
      version: "1.0" as const,
      type: "structured_workout" as const,
      metadata: { sport: "cycling" as const },
      extensions: {},
    };

    // Assert
    expect(() => convertKRDToZwift(krd, logger)).toThrow();
  });
});
