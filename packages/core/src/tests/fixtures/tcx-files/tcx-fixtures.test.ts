import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConsoleLogger } from "../../../adapters/logger/console-logger";
import { createXsdTcxValidator } from "../../../adapters/tcx/xsd-validator";

describe("TCX Fixtures", () => {
  const logger = createConsoleLogger();
  const validator = createXsdTcxValidator(logger);
  const fixturesDir = __dirname;

  const fixtures = [
    "WorkoutHeartRateTargets.tcx",
    "WorkoutSpeedTargets.tcx",
    "WorkoutRepeatBlocks.tcx",
    "WorkoutMixedDurations.tcx",
  ];

  describe("XSD validation", () => {
    fixtures.forEach((filename) => {
      it(`should validate ${filename} against TCX XSD schema`, async () => {
        // Arrange
        const filePath = join(fixturesDir, filename);
        const xmlContent = readFileSync(filePath, "utf-8");

        // Act
        const result = await validator(xmlContent);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe("file structure", () => {
    fixtures.forEach((filename) => {
      it(`should have valid XML structure in ${filename}`, () => {
        // Arrange
        const filePath = join(fixturesDir, filename);

        // Act
        const xmlContent = readFileSync(filePath, "utf-8");

        // Assert
        expect(xmlContent).toContain('<?xml version="1.0"');
        expect(xmlContent).toContain("TrainingCenterDatabase");
        expect(xmlContent).toContain("<Workouts>");
        expect(xmlContent).toContain("<Workout");
      });
    });
  });

  describe("workout content", () => {
    it("should have heart rate targets in WorkoutHeartRateTargets.tcx", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutHeartRateTargets.tcx");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("HeartRate_t");
      expect(xmlContent).toContain("PredefinedHeartRateZone_t");
      expect(xmlContent).toContain("CustomHeartRateZone_t");
    });

    it("should have speed targets in WorkoutSpeedTargets.tcx", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutSpeedTargets.tcx");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("Speed_t");
      expect(xmlContent).toContain("CustomSpeedZone_t");
      expect(xmlContent).toContain("LowInMetersPerSecond");
      expect(xmlContent).toContain("HighInMetersPerSecond");
    });

    it("should have repeat blocks in WorkoutRepeatBlocks.tcx", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutRepeatBlocks.tcx");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("Repeat_t");
      expect(xmlContent).toContain("<Repetitions>");
      expect(xmlContent).toContain("<Child");
    });

    it("should have mixed durations in WorkoutMixedDurations.tcx", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutMixedDurations.tcx");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("Time_t");
      expect(xmlContent).toContain("Distance_t");
      expect(xmlContent).toContain("UserInitiated_t");
      expect(xmlContent).toContain("CaloriesBurned_t");
      expect(xmlContent).toContain("HeartRateAbove_t");
      expect(xmlContent).toContain("HeartRateBelow_t");
    });
  });
});
