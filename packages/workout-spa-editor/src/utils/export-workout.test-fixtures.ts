/**
 * Test fixtures for export-workout.test.ts.
 *
 * Co-located fixture module — pure constants only.
 */

// exportWorkout progress milestones reported by the use case.
export const EXPORT_PROGRESS_STEPS = {
  early: 10,
  midway: 50,
} as const;

// Tiny placeholder byte sequence used as exported buffer content.
export const PLACEHOLDER_BYTES = [1, 2, 3] as const;
