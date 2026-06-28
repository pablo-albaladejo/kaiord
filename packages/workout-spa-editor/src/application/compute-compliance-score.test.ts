import { describe, expect, it } from "vitest";

import {
  COMPLIANCE_HALF,
  COMPLIANCE_HIT_TARGET,
  COMPLIANCE_HIT_TARGET_PRECISION,
  COMPLIANCE_ZERO,
  HOUR_AND_HALF_AS_SEC,
  HOUR_AS_SEC,
  HUNDRED_MINUTES_AS_SEC,
  MINUTE_AS_SEC,
  MINUTES_43_AS_SEC,
  MINUTES_45_AS_SEC,
  MINUTES_47_AS_SEC,
  TEN_MINUTES_AS_SEC,
  THIRTY_MINUTES_AS_SEC,
} from "../test-utils/application-fixtures";
import { computeComplianceScore } from "./compute-compliance-score";

describe("computeComplianceScore", () => {
  it("should return approximately 0.956 for hit-target (45min plan, 43min actual)", () => {
    // Arrange

    // Act
    const score = computeComplianceScore(MINUTES_45_AS_SEC, MINUTES_43_AS_SEC);

    // Assert
    expect(score).not.toBeNull();
    expect(score!).toBeCloseTo(
      COMPLIANCE_HIT_TARGET,
      COMPLIANCE_HIT_TARGET_PRECISION
    );
  });

  it.each([
    { plan: HOUR_AS_SEC, actual: THIRTY_MINUTES_AS_SEC },
    { plan: HOUR_AS_SEC, actual: HOUR_AND_HALF_AS_SEC },
  ])(
    "should return 0.5 for substantial variance (plan $plan actual $actual)",
    ({ plan, actual }) => {
      // Arrange

      // Act
      const score = computeComplianceScore(plan, actual);

      // Assert
      expect(score).toBe(COMPLIANCE_HALF);
    }
  );

  it("should clamp to 0 for very large variance", () => {
    // Arrange

    // Act

    // Assert
    expect(computeComplianceScore(MINUTE_AS_SEC, TEN_MINUTES_AS_SEC)).toBe(
      COMPLIANCE_ZERO
    );
    expect(computeComplianceScore(MINUTE_AS_SEC, HUNDRED_MINUTES_AS_SEC)).toBe(
      COMPLIANCE_ZERO
    );
  });

  it.each([
    { plan: undefined, actual: MINUTES_43_AS_SEC },
    { plan: MINUTES_45_AS_SEC, actual: undefined },
    { plan: undefined, actual: undefined },
  ])(
    "should return null when a duration is undefined (plan $plan actual $actual)",
    ({ plan, actual }) => {
      // Arrange

      // Act
      const score = computeComplianceScore(plan, actual);

      // Assert
      expect(score).toBeNull();
    }
  );

  it("should return null when planDur is 0 (division-by-zero guard)", () => {
    // Arrange

    // Act

    // Assert
    expect(computeComplianceScore(0, THIRTY_MINUTES_AS_SEC)).toBeNull();
  });

  it("should return null on NaN inputs", () => {
    // Arrange

    // Act

    // Assert
    expect(computeComplianceScore(NaN, THIRTY_MINUTES_AS_SEC)).toBeNull();
    expect(computeComplianceScore(MINUTES_45_AS_SEC, NaN)).toBeNull();
  });

  it("should be symmetric — undershoot and overshoot yield identical scores", () => {
    // Arrange

    // Act

    // Assert
    expect(computeComplianceScore(MINUTES_45_AS_SEC, MINUTES_43_AS_SEC)).toBe(
      computeComplianceScore(MINUTES_45_AS_SEC, MINUTES_47_AS_SEC)
    );
  });
});
