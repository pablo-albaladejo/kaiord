/**
 * Test fixtures for copy-paste-integration.test.ts
 *
 * Domain-named numeric constants used to replace magic numbers
 * in the copy/paste integration tests.
 */

// Step indices (0-based positions in a workout)
export const STEP_INDEX_FIRST = 0;
export const STEP_INDEX_SECOND = 1;
export const STEP_INDEX_THIRD = 2;
export const STEP_INDEX_FOURTH = 3;

// Workout step counts (post-paste totals)
export const STEPS_AFTER_SINGLE_PASTE = 3;
export const STEPS_AFTER_TWO_ITEMS = 2;
export const STEPS_AFTER_TRIPLE_PASTE = 4;

// Durations (seconds)
export const WARMUP_SECONDS = 300;
export const INTERVAL_SECONDS = 360;
export const COOLDOWN_SECONDS = 420;
export const RECOVERY_LONG_SECONDS = 120;
export const RECOVERY_SHORT_SECONDS = 60;

// Power targets (watts)
export const WATTS_TEMPO = 200;
export const WATTS_TEMPO_PLUS = 210;
export const WATTS_THRESHOLD = 220;
export const WATTS_VO2_MAX = 250;
export const WATTS_RECOVERY = 150;

// Repetition / clipboard call counts
export const REPEAT_COUNT_DEFAULT = 3;
export const CLIPBOARD_WRITE_TRIPLE = 3;
export const CLIPBOARD_READ_TRIPLE = 3;
