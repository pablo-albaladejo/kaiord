// Garmin-connect test-utils numeric constants.
// Pure module: zero imports. Test fixtures only.

// === Time conversions ===
export const MILLISECONDS_PER_SECOND = 1000 as const;

// === OAuth2 token TTLs (seconds) ===
export const OAUTH2_EXPIRES_IN_1H_SEC = 3600 as const;
export const OAUTH2_EXPIRES_IN_2H_SEC = 7200 as const;

// === Integration-test timeouts (milliseconds) ===
export const INTEGRATION_TIMEOUT_MS = 30_000 as const;

// === Retry / backoff (milliseconds) ===
export const RETRY_ADVANCE_TIMERS_MS = 5000 as const;
export const RETRY_RANDOM_FN_VALUE_0_5 = 0.5 as const;

// === HTTP status codes ===
export const HTTP_STATUS_FORBIDDEN = 403 as const;
