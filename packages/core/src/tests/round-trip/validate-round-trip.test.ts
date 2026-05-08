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
  DEVIATION_DISTANCE_5M,
  DEVIATION_DISTANCE_10M,
  DEVIATION_HR_5BPM,
  DEVIATION_HR_10BPM,
  DEVIATION_PACE,
  DEVIATION_POWER_5W,
  DEVIATION_POWER_10W,
  DEVIATION_TIME_2SEC,
  DEVIATION_TIME_5SEC,
  DISTANCE_ACTUAL_M,
  DISTANCE_EXPECTED_M,
  HR_ACTUAL,
  HR_ACTUAL_HIGH,
  HR_EXPECTED,
  LAP_DISTANCE_ACTUAL_M,
  LAP_DISTANCE_EXPECTED_M,
  LAP_TIME_ACTUAL_SEC,
  LAP_TIME_EXPECTED_SEC,
  POWER_ACTUAL,
  POWER_ACTUAL_HIGH,
  POWER_EXPECTED,
  RECORD_DISTANCE_ACTUAL_M,
  RECORD_DISTANCE_EXPECTED_M,
  RECORD_SPEED_ACTUAL_MPS,
  RECORD_SPEED_EXPECTED_MPS,
  TIME_ACTUAL_SEC,
  TIME_EXPECTED_SEC,
  TOLERANCE_CADENCE_RPM,
  TOLERANCE_DISTANCE_M,
  TOLERANCE_HR_BPM,
  TOLERANCE_PACE_SEC_PER_M,
  TOLERANCE_POWER_WATTS,
  TOLERANCE_TIME_SEC,
  VIOLATION_COUNT_FULL_SESSION,
  VIOLATION_COUNT_LAP,
  VIOLATION_COUNT_RECORD,
} from "../../test-utils/index.js";
import { buildKRD } from "../fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../helpers/test-utils.js";
import { validateRoundTrip } from "./validate-round-trip.js";

