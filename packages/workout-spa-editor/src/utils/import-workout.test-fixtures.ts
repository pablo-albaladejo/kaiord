/**
 * Test fixtures for import-workout.test.ts.
 *
 * Co-located fixture module — pure constants only. Lives outside the
 * `*.test.ts` glob so it is not subject to the test-file
 * `no-magic-numbers` warning, while still being tree-shaken from
 * production builds (it is only imported from the sibling test file).
 */

// JSON parse-error message length sanity floor.
export const ERROR_MESSAGE_MIN_LENGTH = 20;

// KRD progress milestones reported by importWorkout.
export const KRD_PROGRESS_STEPS = [10, 30, 40, 70, 100] as const;

// FIT/TCX/ZWO failed-import progress milestones (terminate at 50).
export const NON_KRD_FAILED_PROGRESS_STEPS = [10, 30, 50] as const;

// Three-byte placeholder buffer used for unsupported-extension cases.
export const PLACEHOLDER_BYTES_3 = [1, 2, 3] as const;

// Four-byte all-zero buffer used for invalid-FIT placeholder.
export const INVALID_FIT_BYTES_4 = [0, 0, 0, 0] as const;
