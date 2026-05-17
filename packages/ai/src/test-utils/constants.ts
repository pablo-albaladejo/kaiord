// AI test-utils numeric constants. Pure module: zero imports. Test fixtures only.

// === Eval / benchmark durations (ms) ===
export const EVAL_DURATION_MS_PASS = 1500 as const;
export const EVAL_DURATION_MS_DEFAULT = 1000 as const;

// === Step / workout counts ===
export const EXPECTED_STEP_COUNT_THREE = 3 as const;

// === Reporter pass rate ===
export const PASS_RATE_FIFTY = 50 as const;

// === AiParsingError attempt counts ===
export const ATTEMPTS_THREE = 3 as const;

// === Validate-input length boundaries ===
export const INPUT_LEN_OVER_LIMIT = 2001 as const;
export const INPUT_LEN_AT_LIMIT = 2000 as const;
export const INPUT_TEXT_TRUNCATED_MAX_LEN = 203 as const;

// === text-to-workout config defaults ===
export const MAX_OUTPUT_TOKENS_DEFAULT = 4096 as const;

// === HTTP status fixtures for APICallError mocks ===
export const HTTP_STATUS_UNAUTHORIZED = 401 as const;
export const HTTP_STATUS_SERVICE_OVERLOADED = 503 as const;
