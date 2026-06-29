import type * as KaiordCore from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const SAMPLE_FIT_BYTES = Uint8Array.from(Buffer.from("00010203", "hex"));

vi.mock("../../utils/file-handler.js", () => ({
  readFile: vi.fn(),
}));

vi.mock("@kaiord/core", async (importOriginal) => {
  const actual = await importOriginal<typeof KaiordCore>();
  return {
    ...actual,
    createToleranceChecker: vi.fn(() => ({})),
    validateRoundTrip: vi.fn(() => ({
      validateFitToKrdToFit: vi.fn().mockResolvedValue({
        isValid: true,
        totalFields: 10,
        matchedFields: 10,
        mismatchedFields: 0,
        mismatches: [],
      }),
    })),
  };
});

vi.mock("@kaiord/fit", () => ({
  createFitReader: vi.fn(() => ({})),
  createFitWriter: vi.fn(() => ({})),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

import { validateRoundTrip } from "@kaiord/core";
import { readFile as fsReadFile } from "fs/promises";

import { readFile } from "../../utils/file-handler.js";
import { executeValidation } from "./execute-validation";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("executeValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw when format cannot be detected", async () => {
    // Arrange
    const logger = createMockLogger();

    // Act

    // Assert
    await expect(
      executeValidation({ input: "unknown.xyz" }, logger)
    ).rejects.toThrow("Unable to detect format from file: unknown.xyz");
  });

  it("should throw when format is not FIT", async () => {
    // Arrange
    const logger = createMockLogger();

    // Act

    // Assert
    await expect(
      executeValidation({ input: "workout.tcx" }, logger)
    ).rejects.toThrow("Validation currently only supports FIT files. Got: tcx");
  });

  it("should throw when FIT file returns string data", async () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    vi.mocked(readFile).mockResolvedValue("string data");

    // Assert
    await expect(
      executeValidation({ input: "workout.fit" }, logger)
    ).rejects.toThrow("Expected binary data for FIT file");
  });

  it("should execute validation for valid FIT file", async () => {
    // Arrange
    const logger = createMockLogger();
    const binaryData = SAMPLE_FIT_BYTES;
    vi.mocked(readFile).mockResolvedValue(binaryData);
    const mockValidateResult = {
      isValid: true,
      totalFields: 10,
      matchedFields: 10,
      mismatchedFields: 0,
      mismatches: [],
    };
    const mockValidator = {
      validateFitToKrdToFit: vi.fn().mockResolvedValue(mockValidateResult),
    };
    vi.mocked(validateRoundTrip).mockReturnValue(mockValidator);

    // Act
    const result = await executeValidation({ input: "workout.fit" }, logger);

    // Assert
    expect(result).toStrictEqual(mockValidateResult);
    expect(readFile).toHaveBeenCalledWith("workout.fit", "fit");
    expect(logger.info).toHaveBeenCalledWith("Starting round-trip validation", {
      file: "workout.fit",
    });
  });

  it("should load custom tolerance config when provided", async () => {
    // Arrange
    const logger = createMockLogger();
    const binaryData = SAMPLE_FIT_BYTES;
    const toleranceConfig = {
      timeTolerance: 2,
      distanceTolerance: 1,
      powerTolerance: 1,
      ftpTolerance: 1,
      hrTolerance: 1,
      cadenceTolerance: 1,
      paceTolerance: 0.01,
    };
    vi.mocked(readFile).mockResolvedValue(binaryData);
    vi.mocked(fsReadFile).mockResolvedValue(JSON.stringify(toleranceConfig));
    const mockValidator = {
      validateFitToKrdToFit: vi.fn().mockResolvedValue({ isValid: true }),
    };
    vi.mocked(validateRoundTrip).mockReturnValue(mockValidator);

    // Act
    await executeValidation(
      { input: "workout.fit", toleranceConfig: "/path/to/config.json" },
      logger
    );

    // Assert
    expect(fsReadFile).toHaveBeenCalledWith("/path/to/config.json", "utf-8");
    expect(logger.debug).toHaveBeenCalledWith(
      "Loading custom tolerance config",
      { path: "/path/to/config.json" }
    );
  });

  it("should log debug messages for format and path", async () => {
    // Arrange
    const logger = createMockLogger();
    const binaryData = SAMPLE_FIT_BYTES;
    vi.mocked(readFile).mockResolvedValue(binaryData);
    const mockValidator = {
      validateFitToKrdToFit: vi.fn().mockResolvedValue({ isValid: true }),
    };
    vi.mocked(validateRoundTrip).mockReturnValue(mockValidator);

    // Act
    await executeValidation({ input: "workout.fit" }, logger);

    // Assert
    expect(logger.debug).toHaveBeenCalledWith("Reading input file", {
      path: "workout.fit",
      format: "fit",
    });
  });
});
