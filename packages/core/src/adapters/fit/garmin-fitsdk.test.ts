import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { FitParsingError } from "../../domain/types/errors";
import { createMockLogger } from "../../tests/helpers/test-utils";
import { createGarminFitSdkReader } from "./garmin-fitsdk";

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
  });
});
