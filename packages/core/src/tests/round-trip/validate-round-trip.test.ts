import { describe, expect, it, vi } from "vitest";
import type {
  ToleranceChecker,
  ToleranceViolation,
} from "../../domain/validation/tolerance-checker";
import { buildKRD } from "../fixtures/krd/krd.fixtures.js";
import { createMockLogger } from "../helpers/test-utils.js";
import { validateRoundTrip } from "./validate-round-trip.js";

describe("validateRoundTrip", () => {
  describe("validateFitToKrdToFit", () => {
    it("should return empty violations when round-trip succeeds", async () => {
      // Arrange
      const originalFit = new Uint8Array([1, 2, 3, 4]);
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
      const originalFit = new Uint8Array([1, 2, 3, 4]);
      const krd1 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 3600,
            totalDistance: 10000,
            sport: "running",
            avgPower: 250,
          },
        ],
      });
      const krd2 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 3600,
            totalDistance: 10000,
            sport: "running",
            avgPower: 255,
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
        expected: 250,
        actual: 255,
        deviation: 5,
        tolerance: 1,
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
      expect(result[0].expected).toBe(250);
      expect(result[0].actual).toBe(255);
    });

    it("should propagate FitReader errors", async () => {
      // Arrange
      const originalFit = new Uint8Array([1, 2, 3, 4]);
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
      const logger = createMockLogger();

      // Act & Assert
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
      const originalFit = new Uint8Array([1, 2, 3, 4]);
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
      const logger = createMockLogger();

      // Act & Assert
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
      const fitBuffer = new Uint8Array([1, 2, 3, 4]);

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
            totalElapsedTime: 600,
            totalDistance: 1000,
            avgHeartRate: 150,
          },
        ],
        records: undefined,
      });
      const krd2 = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 600,
            totalDistance: 1000,
            avgHeartRate: 155,
          },
        ],
        records: undefined,
      });
      const fitBuffer = new Uint8Array([1, 2, 3, 4]);

      const mockFitReader = vi
        .fn()
        .mockResolvedValueOnce(originalKrd)
        .mockResolvedValueOnce(krd2);
      const mockFitWriter = vi.fn().mockResolvedValue(fitBuffer);

      const hrViolation: ToleranceViolation = {
        field: "heartRate",
        expected: 150,
        actual: 155,
        deviation: 5,
        tolerance: 1,
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
      expect(result[0].expected).toBe(150);
      expect(result[0].actual).toBe(155);
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
      const logger = createMockLogger();

      // Act & Assert
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
      const fitBuffer = new Uint8Array([1, 2, 3, 4]);
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
      const logger = createMockLogger();

      // Act & Assert
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
      const originalFit = new Uint8Array([1, 2, 3, 4]);
      const krd1 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 3600,
            totalDistance: 10000,
            sport: "running",
            avgHeartRate: 150,
            avgCadence: 85,
            avgPower: 250,
          },
        ],
        laps: undefined,
        records: undefined,
      });
      const krd2 = buildKRD.build({
        sessions: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 3602,
            totalDistance: 10005,
            sport: "running",
            avgHeartRate: 155,
            avgCadence: 90,
            avgPower: 260,
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
          expected: 3600,
          actual: 3602,
          deviation: 2,
          tolerance: 1,
        }),
        checkDistance: vi.fn().mockReturnValue({
          field: "distance",
          expected: 10000,
          actual: 10005,
          deviation: 5,
          tolerance: 1,
        }),
        checkPower: vi.fn().mockReturnValue({
          field: "power",
          expected: 250,
          actual: 260,
          deviation: 10,
          tolerance: 1,
        }),
        checkHeartRate: vi.fn().mockReturnValue({
          field: "heartRate",
          expected: 150,
          actual: 155,
          deviation: 5,
          tolerance: 1,
        }),
        checkCadence: vi.fn().mockReturnValue({
          field: "cadence",
          expected: 85,
          actual: 90,
          deviation: 5,
          tolerance: 1,
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
      expect(result.length).toBe(5);
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
      const originalFit = new Uint8Array([1, 2, 3, 4]);
      const krd1 = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 600,
            totalDistance: 1000,
            avgHeartRate: 150,
          },
        ],
        records: undefined,
      });
      const krd2 = buildKRD.build({
        sessions: undefined,
        laps: [
          {
            startTime: "2025-01-15T10:30:00Z",
            totalElapsedTime: 605,
            totalDistance: 1010,
            avgHeartRate: 160,
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
          expected: 600,
          actual: 605,
          deviation: 5,
          tolerance: 1,
        }),
        checkDistance: vi.fn().mockReturnValue({
          field: "distance",
          expected: 1000,
          actual: 1010,
          deviation: 10,
          tolerance: 1,
        }),
        checkPower: vi.fn().mockReturnValue(null),
        checkHeartRate: vi.fn().mockReturnValue({
          field: "heartRate",
          expected: 150,
          actual: 160,
          deviation: 10,
          tolerance: 1,
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
      expect(result.length).toBe(3);
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
      const originalFit = new Uint8Array([1, 2, 3, 4]);
      const krd1 = buildKRD.build({
        sessions: undefined,
        laps: undefined,
        records: [
          {
            timestamp: "2025-01-15T10:30:00Z",
            heartRate: 150,
            cadence: 85,
            power: 250,
            speed: 2.78,
            distance: 100,
          },
        ],
      });
      const krd2 = buildKRD.build({
        sessions: undefined,
        laps: undefined,
        records: [
          {
            timestamp: "2025-01-15T10:30:00Z",
            heartRate: 155,
            cadence: 90,
            power: 260,
            speed: 2.85,
            distance: 105,
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
          expected: 100,
          actual: 105,
          deviation: 5,
          tolerance: 1,
        }),
        checkPower: vi.fn().mockReturnValue({
          field: "power",
          expected: 250,
          actual: 260,
          deviation: 10,
          tolerance: 1,
        }),
        checkHeartRate: vi.fn().mockReturnValue({
          field: "heartRate",
          expected: 150,
          actual: 155,
          deviation: 5,
          tolerance: 1,
        }),
        checkCadence: vi.fn().mockReturnValue({
          field: "cadence",
          expected: 85,
          actual: 90,
          deviation: 5,
          tolerance: 1,
        }),
        checkPace: vi.fn().mockReturnValue({
          field: "pace",
          expected: 2.78,
          actual: 2.85,
          deviation: 0.07,
          tolerance: 0.01,
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
      expect(result.length).toBe(5);
      expect(result.some((v) => v.field === "records[0].heartRate")).toBe(true);
      expect(result.some((v) => v.field === "records[0].cadence")).toBe(true);
      expect(result.some((v) => v.field === "records[0].power")).toBe(true);
      expect(result.some((v) => v.field === "records[0].speed")).toBe(true);
      expect(result.some((v) => v.field === "records[0].distance")).toBe(true);
    });
  });
});
