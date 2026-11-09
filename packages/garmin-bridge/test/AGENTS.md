<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/garmin-bridge/test AGENTS.md

Unit test suite for the Kaiord Garmin Bridge extension. Tests cover service worker message handling, fetch allowlisting, OAuth, announce script context detection, popup UI state rendering, and profile snapshot validation against a Chrome Extension API mock.

## Purpose

**What lives here:** Vitest test files, Chrome API mock implementation, shared test utilities.

**Core responsibility:** Provide comprehensive test coverage for all extension scripts (background, garmin-oauth, kaiord-announce, popup, profile-snapshot) without requiring a real browser or Chrome runtime. Mock the Chrome Extension API consistently across all test suites.

## Key Files

- `chrome-mock.js` — Minimal Chrome Extension API mock (runtime, tabs, storage, webRequest, scripting). Stateful session/local storage. Factory for resetting state between tests.
- `background.test.js` — Service worker tests (~1600 LOC). Covers the protocol version and manifest, the path allowlist (`isAllowed`), `garminFetch`, the internal and external message listeners with origin pinning, `checkSession` (ping), `handleAction` routing, body-composition push, activity listing with backoff, calendar placement/find actions and their deadlines, and `set-theme`.
- `garmin-oauth.test.js` — OAuth1 signing, ticket/session minting, auth endpoints, exchange, and token store/expiry.
- `popup.test.js` — Popup UI tests. Covers status rendering (connected/disconnected), profile snapshot display, staleness detection, fetch timeouts, retry UX.
- `profile-snapshot.test.js` — Snapshot validator parity with `@kaiord/core` fixtures, plus the external-message origin gate and `handleAction` routing for the snapshot actions.

### Vendored suites (do not edit here)

`bearer-fetch.test.js`, `bridge-envelope.test.js`, `bridge-popup-health.test.js`, `bridge-popup-shell.test.js`, `bridge-popup-utils.test.js`, `bridge-theme.test.js` and `kaiord-announce.test.js` are byte-copies of the masters in `packages/_shared/bridge-core/test/`. Edit the master and run `pnpm bridge:sync`; see `packages/_shared/bridge-core/AGENTS.md`.

## For AI Agents: Working in This Directory

### Key Concepts

1. **Chrome mock stateful stores**: `sessionStore` and `localStore` objects hold state for `chrome.storage.session` and `chrome.storage.local`. Reset between tests via `__resetChromeMock()`.
2. **Listener callback capture**: Callbacks registered at script import time (e.g., `chrome.runtime.onMessage.addListener()`) are captured in the test file before any reset, then invoked directly in test bodies.
3. **Promise-based mock API**: Chrome Extension API is callback-based; mock wraps callbacks in Promises for readability (e.g., `chrome.tabs.query()` returns a resolved Promise with tabs array).
4. **Profile snapshot parity**: Fixtures in `profile-snapshot.test.js` must match the Zod schema in `@kaiord/core/types/profile-snapshot.ts`. Parity is enforced by `check-bridge-snapshot-fixtures.mjs` (pre-commit hook).
5. **Timeout testing**: Popup tests use `Promise.race()` to simulate fetch timeouts (3s per phase, 1s for snapshot). Content script uses `AbortController` for 30s fetch timeout.

### Testing Strategy

- **Unit tests only**: No e2e/integration tests here. E2e smoke checks are manual (see `TESTING.md`).
- **No real browser**: All tests run in jsdom/vitest with the Chrome mock.
- **Test conventions**: Every `it()` title starts with `"should "`, bodies contain `// Arrange`, `// Act`, `// Assert`.
- **Isolation**: Call `__resetChromeMock()` in `beforeEach()` to reset stores and clear all mock call counts.

### Common Patterns

**Testing a message handler:**

```javascript
const onMessageCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

it("should respond to ping action", () => {
  // Arrange
  const sendResponse = vi.fn();

  // Act
  onMessageCb({ action: "ping" }, {}, sendResponse);

  // Assert
  expect(sendResponse).toHaveBeenCalledWith(
    expect.objectContaining({ ok: true, protocolVersion: 1 })
  );
});
```

**Testing storage side effects:**

```javascript
it("should cache CSRF token in session storage", async () => {
  // Arrange
  await chrome.storage.session.set({ csrfToken: "token123" });

  // Act
  const result = await chrome.storage.session.get("csrfToken");

  // Assert
  expect(result.csrfToken).toBe("token123");
});
```

**Testing fetch allowlist:**

```javascript
it("should reject disallowed paths", async () => {
  // Arrange
  const msg = {
    action: "garmin-fetch",
    path: "/admin/users", // Not in allowlist
    method: "GET",
  };

  // Act
  const result = await handleGarminFetch(msg);

  // Assert
  expect(result.ok).toBe(false);
  expect(result.error).toMatch(/disallowed/i);
});
```

## Coverage

- **Target**: 80% line coverage for `background.js`, `garmin-oauth.js`, `kaiord-announce.js`
- **Exclude**: `popup.js` (DOM-heavy, tested manually), `profile-snapshot.js` (90%+ coverage via focused validator tests)
- Run: `pnpm test:coverage`

## Dependencies

### Internal

- `../chrome-mock.js` — Shared mock
- `../*.js` — Source files under test (required at test load time)

### External

- **vitest** — Test runner
- **jsdom** — DOM environment for popup tests

## MANUAL

Non-generated files beyond the AI agent's responsibility:

- `chrome-mock.js` — Implementation detail; update when Chrome Extension API changes
- `*test.js` files — Test implementations; update when source code changes
