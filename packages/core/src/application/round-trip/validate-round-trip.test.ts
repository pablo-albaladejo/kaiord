import { describe, expect, it, vi } from "vitest";

import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import {
  CADENCE_ACTUAL,
  CADENCE_EXPECTED,
  createFitBufferSample,
  DEVIATION_CADENCE_5RPM,
  DEVIATION_HR_5BPM,
  DEVIATION_POWER_5W,
  HR_ACTUAL,
  HR_EXPECTED,
  POWER_ACTUAL,
  POWER_EXPECTED,
  TOLERANCE_CADENCE_RPM,
  TOLERANCE_HR_BPM,
  TOLERANCE_POWER_WATTS,
} from "../../test-utils/index.js";
import { buildKRD } from "../../tests/fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../../tests/helpers/test-utils.js";
import { validateRoundTrip } from "./validate-round-trip.js";

const passthroughChecker = (): ToleranceChecker => ({
  checkTime: vi.fn().mockReturnValue(null),
  checkDistance: vi.fn().mockReturnValue(null),
  checkPower: vi.fn().mockReturnValue(null),
  checkHeartRate: vi.fn().mockReturnValue(null),
  checkCadence: vi.fn().mockReturnValue(null),
  checkPace: vi.fn().mockReturnValue(null),
});

const powerViolation: ToleranceViolation = {
  field: "power",
  expected: POWER_EXPECTED,
  actual: POWER_ACTUAL,
  deviation: DEVIATION_POWER_5W,
  tolerance: TOLERANCE_POWER_WATTS,
};
const hrViolation: ToleranceViolation = {
  field: "heartRate",
  expected: HR_EXPECTED,
  actual: HR_ACTUAL,
  deviation: DEVIATION_HR_5BPM,
  tolerance: TOLERANCE_HR_BPM,
};
const cadenceViolation: ToleranceViolation = {
  field: "cadence",
  expected: CADENCE_EXPECTED,
  actual: CADENCE_ACTUAL,
  deviation: DEVIATION_CADENCE_5RPM,
  tolerance: TOLERANCE_CADENCE_RPM,
};

describe("validateRoundTrip", () => {
  describe("round-trip validation of a FIT source restored to FIT", () => {
    it("should report no violations when the round-trip stays within tolerance", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd = buildKRD.build();
      const mockFitReader = vi.fn().mockResolvedValue(krd);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        passthroughChecker(),
        logger
      ).validateBinaryRoundTrip({ originalBinary: originalFit });

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockFitReader).toHaveBeenCalledTimes(2);
      expect(mockFitWriter).toHaveBeenCalledTimes(1);
    });

    it("should surface metric drift across sessions, laps, and records with entity-prefixed field names", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd1 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 600,
            sport: "running",
            avgPower: POWER_EXPECTED,
          },
        ],
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 600,
            avgHeartRate: HR_EXPECTED,
          },
        ],
        records: [
          { timestamp: "2025-01-15T10:30:00Z", cadence: CADENCE_EXPECTED },
        ],
      });
      const krd2 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 600,
            sport: "running",
            avgPower: POWER_ACTUAL,
          },
        ],
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 600,
            avgHeartRate: HR_ACTUAL,
          },
        ],
        records: [
          { timestamp: "2025-01-15T10:30:00Z", cadence: CADENCE_ACTUAL },
        ],
      });
      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(krd1)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const checker: ToleranceChecker = {
        ...passthroughChecker(),
        checkPower: vi.fn().mockReturnValue(powerViolation),
        checkHeartRate: vi.fn().mockReturnValue(hrViolation),
        checkCadence: vi.fn().mockReturnValue(cadenceViolation),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        checker,
        logger
      ).validateBinaryRoundTrip({ originalBinary: originalFit });

      // Assert
      const fields = result.map((v) => v.field);
      expect(fields).toStrictEqual([
        "sessions[0].avgPower",
        "laps[0].avgHeartRate",
        "records[0].cadence",
      ]);
    });

    it.each([
      ["reader", true],
      ["writer", false],
    ] as const)(
      "should propagate a FIT %s failure to the caller",
      async (_stage, failOnReader) => {
        // Arrange
        const originalFit = createFitBufferSample();
        const krd = buildKRD.build();
        const error = new Error("FIT pipeline failure");
        const mockFitReader = failOnReader
          ? vi.fn().mockRejectedValue(error)
          : vi.fn().mockResolvedValue(krd);
        const mockFitWriter = failOnReader
          ? vi.fn()
          : vi.fn().mockRejectedValue(error);
        const logger = createMockLogger();

        // Act
        const run = validateRoundTrip(
          mockFitReader,
          mockFitWriter,
          passthroughChecker(),
          logger
        ).validateBinaryRoundTrip({ originalBinary: originalFit });

        // Assert
        await expect(run).rejects.toThrow(error);
      }
    );
  });

  describe("round-trip validation of a KRD source restored to KRD", () => {
    it("should report no violations when the round-trip stays within tolerance", async () => {
      // Arrange
      const originalKrd = buildKRD.build();
      const fitBuffer = createFitBufferSample();
      const mockFitReader = vi.fn().mockResolvedValue(originalKrd);
      const mockFitWriter = vi.fn().mockResolvedValue(fitBuffer);
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        passthroughChecker(),
        logger
      ).validateKrdRoundTrip({ originalKrd });

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockFitWriter).toHaveBeenCalledTimes(2);
      expect(mockFitReader).toHaveBeenCalledTimes(2);
    });

    it.each([
      ["reader", true],
      ["writer", false],
    ] as const)(
      "should propagate a FIT %s failure to the caller",
      async (_stage, failOnReader) => {
        // Arrange
        const originalKrd = buildKRD.build();
        const fitBuffer = createFitBufferSample();
        const error = new Error("FIT pipeline failure");
        const mockFitReader = failOnReader
          ? vi.fn().mockRejectedValue(error)
          : vi.fn();
        const mockFitWriter = failOnReader
          ? vi.fn().mockResolvedValue(fitBuffer)
          : vi.fn().mockRejectedValue(error);
        const logger = createMockLogger();

        // Act
        const run = validateRoundTrip(
          mockFitReader,
          mockFitWriter,
          passthroughChecker(),
          logger
        ).validateKrdRoundTrip({ originalKrd });

        // Assert
        await expect(run).rejects.toThrow(error);
      }
    );
  });

  describe("deprecated aliases", () => {
    it("should keep validateFitToKrdToFit working as an alias for validateBinaryRoundTrip", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd = buildKRD.build();
      const mockFitReader = vi.fn().mockResolvedValue(krd);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        passthroughChecker(),
        logger
      ).validateFitToKrdToFit({ originalFit });

      // Assert
      expect(result).toStrictEqual([]);
    });

    it("should keep validateKrdToFitToKrd working as an alias for validateKrdRoundTrip", async () => {
      // Arrange
      const originalKrd = buildKRD.build();
      const fitBuffer = createFitBufferSample();
      const mockFitReader = vi.fn().mockResolvedValue(originalKrd);
      const mockFitWriter = vi.fn().mockResolvedValue(fitBuffer);
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        passthroughChecker(),
        logger
      ).validateKrdToFitToKrd({ originalKrd });

      // Assert
      expect(result).toStrictEqual([]);
    });
  });
});
