/**
 * Test fixtures for clear-expired-deletes-action.test.ts
 *
 * Domain-named numeric constants used to replace magic numbers
 * in the clear-expired-deletes action tests.
 */

// Time-window offsets in milliseconds (subtracted from `Date.now()`)
export const EXPIRED_OFFSET_MS = 6000; // 6s ago — past the 5s expiry
export const EXPIRED_LONGER_OFFSET_MS = 7000; // 7s ago — past the 5s expiry
export const RECENT_OFFSET_MS = 2000; // 2s ago — still within window
export const RECENT_OLDER_OFFSET_MS = 3000; // 3s ago — still within window

// Step indices (0-based)
export const STEP_INDEX_FIRST = 0;
export const STEP_INDEX_SECOND = 1;

// Durations (seconds)
export const WARMUP_SECONDS = 300;
export const INTERVAL_SECONDS = 360;

// Power targets (watts)
export const WATTS_TEMPO = 200;
export const WATTS_VO2_MAX = 250;

// Expected result sizes
export const REMAINING_RECENT_ONLY = 1;
export const REMAINING_BOTH = 2;
export const REMAINING_NONE = 0;

// Sentinel history index when no undo step exists
export const HISTORY_INDEX_EMPTY = -1;
