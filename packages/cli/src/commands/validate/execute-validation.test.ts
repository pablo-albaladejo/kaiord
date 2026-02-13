import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";

vi.mock("../../utils/file-handler.js", () => ({
  readFile: vi.fn(),
}));

vi.mock("../../utils/format-detector.js", () => ({
  detectFormat: vi.fn(),
}));

vi.mock("@kaiord/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kaiord/core")>();
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

import { executeValidation } from "./execute-validation";
import { readFile } from "../../utils/file-handler.js";
import { detectFormat } from "../../utils/format-detector.js";
import { readFile as fsReadFile } from "fs/promises";
import { validateRoundTrip, toleranceConfigSchema } from "@kaiord/core";

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
    const logger = createMockLogger();
    vi.mocked(detectFormat).mockReturnValue(null);

    await expect(
      executeValidation({ input: "unknown.xyz" }, logger)
    ).rejects.toThrow("Unable to detect format from file: unknown.xyz");
  });

  it("should throw when format is not FIT", async () => {
    const logger = createMockLogger();
    vi.mocked(detectFormat).mockReturnValue("tcx");

    await expect(
      executeValidation({ input: "workout.tcx" }, logger)
    ).rejects.toThrow("Validation currently only supports FIT files. Got: tcx");
  });

  it("should throw when FIT file returns string data", async () => {
    const logger = createMockLogger();
    vi.mocked(detectFormat).mockReturnValue("fit");
    vi.mocked(readFile).mockResolvedValue("string data");

    await expect(
      executeValidation({ input: "workout.fit" }, logger)
    ).rejects.toThrow("Expected binary data for FIT file");
  });

  it("should execute validation for valid FIT file", async () => {
    const logger = createMockLogger();
    const binaryData = new Uint8Array([0, 1, 2, 3]);

    vi.mocked(detectFormat).mockReturnValue("fit");
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

    const result = await executeValidation({ input: "workout.fit" }, logger);

    expect(result).toStrictEqual(mockValidateResult);
    expect(readFile).toHaveBeenCalledWith("workout.fit", "fit");
    expect(logger.info).toHaveBeenCalledWith("Starting round-trip validation", {
      file: "workout.fit",
    });
  });

  it("should load custom tolerance config when provided", async () => {
    const logger = createMockLogger();
    const binaryData = new Uint8Array([0, 1, 2, 3]);
    const toleranceConfig = {
      timeTolerance: 2,
      distanceTolerance: 1,
      powerTolerance: 1,
      ftpTolerance: 1,
      hrTolerance: 1,
      cadenceTolerance: 1,
      paceTolerance: 0.01,
    };

    vi.mocked(detectFormat).mockReturnValue("fit");
    vi.mocked(readFile).mockResolvedValue(binaryData);
    vi.mocked(fsReadFile).mockResolvedValue(JSON.stringify(toleranceConfig));

    const mockValidator = {
      validateFitToKrdToFit: vi.fn().mockResolvedValue({ isValid: true }),
    };
    vi.mocked(validateRoundTrip).mockReturnValue(mockValidator);

    await executeValidation(
      { input: "workout.fit", toleranceConfig: "/path/to/config.json" },
      logger
    );

    expect(fsReadFile).toHaveBeenCalledWith("/path/to/config.json", "utf-8");
    expect(logger.debug).toHaveBeenCalledWith(
      "Loading custom tolerance config",
      { path: "/path/to/config.json" }
    );
  });

  it("should log debug messages for format and path", async () => {
    const logger = createMockLogger();
    const binaryData = new Uint8Array([0, 1, 2, 3]);

    vi.mocked(detectFormat).mockReturnValue("fit");
    vi.mocked(readFile).mockResolvedValue(binaryData);

    const mockValidator = {
      validateFitToKrdToFit: vi.fn().mockResolvedValue({ isValid: true }),
    };
    vi.mocked(validateRoundTrip).mockReturnValue(mockValidator);

    await executeValidation({ input: "workout.fit" }, logger);

    expect(logger.debug).toHaveBeenCalledWith("Reading input file", {
      path: "workout.fit",
      format: "fit",
    });
  });
});
