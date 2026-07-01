import { FitParsingError } from "@kaiord/core";
import {
  buildKRD,
  buildKRDMetadata,
  createMockLogger,
  loadFitFixture,
} from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import { FIT_REPEAT_COUNT_3, FIT_STEPS_COUNT_4 } from "../test-utils/constants";
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "./garmin-fitsdk";

describe("createGarminFitSdkReader", () => {
  describe("FitReader", () => {
    it("should parse valid FIT file and return KRD", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutIndividualSteps.fit");

      // Act
      const result = await reader(buffer);

      // Assert
      expect(result).toBeDefined();
      expect(result.version).toBe("1.0");
      expect(result.type).toBe("structured_workout");
      expect(result.metadata).toBeDefined();
      expect(result.metadata.sport).toBeDefined();
    });

    it("should extract metadata from fileId and workout messages", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutIndividualSteps.fit");

      // Act
      const result = await reader(buffer);

      // Assert
      expect(result.metadata.created).toBe("2009-09-09T20:38:00.000Z");
      expect(result.metadata.manufacturer).toBe("dynastream");
      expect(result.metadata.product).toBe("hrmFitSingleByteProductId");
      expect(result.metadata.serialNumber).toBe("1234");
      // Fixture workout message has no sport field; absence maps to `generic`
      // (the cycling default was removed in favor of the honest fallback).
      expect(result.metadata.sport).toBe("generic");
    });

    it("should convert workout steps in correct order", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutIndividualSteps.fit");
      const result = await reader(buffer);
      expect(result.extensions?.structured_workout).toBeDefined();

      // Act
      const workout = result.extensions?.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };

      // Assert
      expect(workout.name).toBe("Example 1");
      expect(workout.steps).toHaveLength(FIT_STEPS_COUNT_4);
      expect(workout.steps[0]).toMatchObject({
        stepIndex: 0,
        durationType: "time",
      });
      expect(workout.steps[1]).toMatchObject({
        stepIndex: 1,
        durationType: "distance",
      });
      expect(workout.steps[2]).toMatchObject({
        stepIndex: 2,
        durationType: "distance",
      });
      expect(workout.steps[3]).toMatchObject({
        stepIndex: 3,
        durationType: "heart_rate_less_than",
      });
    });

    it("should handle repetition blocks correctly", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutRepeatSteps.fit");
      const result = await reader(buffer);
      expect(result.extensions?.structured_workout).toBeDefined();
      const workout = result.extensions?.structured_workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.name).toBe("Example 2");
      expect(workout.steps).toHaveLength(FIT_REPEAT_COUNT_3);

      // Act
      const repetitionBlock = workout.steps[1] as {
        repeatCount: number;
        steps: Array<unknown>;
      };

      // Assert
      expect(repetitionBlock.repeatCount).toBe(FIT_REPEAT_COUNT_3);
      expect(repetitionBlock.steps).toHaveLength(2);
    });

    it("should decode a repeat-until-HR-greater-than step into its duration", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutRepeatGreaterThanStep.fit");
      const result = await reader(buffer);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ durationType: string; duration: unknown }>;
      };

      // Assert
      expect(workout.steps[3]).toMatchObject({
        durationType: "repeat_until_heart_rate_greater_than",
        duration: {
          type: "repeat_until_heart_rate_greater_than",
          bpm: 80,
          repeatFrom: 1,
        },
      });
    });

    it("should decode custom target values into a range target", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutCustomTargetValues.fit");
      const result = await reader(buffer);

      // Act
      const workout = result.extensions?.structured_workout as {
        steps: Array<{ targetType: string; target: unknown }>;
      };

      // Assert
      expect(workout.steps[1]).toMatchObject({
        targetType: "power",
        target: {
          type: "power",
          value: { unit: "range", min: 300, max: 310 },
        },
      });
    });

    it("should throw FitParsingError when buffer is corrupted", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);

      // Act
      const corruptedBuffer = new Uint8Array([0, 0, 0, 0]);

      // Assert
      await expect(reader(corruptedBuffer)).rejects.toThrow(FitParsingError);
    });

    it("should throw FitParsingError when buffer is empty", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);

      // Act
      const emptyBuffer = new Uint8Array([]);

      // Assert
      await expect(reader(emptyBuffer)).rejects.toThrow(FitParsingError);
    });

    it("should preserve FIT extensions in extensions.fit", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const buffer = loadFitFixture("WorkoutIndividualSteps.fit");

      // Act
      const result = await reader(buffer);

      // Assert
      expect(result.extensions).toBeDefined();
      expect(result.extensions?.fit).toBeDefined();
    });
  });
});

describe("createGarminFitSdkWriter", () => {
  describe("FitWriter", () => {
    it("should reject when the encoder cannot serialize the produced messages", async () => {
      // Arrange
      const logger = createMockLogger();
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "structured_workout",
        metadata: buildKRDMetadata.build({ sport: "cycling" }),
      });

      // Act
      const encode = writer(krd);

      // Assert
      await expect(encode).rejects.toThrow(FitParsingError);
    });
  });
});
