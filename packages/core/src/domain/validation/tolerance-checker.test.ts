import { describe, expect, it } from "vitest";

import {
  PACE_ACTUAL_3_52,
  PACE_DEVIATION_0_02,
  PACE_DEVIATION_PRECISION,
  PACE_EXPECTED_3_5,
  PACE_TOLERANCE_DEFAULT,
} from "../../test-utils/tolerance-constants";
import {
  createToleranceChecker,
  DEFAULT_TOLERANCES,
  type ToleranceChecker,
  type ToleranceConfig,
  toleranceConfigSchema,
} from "./tolerance-checker";

type IntegerMetricCase = readonly [keyof ToleranceChecker, string];

// Each metric checker shares the same `Math.abs(diff) > tol` core with a
// default integer tolerance of 1, differing only in the field label.
const integerMetricCases: ReadonlyArray<IntegerMetricCase> = [
  ["checkTime", "time"],
  ["checkDistance", "distance"],
  ["checkPower", "power"],
  ["checkHeartRate", "heartRate"],
  ["checkCadence", "cadence"],
];

describe("createToleranceChecker", () => {
  describe("integer-tolerance metric checkers", () => {
    it.each(integerMetricCases)(
      "should return null from %s when the deviation is within the default tolerance",
      (method, field) => {
        // Arrange
        const checker = createToleranceChecker();
        const expected = 300;
        const actual = 301;

        // Act
        const result = checker[method](expected, actual);

        // Assert
        expect(result).toBeNull();
        expect(field).toBeTruthy();
      }
    );

    it.each(integerMetricCases)(
      "should return a labelled violation from %s when the deviation exceeds the default tolerance",
      (method, field) => {
        // Arrange
        const checker = createToleranceChecker();
        const expected = 300;
        const actual = 302;

        // Act
        const result = checker[method](expected, actual);

        // Assert
        expect(result).toStrictEqual({
          field,
          expected: 300,
          actual: 302,
          deviation: 2,
          tolerance: 1,
        });
      }
    );

    it("should report the absolute deviation when the actual value is below expected", () => {
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

  describe("checkPace", () => {
    it("should return null when the fractional pace deviation is within tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 3.5;
      const actual = 3.51;

      // Act
      const result = checker.checkPace(expected, actual);

      // Assert
      expect(result).toBeNull();
    });

    it("should return a violation when the fractional pace deviation exceeds tolerance", () => {
      // Arrange
      const checker = createToleranceChecker();
      const expected = 3.5;
      const actual = 3.52;

      // Act
      const result = checker.checkPace(expected, actual);

      // Assert
      expect(result?.field).toBe("pace");
      expect(result?.expected).toBe(PACE_EXPECTED_3_5);
      expect(result?.actual).toBe(PACE_ACTUAL_3_52);
      expect(result?.deviation).toBeCloseTo(
        PACE_DEVIATION_0_02,
        PACE_DEVIATION_PRECISION
      );
      expect(result?.tolerance).toBe(PACE_TOLERANCE_DEFAULT);
    });
  });

  describe("custom tolerance configuration", () => {
    const customConfig: ToleranceConfig = {
      timeTolerance: 5,
      distanceTolerance: 10,
      powerTolerance: 3,
      ftpTolerance: 2,
      hrTolerance: 2,
      cadenceTolerance: 3,
      paceTolerance: 0.05,
    };

    it("should accept a deviation tolerated only by the custom config", () => {
      // Arrange
      const checker = createToleranceChecker(customConfig);
      const expected = 300;
      const actualWithinCustom = 304;

      // Act
      const result = checker.checkTime(expected, actualWithinCustom);

      // Assert
      expect(result).toBeNull();
    });

    it("should report the custom tolerance in the violation when exceeded", () => {
      // Arrange
      const checker = createToleranceChecker(customConfig);
      const expected = 300;
      const actualBeyondCustom = 306;

      // Act
      const result = checker.checkTime(expected, actualBeyondCustom);

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

  describe("DEFAULT_TOLERANCES", () => {
    it("should expose the documented default tolerance values", () => {
      // Arrange

      // Act

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
    it("should reject a config with a negative tolerance value", () => {
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
  });
});
