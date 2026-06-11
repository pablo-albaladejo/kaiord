import { describe, expect, it } from "vitest";

import type { KRD } from "../../domain/schemas/krd";
import type { ToleranceViolation } from "../../domain/validation/tolerance-checker";
import { createToleranceChecker } from "../../domain/validation/tolerance-checker";
import {
  DEVIATION_HR_10BPM,
  HR_ACTUAL_HIGH,
  HR_EXPECTED,
  TOLERANCE_HR_BPM,
} from "../../test-utils/index.js";
import { checkField } from "./check-field";
import { compareLaps } from "./compare-laps";

const LAP_ELAPSED_FIRST_SEC = 100;
const LAP_ELAPSED_SECOND_SEC = 200;
const MAX_HR_EXPECTED_BPM = 180;
const MAX_HR_DRIFTED_BPM = 190;
const MAX_HR_WITHIN_TOLERANCE_BPM = 181;
const FIRST_LAP_START = "2025-01-15T10:30:00Z";
const SECOND_LAP_START = "2025-01-15T10:32:00Z";

const buildKRDWithLaps = (laps: KRD["laps"]): KRD => ({
  version: "1.0",
  type: "recorded_activity",
  metadata: { created: FIRST_LAP_START, sport: "running" },
  laps,
});

describe("checkField", () => {
  it("should record no violation when the expected value is absent", () => {
    // Arrange
    const checker = createToleranceChecker();
    const violations: Array<ToleranceViolation> = [];

    // Act
    checkField(
      violations,
      checker.checkHeartRate,
      undefined,
      HR_EXPECTED,
      "lap.hr"
    );

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should record no violation when the actual value is absent", () => {
    // Arrange
    const checker = createToleranceChecker();
    const violations: Array<ToleranceViolation> = [];

    // Act
    checkField(
      violations,
      checker.checkHeartRate,
      HR_EXPECTED,
      undefined,
      "lap.hr"
    );

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should record no violation when both values are absent", () => {
    // Arrange
    const checker = createToleranceChecker();
    const violations: Array<ToleranceViolation> = [];

    // Act
    checkField(
      violations,
      checker.checkHeartRate,
      undefined,
      undefined,
      "lap.hr"
    );

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should record no violation when both values are within tolerance", () => {
    // Arrange
    const checker = createToleranceChecker();
    const violations: Array<ToleranceViolation> = [];

    // Act
    checkField(
      violations,
      checker.checkHeartRate,
      HR_EXPECTED,
      HR_EXPECTED,
      "lap.hr"
    );

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should record a violation under the field name when drift exceeds tolerance", () => {
    // Arrange
    const checker = createToleranceChecker();
    const violations: Array<ToleranceViolation> = [];

    // Act
    checkField(
      violations,
      checker.checkHeartRate,
      HR_EXPECTED,
      HR_ACTUAL_HIGH,
      "lap.hr"
    );

    // Assert
    expect(violations).toStrictEqual([
      {
        field: "lap.hr",
        expected: HR_EXPECTED,
        actual: HR_ACTUAL_HIGH,
        deviation: DEVIATION_HR_10BPM,
        tolerance: TOLERANCE_HR_BPM,
      },
    ]);
  });
});

describe("compareLaps", () => {
  it("should compare only the common prefix when lap arrays differ in length", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1 = buildKRDWithLaps([
      { startTime: FIRST_LAP_START, totalElapsedTime: LAP_ELAPSED_FIRST_SEC },
      { startTime: SECOND_LAP_START, totalElapsedTime: LAP_ELAPSED_SECOND_SEC },
    ]);
    const krd2 = buildKRDWithLaps([
      { startTime: FIRST_LAP_START, totalElapsedTime: LAP_ELAPSED_FIRST_SEC },
    ]);

    // Act
    const violations = compareLaps(krd1, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should report no violations when one side has no laps at all", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1 = buildKRDWithLaps([
      { startTime: FIRST_LAP_START, totalElapsedTime: LAP_ELAPSED_FIRST_SEC },
    ]);
    const krd2 = buildKRDWithLaps(undefined);

    // Act
    const violations = compareLaps(krd1, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should flag a max heart rate drift beyond tolerance on the matching lap", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1 = buildKRDWithLaps([
      {
        startTime: FIRST_LAP_START,
        totalElapsedTime: LAP_ELAPSED_FIRST_SEC,
        maxHeartRate: MAX_HR_EXPECTED_BPM,
      },
    ]);
    const krd2 = buildKRDWithLaps([
      {
        startTime: FIRST_LAP_START,
        totalElapsedTime: LAP_ELAPSED_FIRST_SEC,
        maxHeartRate: MAX_HR_DRIFTED_BPM,
      },
    ]);

    // Act
    const violations = compareLaps(krd1, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([
      {
        field: "laps[0].maxHeartRate",
        expected: MAX_HR_EXPECTED_BPM,
        actual: MAX_HR_DRIFTED_BPM,
        deviation: DEVIATION_HR_10BPM,
        tolerance: TOLERANCE_HR_BPM,
      },
    ]);
  });

  it("should not flag a max heart rate difference within tolerance", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1 = buildKRDWithLaps([
      {
        startTime: FIRST_LAP_START,
        totalElapsedTime: LAP_ELAPSED_FIRST_SEC,
        maxHeartRate: MAX_HR_EXPECTED_BPM,
      },
    ]);
    const krd2 = buildKRDWithLaps([
      {
        startTime: FIRST_LAP_START,
        totalElapsedTime: LAP_ELAPSED_FIRST_SEC,
        maxHeartRate: MAX_HR_WITHIN_TOLERANCE_BPM,
      },
    ]);

    // Act
    const violations = compareLaps(krd1, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([]);
  });
});