describe("validateRoundTrip", () => {
  describe("validateFitToKrdToFit", () => {
    it("should return empty violations when round-trip succeeds", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd = buildKRD.build();
      const mockFitReader = vi.fn().mockResolvedValue(krd);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue(null),
        checkDistance: vi.fn().mockReturnValue(null),
        checkPower: vi.fn().mockReturnValue(null),
        checkHeartRate: vi.fn().mockReturnValue(null),
        checkCadence: vi.fn().mockReturnValue(null),
        checkPace: vi.fn().mockReturnValue(null),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateFitToKrdToFit({ originalFit });

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockFitReader).toHaveBeenCalledTimes(2);
      expect(mockFitWriter).toHaveBeenCalledTimes(1);
    });

    it("should return violations when tolerance is exceeded", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd1 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: TIME_EXPECTED_SEC,
            totalDistance: DISTANCE_EXPECTED_M,
            sport: "running",
            avgPower: POWER_EXPECTED,
          },
        ],
      });
      const krd2 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: TIME_EXPECTED_SEC,
            totalDistance: DISTANCE_EXPECTED_M,
            sport: "running",
            avgPower: POWER_ACTUAL,
          },
        ],
      });
      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(krd1)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const powerViolation: ToleranceViolation = {
        field: "power",
        expected: POWER_EXPECTED,
        actual: POWER_ACTUAL,
        deviation: DEVIATION_POWER_5W,
        tolerance: TOLERANCE_POWER_WATTS,
      };
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue(null),
        checkDistance: vi.fn().mockReturnValue(null),
        checkPower: vi.fn().mockReturnValue(powerViolation),
        checkHeartRate: vi.fn().mockReturnValue(null),
        checkCadence: vi.fn().mockReturnValue(null),
        checkPace: vi.fn().mockReturnValue(null),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateFitToKrdToFit({ originalFit });

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].field).toBe("sessions[0].avgPower");
      expect(result[0].expected).toBe(POWER_EXPECTED);
      expect(result[0].actual).toBe(POWER_ACTUAL);
    });

    it("should propagate FitReader errors", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const readerError = new Error("Failed to read FIT file");
      const mockFitReader = vi.fn().mockRejectedValue(readerError);
      const mockFitWriter = vi.fn();
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn(),
        checkDistance: vi.fn(),
        checkPower: vi.fn(),
        checkHeartRate: vi.fn(),
        checkCadence: vi.fn(),
        checkPace: vi.fn(),
      };

      // Act
      const logger = createMockLogger();

      // Assert
      await expect(
        validateRoundTrip(
          mockFitReader,
          mockFitWriter,
          mockToleranceChecker,
          logger
        ).validateFitToKrdToFit({ originalFit })
      ).rejects.toThrow(readerError);
    });

    it("should propagate FitWriter errors", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd = buildKRD.build();
      const writerError = new Error("Failed to write FIT file");
      const mockFitReader = vi.fn().mockResolvedValue(krd);
      const mockFitWriter = vi.fn().mockRejectedValue(writerError);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn(),
        checkDistance: vi.fn(),
        checkPower: vi.fn(),
        checkHeartRate: vi.fn(),
        checkCadence: vi.fn(),
        checkPace: vi.fn(),
      };

      // Act
      const logger = createMockLogger();

      // Assert
      await expect(
        validateRoundTrip(
          mockFitReader,
          mockFitWriter,
          mockToleranceChecker,
          logger
        ).validateFitToKrdToFit({ originalFit })
      ).rejects.toThrow(writerError);
    });
  });

  describe("validateKrdToFitToKrd", () => {
    it("should return empty violations when round-trip succeeds", async () => {
      // Arrange
      const originalKrd = buildKRD.build();
      const fitBuffer = createFitBufferSample();
      const mockFitReader = vi.fn().mockResolvedValue(originalKrd);
      const mockFitWriter = vi.fn().mockResolvedValue(fitBuffer);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue(null),
        checkDistance: vi.fn().mockReturnValue(null),
        checkPower: vi.fn().mockReturnValue(null),
        checkHeartRate: vi.fn().mockReturnValue(null),
        checkCadence: vi.fn().mockReturnValue(null),
        checkPace: vi.fn().mockReturnValue(null),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateKrdToFitToKrd({ originalKrd });

      // Assert
      expect(result).toStrictEqual([]);
      expect(mockFitWriter).toHaveBeenCalledTimes(2);
      expect(mockFitReader).toHaveBeenCalledTimes(2);
    });

    it("should return violations when tolerance is exceeded", async () => {
      // Arrange
      const originalKrd = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: LAP_TIME_EXPECTED_SEC,
            totalDistance: LAP_DISTANCE_EXPECTED_M,
            avgHeartRate: HR_EXPECTED,
          },
        ],
        records: undefined,
      });
      const krd2 = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: LAP_TIME_EXPECTED_SEC,
            totalDistance: LAP_DISTANCE_EXPECTED_M,
            avgHeartRate: HR_ACTUAL,
          },
        ],
        records: undefined,
      });
      const fitBuffer = createFitBufferSample();
      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(originalKrd)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(fitBuffer);
      const hrViolation: ToleranceViolation = {
        field: "heartRate",
        expected: HR_EXPECTED,
        actual: HR_ACTUAL,
        deviation: DEVIATION_HR_5BPM,
        tolerance: TOLERANCE_HR_BPM,
      };
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue(null),
        checkDistance: vi.fn().mockReturnValue(null),
        checkPower: vi.fn().mockReturnValue(null),
        checkHeartRate: vi.fn().mockReturnValue(hrViolation),
        checkCadence: vi.fn().mockReturnValue(null),
        checkPace: vi.fn().mockReturnValue(null),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateKrdToFitToKrd({ originalKrd });

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].field).toBe("laps[0].avgHeartRate");
      expect(result[0].expected).toBe(HR_EXPECTED);
      expect(result[0].actual).toBe(HR_ACTUAL);
    });

    it("should propagate FitWriter errors", async () => {
      // Arrange
      const originalKrd = buildKRD.build();
      const writerError = new Error("Failed to write FIT file");
      const mockFitReader = vi.fn();
      const mockFitWriter = vi.fn().mockRejectedValue(writerError);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn(),
        checkDistance: vi.fn(),
        checkPower: vi.fn(),
        checkHeartRate: vi.fn(),
        checkCadence: vi.fn(),
        checkPace: vi.fn(),
      };

      // Act
      const logger = createMockLogger();

      // Assert
      await expect(
        validateRoundTrip(
          mockFitReader,
          mockFitWriter,
          mockToleranceChecker,
          logger
        ).validateKrdToFitToKrd({ originalKrd })
      ).rejects.toThrow(writerError);
    });

    it("should propagate FitReader errors", async () => {
      // Arrange
      const originalKrd = buildKRD.build();
      const fitBuffer = createFitBufferSample();
      const readerError = new Error("Failed to read FIT file");
      const mockFitReader = vi.fn().mockRejectedValue(readerError);
      const mockFitWriter = vi.fn().mockResolvedValue(fitBuffer);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn(),
        checkDistance: vi.fn(),
        checkPower: vi.fn(),
        checkHeartRate: vi.fn(),
        checkCadence: vi.fn(),
        checkPace: vi.fn(),
      };

      // Act
      const logger = createMockLogger();

      // Assert
      await expect(
        validateRoundTrip(
          mockFitReader,
          mockFitWriter,
          mockToleranceChecker,
          logger
        ).validateKrdToFitToKrd({ originalKrd })
      ).rejects.toThrow(readerError);
    });
  });

  describe("compareKRDs", () => {
    it("should detect violations in session metrics", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd1 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: TIME_EXPECTED_SEC,
            totalDistance: DISTANCE_EXPECTED_M,
            sport: "running",
            avgHeartRate: HR_EXPECTED,
            avgCadence: CADENCE_EXPECTED,
            avgPower: POWER_EXPECTED,
          },
        ],
        laps: undefined,
        records: undefined,
      });
      const krd2 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: TIME_ACTUAL_SEC,
            totalDistance: DISTANCE_ACTUAL_M,
            sport: "running",
            avgHeartRate: HR_ACTUAL,
            avgCadence: CADENCE_ACTUAL,
            avgPower: POWER_ACTUAL_HIGH,
          },
        ],
        laps: undefined,
        records: undefined,
      });
      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(krd1)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue({
          field: "time",
          expected: TIME_EXPECTED_SEC,
          actual: TIME_ACTUAL_SEC,
          deviation: DEVIATION_TIME_2SEC,
          tolerance: TOLERANCE_TIME_SEC,
        }),
        checkDistance: vi.fn().mockReturnValue({
          field: "distance",
          expected: DISTANCE_EXPECTED_M,
          actual: DISTANCE_ACTUAL_M,
          deviation: DEVIATION_DISTANCE_5M,
          tolerance: TOLERANCE_DISTANCE_M,
        }),
        checkPower: vi.fn().mockReturnValue({
          field: "power",
          expected: POWER_EXPECTED,
          actual: POWER_ACTUAL_HIGH,
          deviation: DEVIATION_POWER_10W,
          tolerance: TOLERANCE_POWER_WATTS,
        }),
        checkHeartRate: vi.fn().mockReturnValue({
          field: "heartRate",
          expected: HR_EXPECTED,
          actual: HR_ACTUAL,
          deviation: DEVIATION_HR_5BPM,
          tolerance: TOLERANCE_HR_BPM,
        }),
        checkCadence: vi.fn().mockReturnValue({
          field: "cadence",
          expected: CADENCE_EXPECTED,
          actual: CADENCE_ACTUAL,
          deviation: DEVIATION_CADENCE_5RPM,
          tolerance: TOLERANCE_CADENCE_RPM,
        }),
        checkPace: vi.fn().mockReturnValue(null),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateFitToKrdToFit({ originalFit });

      // Assert
      expect(result.length).toBe(VIOLATION_COUNT_FULL_SESSION);
      expect(
        result.some((v) => v.field === "sessions[0].totalElapsedTime")
      ).toBe(true);
      expect(result.some((v) => v.field === "sessions[0].totalDistance")).toBe(
        true
      );
      expect(result.some((v) => v.field === "sessions[0].avgHeartRate")).toBe(
        true
      );
      expect(result.some((v) => v.field === "sessions[0].avgCadence")).toBe(
        true
      );
      expect(result.some((v) => v.field === "sessions[0].avgPower")).toBe(true);
    });

    it("should detect violations in lap metrics", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd1 = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: LAP_TIME_EXPECTED_SEC,
            totalDistance: LAP_DISTANCE_EXPECTED_M,
            avgHeartRate: HR_EXPECTED,
          },
        ],
        records: undefined,
      });
      const krd2 = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: LAP_TIME_ACTUAL_SEC,
            totalDistance: LAP_DISTANCE_ACTUAL_M,
            avgHeartRate: HR_ACTUAL_HIGH,
          },
        ],
        records: undefined,
      });
      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(krd1)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue({
          field: "time",
          expected: LAP_TIME_EXPECTED_SEC,
          actual: LAP_TIME_ACTUAL_SEC,
          deviation: DEVIATION_TIME_5SEC,
          tolerance: TOLERANCE_TIME_SEC,
        }),
        checkDistance: vi.fn().mockReturnValue({
          field: "distance",
          expected: LAP_DISTANCE_EXPECTED_M,
          actual: LAP_DISTANCE_ACTUAL_M,
          deviation: DEVIATION_DISTANCE_10M,
          tolerance: TOLERANCE_DISTANCE_M,
        }),
        checkPower: vi.fn().mockReturnValue(null),
        checkHeartRate: vi.fn().mockReturnValue({
          field: "heartRate",
          expected: HR_EXPECTED,
          actual: HR_ACTUAL_HIGH,
          deviation: DEVIATION_HR_10BPM,
          tolerance: TOLERANCE_HR_BPM,
        }),
        checkCadence: vi.fn().mockReturnValue(null),
        checkPace: vi.fn().mockReturnValue(null),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateFitToKrdToFit({ originalFit });

      // Assert
      expect(result.length).toBe(VIOLATION_COUNT_LAP);
      expect(result.some((v) => v.field === "laps[0].totalElapsedTime")).toBe(
        true
      );
      expect(result.some((v) => v.field === "laps[0].totalDistance")).toBe(
        true
      );
      expect(result.some((v) => v.field === "laps[0].avgHeartRate")).toBe(true);
    });

    it("should detect violations in record metrics", async () => {
      // Arrange
      const originalFit = createFitBufferSample();
      const krd1 = buildKRD.build({
        sessions: undefined,
        laps: undefined,
        records: [
          {
            timestamp: "2025-01-15T10:30:00Z",
            heartRate: HR_EXPECTED,
            cadence: CADENCE_EXPECTED,
            power: POWER_EXPECTED,
            speed: RECORD_SPEED_EXPECTED_MPS,
            distance: RECORD_DISTANCE_EXPECTED_M,
          },
        ],
      });
      const krd2 = buildKRD.build({
        sessions: undefined,
        laps: undefined,
        records: [
          {
            timestamp: "2025-01-15T10:30:00Z",
            heartRate: HR_ACTUAL,
            cadence: CADENCE_ACTUAL,
            power: POWER_ACTUAL_HIGH,
            speed: RECORD_SPEED_ACTUAL_MPS,
            distance: RECORD_DISTANCE_ACTUAL_M,
          },
        ],
      });
      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(krd1)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(originalFit);
      const mockToleranceChecker: ToleranceChecker = {
        checkTime: vi.fn().mockReturnValue(null),
        checkDistance: vi.fn().mockReturnValue({
          field: "distance",
          expected: RECORD_DISTANCE_EXPECTED_M,
          actual: RECORD_DISTANCE_ACTUAL_M,
          deviation: DEVIATION_DISTANCE_5M,
          tolerance: TOLERANCE_DISTANCE_M,
        }),
        checkPower: vi.fn().mockReturnValue({
          field: "power",
          expected: POWER_EXPECTED,
          actual: POWER_ACTUAL_HIGH,
          deviation: DEVIATION_POWER_10W,
          tolerance: TOLERANCE_POWER_WATTS,
        }),
        checkHeartRate: vi.fn().mockReturnValue({
          field: "heartRate",
          expected: HR_EXPECTED,
          actual: HR_ACTUAL,
          deviation: DEVIATION_HR_5BPM,
          tolerance: TOLERANCE_HR_BPM,
        }),
        checkCadence: vi.fn().mockReturnValue({
          field: "cadence",
          expected: CADENCE_EXPECTED,
          actual: CADENCE_ACTUAL,
          deviation: DEVIATION_CADENCE_5RPM,
          tolerance: TOLERANCE_CADENCE_RPM,
        }),
        checkPace: vi.fn().mockReturnValue({
          field: "pace",
          expected: RECORD_SPEED_EXPECTED_MPS,
          actual: RECORD_SPEED_ACTUAL_MPS,
          deviation: DEVIATION_PACE,
          tolerance: TOLERANCE_PACE_SEC_PER_M,
        }),
      };
      const logger = createMockLogger();

      // Act
      const result = await validateRoundTrip(
        mockFitReader,
        mockFitWriter,
        mockToleranceChecker,
        logger
      ).validateFitToKrdToFit({ originalFit });

      // Assert
      expect(result.length).toBe(VIOLATION_COUNT_RECORD);
      expect(result.some((v) => v.field === "records[0].heartRate")).toBe(true);
      expect(result.some((v) => v.field === "records[0].cadence")).toBe(true);
      expect(result.some((v) => v.field === "records[0].power")).toBe(true);
      expect(result.some((v) => v.field === "records[0].speed")).toBe(true);
      expect(result.some((v) => v.field === "records[0].distance")).toBe(true);
    });
  });
});
