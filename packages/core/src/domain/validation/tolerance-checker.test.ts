import { describe, expect, it } from "vitest";
import {
  createToleranceChecker,
  DEFAULT_TOLERANCES,
  toleranceConfigSchema,
  type ToleranceConfig,
} from "./tolerance-checker";

describe("createToleranceChecker", () => {
  describe("checkTime", () => {
    it("should return null when time difference is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 300;
      const actual = 300;

      // Act
      const result = checker.checkTime(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when time difference equals tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 300;
      const actual = 301;

      // Act
      const result = checker.checkTime(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when time difference exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 300;
      const actual = 302;

      // Act
      const result = checker.checkTime(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "time",
        expected: 300,
        actual: 302,
        deviation: 2,
        tolerance: 1,
      });
    });

    it("should handle negative deviations", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 300;
      const actual = 298;

      // Act
      const result = checker.checkTime(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "time",
        expected: 300,
        actual: 298,
        deviation: 2,
        tolerance: 1,
      });
    });
  });

  describe("checkDistance", () => {
    it("should return null when distance difference is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 1000;
      const actual = 1000;

      // Act
      const result = checker.checkDistance(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when distance difference exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 1000;
      const actual = 1002;

      // Act
      const result = checker.checkDistance(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "distance",
        expected: 1000,
        actual: 1002,
        deviation: 2,
        tolerance: 1,
      });
    });
  });

  describe("checkPower", () => {
    it("should return null when power difference is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 250;
      const actual = 250;

      // Act
      const result = checker.checkPower(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when power difference exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 250;
      const actual = 252;

      // Act
      const result = checker.checkPower(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "power",
        expected: 250,
        actual: 252,
        deviation: 2,
        tolerance: 1,
      });
    });
  });

  describe("checkHeartRate", () => {
    it("should return null when heart rate difference is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 145;
      const actual = 146;

      // Act
      const result = checker.checkHeartRate(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when heart rate difference exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 145;
      const actual = 147;

      // Act
      const result = checker.checkHeartRate(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "heartRate",
        expected: 145,
        actual: 147,
        deviation: 2,
        tolerance: 1,
      });
    });
  });

  describe("checkCadence", () => {
    it("should return null when cadence difference is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 85;
      const actual = 85;

      // Act
      const result = checker.checkCadence(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when cadence difference exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 85;
      const actual = 87;

      // Act
      const result = checker.checkCadence(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "cadence",
        expected: 85,
        actual: 87,
        deviation: 2,
        tolerance: 1,
      });
    });
  });

  describe("checkPace", () => {
    it("should return null when pace difference is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 3.5;
      const actual = 3.5;

      // Act
      const result = checker.checkPace(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when pace difference equals tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 3.5;
      const actual = 3.51;

      // Act
      const result = checker.checkPace(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when pace difference exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 3.5;
      const actual = 3.52;

      // Act
      const result = checker.checkPace(expected, actual);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.field).toBe("pace");
      expect(result?.expected).toBe(3.5);
      expect(result?.actual).toBe(3.52);
      expect(result?.deviation).toBeCloseTo(0.02, 10);
      expect(result?.tolerance).toBe(0.01);
    });
  });

  describe("custom tolerance configuration", () => {
    it("should use custom tolerances when provided", () => {
      // Arrange
      const customConfig: ToleranceConfig = {
        timeTolerance: 5,
        distanceTolerance: 10,
        powerTolerance: 3,
        ftpTolerance: 2,
        hrTolerance: 2,
        cadenceTolerance: 3,
        paceTolerance: 0.05,
      };
      const checker = createToleranceChecker(customConfig);
      const expected = 300;
      const actual = 304;

      // Act
      const result = checker.checkTime(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return violation when exceeding custom tolerance", () => {
      // Arrange
      const customConfig: ToleranceConfig = {
        timeTolerance: 5,
        distanceTolerance: 10,
        powerTolerance: 3,
        ftpTolerance: 2,
        hrTolerance: 2,
        cadenceTolerance: 3,
        paceTolerance: 0.05,
      };
      const checker = createToleranceChecker(customConfig);
      const expected = 300;
      const actual = 306;

      // Act
      const result = checker.checkTime(expected, actual);

      // Assert
      expect(result).toStrictEqual({
        field: "time",
        expected: 300,
        actual: 306,
        deviation: 6,
        tolerance: 5,
      });
    });
  });

  describe("edge cases", () => {
    it("should handle zero values", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 0;
      const actual = 0;

      // Act
      const result = checker.checkPower(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle very small differences for pace", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 3.5;
      const actual = 3.505;

      // Act
      const result = checker.checkPace(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should handle large values", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 100000;
      const actual = 100001;

      // Act
      const result = checker.checkDistance(expected, actual);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("DEFAULT_TOLERANCES", () => {
    it("should have correct default values", () => {
      // Assert
      expect(DEFAULT_TOLERANCES).toStrictEqual({
        timeTolerance: 1,
        distanceTolerance: 1,
        powerTolerance: 1,
        ftpTolerance: 1,
        hrTolerance: 1,
        cadenceTolerance: 1,
        paceTolerance: 0.01,
      });
    });
  });

  describe("toleranceConfigSchema", () => {
    it("should validate valid tolerance config", () => {
      // Arrange
      const validConfig = {
        timeTolerance: 1,
        distanceTolerance: 1,
        powerTolerance: 1,
        ftpTolerance: 1,
        hrTolerance: 1,
        cadenceTolerance: 1,
        paceTolerance: 0.01,
      };

      // Act
      const result = toleranceConfigSchema.safeParse(validConfig);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should reject negative tolerance values", () => {
      // Arrange
      const invalidConfig = {
        timeTolerance: -1,
        distanceTolerance: 1,
        powerTolerance: 1,
        ftpTolerance: 1,
        hrTolerance: 1,
        cadenceTolerance: 1,
        paceTolerance: 0.01,
      };

      // Act
      const result = toleranceConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      // Arrange
      const invalidConfig = {
        timeTolerance: 1,
        distanceTolerance: 1,
      };

      // Act
      const result = toleranceConfigSchema.safeParse(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
