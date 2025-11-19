import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConsoleLogger } from "../../../adapters/logger/console-logger";
import { createZwiftValidator } from "../../../adapters/zwift/xsd-validator";

describe("Zwift Fixtures", () => {
  const logger = createConsoleLogger();
  const validator = createZwiftValidator(logger);
  const fixturesDir = __dirname;

  const fixtures = [
    "WorkoutIndividualSteps.zwo",
    "WorkoutRepeatSteps.zwo",
    "WorkoutRepeatGreaterThanStep.zwo",
    "WorkoutCustomTargetValues.zwo",
  ];

  describe("XSD validation", () => {
    fixtures.forEach((filename) => {
      it(`should validate ${filename} against Zwift XSD schema`, async () => {
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
        expect(xmlContent).toContain("<workout_file");
        expect(xmlContent).toContain("<name>");
        expect(xmlContent).toContain("<sportType>");
        expect(xmlContent).toContain("<workout>");
      });
    });
  });

  describe("workout content", () => {
    it("should have SteadyState intervals in WorkoutIndividualSteps.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutIndividualSteps.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<SteadyState");
      expect(xmlContent).toContain('Duration="');
    });

    it("should have IntervalsT blocks in WorkoutRepeatSteps.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutRepeatSteps.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<IntervalsT");
      expect(xmlContent).toContain('Repeat="');
      expect(xmlContent).toContain('OnDuration="');
      expect(xmlContent).toContain('OffDuration="');
    });

    it("should have ramp intervals in WorkoutCustomTargetValues.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutCustomTargetValues.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<Ramp");
      expect(xmlContent).toContain("<Cooldown");
      expect(xmlContent).toContain('PowerLow="');
      expect(xmlContent).toContain('PowerHigh="');
    });

    it("should have SteadyState intervals in WorkoutRepeatGreaterThanStep.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutRepeatGreaterThanStep.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<SteadyState");
      expect(xmlContent).toContain('Duration="');
    });
  });

  describe("metadata", () => {
    fixtures.forEach((filename) => {
      it(`should have required metadata in ${filename}`, () => {
        // Arrange
        const filePath = join(fixturesDir, filename);
        const xmlContent = readFileSync(filePath, "utf-8");

        // Assert
        expect(xmlContent).toContain("<name>");
        expect(xmlContent).toContain("<sportType>");
      });
    });
  });
});
