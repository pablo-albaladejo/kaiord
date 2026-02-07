import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { KRD } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { createGarminFitSdkReader } from "./garmin-fitsdk";

describe("Backward Compatibility", () => {
  const logger = createMockLogger();
  const fitReader = createGarminFitSdkReader(logger);

  describe("KRD files without new fields", () => {
    it("should parse WorkoutIndividualSteps.krd without new fields", () => {
      // Arrange
      const krdPath = resolve(
        __dirname,
        "../../tests/fixtures/krd-files/WorkoutIndividualSteps.krd"
      );
      const krdContent = readFileSync(krdPath, "utf-8");

      // Act
      const krd: KRD = JSON.parse(krdContent);

      // Assert - Verify no new fields are present in the KRD file
      const workout = krd.extensions?.workout as Record<string, unknown>;
      expect(workout?.subSport).toBeUndefined();
      expect(workout?.poolLength).toBeUndefined();
      expect(workout?.poolLengthUnit).toBeUndefined();

      // Verify steps don't have new fields
      const steps = (workout?.steps as Array<Record<string, unknown>>) || [];
      for (const step of steps) {
        if ("stepIndex" in step) {
          expect(step.notes).toBeUndefined();
          expect(step.equipment).toBeUndefined();
        }
      }
    });

    it("should parse WorkoutRepeatSteps.krd without new fields", () => {
      // Arrange
      const krdPath = resolve(
        __dirname,
        "../../tests/fixtures/krd-files/WorkoutRepeatSteps.krd"
      );
      const krdContent = readFileSync(krdPath, "utf-8");

      // Act
      const krd: KRD = JSON.parse(krdContent);

      // Assert - Verify no new fields are present
      const workout = krd.extensions?.workout as Record<string, unknown>;
      expect(workout?.subSport).toBeUndefined();
      expect(workout?.poolLength).toBeUndefined();
    });
  });

  describe("FIT files without new fields", () => {
    it("should process WorkoutIndividualSteps.fit without new fields", async () => {
      // Arrange
      const fitPath = resolve(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const fitBuffer = readFileSync(fitPath);

      // Act
      const krd = await fitReader(fitBuffer);

      // Assert - Verify no new fields are present
      const workout = krd.extensions?.workout as Record<string, unknown>;
      expect(workout?.subSport).toBeUndefined();
      expect(workout?.poolLength).toBeUndefined();
      expect(workout?.poolLengthUnit).toBeUndefined();

      // Verify steps don't have new fields
      const steps = (workout?.steps as Array<Record<string, unknown>>) || [];
      for (const step of steps) {
        if ("stepIndex" in step) {
          expect(step.notes).toBeUndefined();
          expect(step.equipment).toBeUndefined();
        }
      }
    });

    it("should process WorkoutRepeatSteps.fit without new fields", async () => {
      // Arrange
      const fitPath = resolve(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutRepeatSteps.fit"
      );
      const fitBuffer = readFileSync(fitPath);

      // Act
      const krd = await fitReader(fitBuffer);

      // Assert - Verify no new fields are present
      const workout = krd.extensions?.workout as Record<string, unknown>;
      expect(workout?.subSport).toBeUndefined();
      expect(workout?.poolLength).toBeUndefined();
    });
  });

  describe("Optional fields are truly optional", () => {
    it("should omit optional fields when undefined, not set to null", async () => {
      // Arrange
      const fitPath = resolve(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const fitBuffer = readFileSync(fitPath);

      // Act
      const krd = await fitReader(fitBuffer);

      // Assert - Fields should be undefined, not null
      const workout = krd.extensions?.workout as Record<string, unknown>;
      expect(workout?.subSport).toBeUndefined();
      expect(workout?.subSport).not.toBe(null);
      expect(workout?.poolLength).toBeUndefined();
      expect(workout?.poolLength).not.toBe(null);

      // Check steps
      const steps = (workout?.steps as Array<Record<string, unknown>>) || [];
      for (const step of steps) {
        if ("stepIndex" in step) {
          expect(step.notes).toBeUndefined();
          expect(step.notes).not.toBe(null);
          expect(step.equipment).toBeUndefined();
          expect(step.equipment).not.toBe(null);
        }
      }
    });
  });

  describe("API compatibility", () => {
    it("should maintain existing API surface", async () => {
      // Arrange
      const fitPath = resolve(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const fitBuffer = readFileSync(fitPath);

      // Act - Use existing API methods
      const krd = await fitReader(fitBuffer);

      // Assert - API methods work as before
      expect(krd).toBeDefined();
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("workout");
      expect(krd.metadata).toBeDefined();
      expect(krd.metadata.sport).toBeDefined();
      expect(krd.extensions?.workout).toBeDefined();
    });
  });
});
