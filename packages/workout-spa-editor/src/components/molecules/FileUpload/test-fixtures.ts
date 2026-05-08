/**
 * Test fixtures for FileUpload.test.tsx.
 *
 * Co-located fixture module — pure constants only.
 */

// Async cleanup wait window (ms) used in afterEach.
export const CLEANUP_WAIT_MS = 50;

// Reject threshold sanity inputs for the 10 MB limit guard.
export const FILE_SIZE_REJECT = {
  megabytes: 11,
  kilobytesPerMegabyte: 1024,
  bytesPerKilobyte: 1024,
} as const;

// Tiny placeholder byte sequence used as binary file content.
export const PLACEHOLDER_BYTES = [1, 2, 3] as const;

// importWorkout progress milestones used in mock implementations.
export const PROGRESS_MILESTONES = {
  early: 10,
  rampUp: 20,
  midway: 30,
  takeoff: 60,
} as const;

// Wait windows (ms) used in mocked importWorkout implementations.
export const MOCK_WAIT_MS = {
  short: 50,
  medium: 100,
  long: 200,
} as const;
