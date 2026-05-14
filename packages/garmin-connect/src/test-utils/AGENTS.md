<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/test-utils

Test helpers: numeric constants (TTLs, timeouts, status codes) for unit and integration tests. Pure module; zero imports.

**Files:**

- `constants.ts` — Time conversions, OAuth2 token TTLs (1h, 2h), integration timeouts, retry backoff, HTTP status codes

**Key constants:**

- `OAUTH2_EXPIRES_IN_1H_SEC` — 3600 seconds
- `OAUTH2_EXPIRES_IN_2H_SEC` — 7200 seconds
- `INTEGRATION_TIMEOUT_MS` — 30000 ms (30 seconds)
- `RETRY_ADVANCE_TIMERS_MS` — 5000 ms (for vitest fake timers)
- `HTTP_STATUS_FORBIDDEN` — 403 (for token refresh error scenarios)

**Usage:**

- Import constants in test files for mock token creation, timeout expectations
- Use in integration tests to simulate token expiration and refresh cycles

<!-- MANUAL: -->
