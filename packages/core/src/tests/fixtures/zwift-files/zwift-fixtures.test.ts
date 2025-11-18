import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createConsoleLogger } from "../../../adapters/logger/console-logger";
import { createXsdZwiftValidator } from "../../../adapters/zwift/xsd-validator";

describe("Zwift Fixtures", () => {
  const logger = createConsoleLogger();
  const validator = createXsdZwiftValidator(logger);
  const fixturesDir = __dirname;

  const fixtures = [
    "WorkoutSteadyState.zwo",
    "WorkoutIntervalsT.zwo",
    "WorkoutRampIntervals.zwo",
    "WorkoutMixedIntervals.zwo",
    "WorkoutTextEvents.zwo",
    "WorkoutRunningPace.zwo",
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
        expect(xmlContent).toContain("<workout_file>");
        expect(xmlContent).toContain("<name>");
        expect(xmlContent).toContain("<sportType>");
        expect(xmlContent).toContain("<workout>");
      });
    });
  });

  describe("workout content", () => {
    it("should have SteadyState intervals in WorkoutSteadyState.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutSteadyState.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<SteadyState");
      expect(xmlContent).toContain('Duration="');
      expect(xmlContent).toContain('Power="');
      expect(xmlContent).toContain('Cadence="');
    });

    it("should have IntervalsT blocks in WorkoutIntervalsT.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutIntervalsT.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<IntervalsT");
      expect(xmlContent).toContain('Repeat="');
      expect(xmlContent).toContain('OnDuration="');
      expect(xmlContent).toContain('OffDuration="');
      expect(xmlContent).toContain('OnPower="');
      expect(xmlContent).toContain('OffPower="');
    });

    it("should have ramp intervals in WorkoutRampIntervals.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutRampIntervals.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<Warmup");
      expect(xmlContent).toContain("<Ramp");
      expect(xmlContent).toContain("<Cooldown");
      expect(xmlContent).toContain('PowerLow="');
      expect(xmlContent).toContain('PowerHigh="');
    });

    it("should have mixed interval types in WorkoutMixedIntervals.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutMixedIntervals.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<Warmup");
      expect(xmlContent).toContain("<SteadyState");
      expect(xmlContent).toContain("<IntervalsT");
      expect(xmlContent).toContain("<FreeRide");
      expect(xmlContent).toContain("<Ramp");
      expect(xmlContent).toContain("<Cooldown");
    });

    it("should have text events in WorkoutTextEvents.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutTextEvents.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<textevent");
      expect(xmlContent).toContain('message="');
      expect(xmlContent).toContain('timeoffset="');
    });

    it("should have pace targets in WorkoutRunningPace.zwo", () => {
      // Arrange
      const filePath = join(fixturesDir, "WorkoutRunningPace.zwo");
      const xmlContent = readFileSync(filePath, "utf-8");

      // Assert
      expect(xmlContent).toContain("<sportType>run</sportType>");
      expect(xmlContent).toContain('pace="');
    });
  });

  describe("metadata", () => {
    fixtures.forEach((filename) => {
      it(`should have required metadata in ${filename}`, () => {
        // Arrange
        const filePath = join(fixturesDir, filename);
        const xmlContent = readFileSync(filePath, "utf-8");

        // Assert
        expect(xmlContent).toContain("<author>");
        expect(xmlContent).toContain("<name>");
        expect(xmlContent).toContain("<description>");
        expect(xmlContent).toContain("<tags>");
      });
    });
  });
});
