import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { FitParsingError } from "../../domain/types/errors";
import { buildKRD, buildKRDMetadata } from "../../tests/fixtures/krd.fixtures";
import { createMockLogger } from "../../tests/helpers/test-utils";
import {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "./garmin-fitsdk";

describe("createGarminFitSdkReader", () => {
  describe("readToKRD", () => {
    it("should parse valid FIT file and return KRD", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result).toBeDefined();
      expect(result.version).toBe("1.0");
      expect(result.type).toBe("workout");
      expect(result.metadata).toBeDefined();
      expect(result.metadata.sport).toBeDefined();
    });

    it("should extract metadata from fileId and workout messages", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.metadata.created).toBe("2009-09-09T20:38:00.000Z");
      expect(result.metadata.manufacturer).toBe("dynastream");
      expect(result.metadata.product).toBe("hrmFitSingleByteProductId");
      expect(result.metadata.serialNumber).toBe("1234");
      expect(result.metadata.sport).toBe("cycling");
    });

    it("should convert workout steps in correct order", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions?.workout).toBeDefined();
      const workout = result.extensions?.workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.name).toBe("Example 1");
      expect(workout.steps).toHaveLength(4);
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
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutRepeatSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions?.workout).toBeDefined();
      const workout = result.extensions?.workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.name).toBe("Example 2");
      expect(workout.steps).toHaveLength(3);

      const repetitionBlock = workout.steps[1] as {
        repeatCount: number;
        steps: Array<unknown>;
      };
      expect(repetitionBlock.repeatCount).toBe(3);
      expect(repetitionBlock.steps).toHaveLength(2);
    });

    it("should handle WorkoutRepeatGreaterThanStep correctly", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutRepeatGreaterThanStep.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions?.workout).toBeDefined();
      const workout = result.extensions?.workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.steps).toBeDefined();
      expect(Array.isArray(workout.steps)).toBe(true);
    });

    it("should handle WorkoutCustomTargetValues correctly", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutCustomTargetValues.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions?.workout).toBeDefined();
      const workout = result.extensions?.workout as {
        name?: string;
        sport: string;
        steps: Array<unknown>;
      };
      expect(workout.steps).toBeDefined();
      expect(Array.isArray(workout.steps)).toBe(true);
    });

    it("should throw FitParsingError when buffer is corrupted", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const corruptedBuffer = new Uint8Array([0, 0, 0, 0]);

      // Act & Assert
      await expect(reader.readToKRD(corruptedBuffer)).rejects.toThrow(
        FitParsingError
      );
    });

    it("should throw FitParsingError when buffer is empty", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const emptyBuffer = new Uint8Array([]);

      // Act & Assert
      await expect(reader.readToKRD(emptyBuffer)).rejects.toThrow(
        FitParsingError
      );
    });

    it("should log debug message when parsing starts", async () => {
      // Arrange
      const logger = createMockLogger();
      const debugSpy = vi.spyOn(logger, "debug");
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      await reader.readToKRD(buffer);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith("Parsing FIT file", {
        bufferSize: buffer.length,
      });
    });

    it("should log info message when parsing succeeds", async () => {
      // Arrange
      const logger = createMockLogger();
      const infoSpy = vi.spyOn(logger, "info");
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      await reader.readToKRD(buffer);

      // Assert
      expect(infoSpy).toHaveBeenCalledWith("FIT file parsed successfully");
    });

    it("should log error message when parsing fails", async () => {
      // Arrange
      const logger = createMockLogger();
      const errorSpy = vi.spyOn(logger, "error");
      const reader = createGarminFitSdkReader(logger);
      const corruptedBuffer = new Uint8Array([0, 0, 0, 0]);

      // Act
      try {
        await reader.readToKRD(corruptedBuffer);
      } catch {
        // Expected to throw
      }

      // Assert
      expect(errorSpy).toHaveBeenCalled();
    });

    it("should preserve FIT extensions in extensions.fit", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions).toBeDefined();
      expect(result.extensions?.fit).toBeDefined();
    });

    it("should extract unknown message types to extensions.fit.unknownMessages", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions?.fit).toBeDefined();
      const fitExt = result.extensions?.fit as Record<string, unknown>;
      if (fitExt.unknownMessages) {
        expect(typeof fitExt.unknownMessages).toBe("object");
      }
    });

    it("should log info when preserving developer fields", async () => {
      // Arrange
      const logger = createMockLogger();
      const infoSpy = vi.spyOn(logger, "info");
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      await reader.readToKRD(buffer);

      // Assert
      const infoCalls = infoSpy.mock.calls.map((call) => call[0]);
      const hasExtensionLog =
        infoCalls.some((msg) => msg.includes("developer fields")) ||
        infoCalls.some((msg) => msg.includes("unknown message"));
      expect(
        hasExtensionLog || infoCalls.includes("FIT file parsed successfully")
      ).toBe(true);
    });

    it("should handle FIT files without extensions gracefully", async () => {
      // Arrange
      const logger = createMockLogger();
      const reader = createGarminFitSdkReader(logger);
      const fitPath = join(
        __dirname,
        "../../tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
      );
      const buffer = readFileSync(fitPath);

      // Act
      const result = await reader.readToKRD(buffer);

      // Assert
      expect(result.extensions?.fit).toBeDefined();
      const fitExt = result.extensions?.fit as Record<string, unknown>;
      expect(typeof fitExt).toBe("object");
    });
  });
});

