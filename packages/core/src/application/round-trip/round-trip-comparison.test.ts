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
import { compareRecords } from "./compare-records";
import { compareSessions } from "./compare-sessions";

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
  it.each<[number | undefined, number | undefined]>([
    [undefined, HR_EXPECTED],
    [HR_EXPECTED, undefined],
    [undefined, undefined],
  ])(
    "should record no violation when a value is absent (%p, %p)",
    (expected, actual) => {
      // Arrange
      const checker = createToleranceChecker();
      const violations: Array<ToleranceViolation> = [];

      // Act
      checkField(
        violations,
        checker.checkHeartRate,
        expected,
        actual,
        "lap.hr"
      );

      // Assert
      expect(violations).toStrictEqual([]);
    }
  );

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

describe("compareSessions", () => {
  it("should surface a session power drift beyond tolerance", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1: KRD = {
      version: "1.0",
      type: "recorded_activity",
      metadata: { created: FIRST_LAP_START, sport: "cycling" },
      sessions: [{ totalElapsedTime: 3600, avgPower: 250 }],
    };
    const krd2: KRD = {
      ...krd1,
      sessions: [{ totalElapsedTime: 3600, avgPower: 260 }],
    };

    // Act
    const violations = compareSessions(krd1, krd2, checker);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe("sessions[0].avgPower");
  });

  it("should report nothing when one side has no sessions", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1: KRD = {
      version: "1.0",
      type: "recorded_activity",
      metadata: { created: FIRST_LAP_START, sport: "cycling" },
      sessions: [{ totalElapsedTime: 3600 }],
    };
    const krd2: KRD = { ...krd1, sessions: undefined };

    // Act
    const violations = compareSessions(krd1, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([]);
  });
});

describe("compareRecords", () => {
  it("should surface a record heart-rate drift beyond tolerance", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1: KRD = {
      version: "1.0",
      type: "recorded_activity",
      metadata: { created: FIRST_LAP_START, sport: "running" },
      records: [{ timestamp: FIRST_LAP_START, heartRate: HR_EXPECTED }],
    };
    const krd2: KRD = {
      ...krd1,
      records: [{ timestamp: FIRST_LAP_START, heartRate: HR_ACTUAL_HIGH }],
    };

    // Act
    const violations = compareRecords(krd1, krd2, checker);

    // Assert
    expect(violations).toHaveLength(1);
    expect(violations[0].field).toBe("records[0].heartRate");
  });

  it("should report nothing when one side has no records", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd1: KRD = {
      version: "1.0",
      type: "recorded_activity",
      metadata: { created: FIRST_LAP_START, sport: "running" },
      records: [{ timestamp: FIRST_LAP_START, heartRate: HR_EXPECTED }],
    };
    const krd2: KRD = { ...krd1, records: undefined };

    // Act
    const violations = compareRecords(krd1, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([]);
  });
});

describe("entity comparison with absent or sparse collections", () => {
  const baseKrd: KRD = {
    version: "1.0",
    type: "recorded_activity",
    metadata: { created: FIRST_LAP_START, sport: "running" },
  };

  it("should report nothing when the first KRD has no laps", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd2: KRD = {
      ...baseKrd,
      laps: [{ startTime: FIRST_LAP_START, totalElapsedTime: 100 }],
    };

    // Act
    const violations = compareLaps(baseKrd, krd2, checker);

    // Assert
    expect(violations).toStrictEqual([]);
  });

  it("should report nothing when the first KRD has no sessions or records", () => {
    // Arrange
    const checker = createToleranceChecker();
    const krd2: KRD = {
      ...baseKrd,
      sessions: [{ totalElapsedTime: 3600 }],
      records: [{ timestamp: FIRST_LAP_START, heartRate: HR_EXPECTED }],
    };

    // Act
    const sessionViolations = compareSessions(baseKrd, krd2, checker);
    const recordViolations = compareRecords(baseKrd, krd2, checker);

    // Assert
    expect(sessionViolations).toStrictEqual([]);
    expect(recordViolations).toStrictEqual([]);
  });

  it("should skip sparse entries instead of comparing them", () => {
    // Arrange
    const checker = createToleranceChecker();
    const sparse = [undefined] as unknown;
    const krd1: KRD = {
      ...baseKrd,
      laps: sparse as KRD["laps"],
      sessions: sparse as KRD["sessions"],
      records: sparse as KRD["records"],
    };

    // Act
    const lapViolations = compareLaps(krd1, krd1, checker);
    const sessionViolations = compareSessions(krd1, krd1, checker);
    const recordViolations = compareRecords(krd1, krd1, checker);

    // Assert
    expect(lapViolations).toStrictEqual([]);
    expect(sessionViolations).toStrictEqual([]);
    expect(recordViolations).toStrictEqual([]);
  });
});
