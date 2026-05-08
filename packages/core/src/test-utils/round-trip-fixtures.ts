/**
 * Round-trip test fixtures.
 *
 * Shared sample buffers and named domain constants used by
 * round-trip validation tests. Centralising these values keeps
 * `expect(...)` assertions self-documenting and removes inline
 * magic numbers from the test suite.
 *
 * Tolerance numeric values themselves live in `./tolerance-constants`.
 */

/**
 * Returns a fresh `Uint8Array([1, 2, 3, 4])` per call.
 *
 * Returning a new buffer per invocation prevents cross-test mutation
 * if a future test ever writes to the underlying bytes.
 */
export const createFitBufferSample = (): Uint8Array =>
  new Uint8Array([1, 2, 3, 4]);

// Power assertion fixtures (watts)
export const POWER_EXPECTED = 250 as const;
export const POWER_ACTUAL = 255 as const;
export const POWER_ACTUAL_HIGH = 260 as const;

// Heart rate assertion fixtures (bpm)
export const HR_EXPECTED = 150 as const;
export const HR_ACTUAL = 155 as const;
export const HR_ACTUAL_HIGH = 160 as const;

// Cadence assertion fixtures (rpm)
export const CADENCE_EXPECTED = 85 as const;
export const CADENCE_ACTUAL = 90 as const;

// Session-level time / distance fixtures
export const TIME_EXPECTED_SEC = 3600 as const;
export const TIME_ACTUAL_SEC = 3602 as const;
export const DISTANCE_EXPECTED_M = 10000 as const;
export const DISTANCE_ACTUAL_M = 10005 as const;

// Lap-level time / distance fixtures
export const LAP_TIME_EXPECTED_SEC = 600 as const;
export const LAP_TIME_ACTUAL_SEC = 605 as const;
export const LAP_DISTANCE_EXPECTED_M = 1000 as const;
export const LAP_DISTANCE_ACTUAL_M = 1010 as const;

// Record-level fixtures
export const RECORD_DISTANCE_EXPECTED_M = 100 as const;
export const RECORD_DISTANCE_ACTUAL_M = 105 as const;
export const RECORD_SPEED_EXPECTED_MPS = 2.78 as const;
export const RECORD_SPEED_ACTUAL_MPS = 2.85 as const;

// Violation count assertions
export const VIOLATION_COUNT_FULL_SESSION = 5 as const;
export const VIOLATION_COUNT_LAP = 3 as const;
export const VIOLATION_COUNT_RECORD = 5 as const;

// Deviation values fed to ToleranceChecker mocks
export const DEVIATION_POWER_5W = 5 as const;
export const DEVIATION_POWER_10W = 10 as const;
export const DEVIATION_HR_5BPM = 5 as const;
export const DEVIATION_HR_10BPM = 10 as const;
export const DEVIATION_CADENCE_5RPM = 5 as const;
export const DEVIATION_DISTANCE_5M = 5 as const;
export const DEVIATION_DISTANCE_10M = 10 as const;
export const DEVIATION_TIME_2SEC = 2 as const;
export const DEVIATION_TIME_5SEC = 5 as const;
export const DEVIATION_PACE = 0.07 as const;