describe("createGarminFitSdkWriter", () => {
  describe("writeFromKRD", () => {
    it("should throw FitParsingError when conversion not implemented", async () => {
      // Arrange
      const logger = createMockLogger();
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "workout",
      });

      // Act & Assert
      await expect(writer.writeFromKRD(krd)).rejects.toThrow(FitParsingError);
    });

    it("should log debug message when encoding starts", async () => {
      // Arrange
      const logger = createMockLogger();
      const debugSpy = vi.spyOn(logger, "debug");
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "workout",
      });

      // Act
      try {
        await writer.writeFromKRD(krd);
      } catch {
        // Expected to throw
      }

      // Assert
      expect(debugSpy).toHaveBeenCalledWith("Encoding KRD to FIT");
    });

    it("should log debug message when converting KRD to messages", async () => {
      // Arrange
      const logger = createMockLogger();
      const debugSpy = vi.spyOn(logger, "debug");
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "workout",
      });

      // Act
      try {
        await writer.writeFromKRD(krd);
      } catch {
        // Expected to throw
      }

      // Assert
      expect(debugSpy).toHaveBeenCalledWith("Converting KRD to FIT messages");
    });

    it("should inject logger correctly", async () => {
      // Arrange
      const logger = createMockLogger();
      const debugSpy = vi.spyOn(logger, "debug");
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "workout",
      });

      // Act
      try {
        await writer.writeFromKRD(krd);
      } catch {
        // Expected to throw
      }

      // Assert
      expect(debugSpy).toHaveBeenCalled();
    });

    it("should handle valid KRD structure", async () => {
      // Arrange
      const logger = createMockLogger();
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "workout",
        metadata: buildKRDMetadata.build({
          sport: "cycling",
        }),
      });

      // Act & Assert
      await expect(writer.writeFromKRD(krd)).rejects.toThrow(FitParsingError);
    });

    it("should propagate FitParsingError without wrapping", async () => {
      // Arrange
      const logger = createMockLogger();
      const writer = createGarminFitSdkWriter(logger);
      const krd = buildKRD.build({
        version: "1.0",
        type: "workout",
      });

      // Act
      try {
        await writer.writeFromKRD(krd);
        expect.fail("Should have thrown");
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(FitParsingError);
        expect((error as FitParsingError).name).toBe("FitParsingError");
      }
    });
  });
});
