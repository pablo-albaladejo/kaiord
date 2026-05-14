<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# test/

Unit test suite for the train2go-bridge Chrome extension. All tests run in **vitest** with **jsdom** environment and a mock `chrome.*` API.

## Key Files

| File                       | Role                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `chrome-mock.js`           | Mock implementation of `chrome.tabs`, `chrome.runtime`, `chrome.storage` APIs      |
| `background.test.js`       | Tests for service-worker message routing, session validation, parser orchestration |
| `content.test.js`          | Tests for fetch allowlist enforcement and Train2Go API message handling            |
| `parser.test.js`           | Tests for HTML parsing: weekly, daily, tooltip, zones extraction                   |
| `popup.test.js`            | Tests for popup UI: session display, "Check Session" action                        |
| `kaiord-announce.test.js`  | Tests for SPA discovery and extension announcement resilience                      |
| `profile-snapshot.test.js` | Tests for profile state validation and persistence                                 |
| `fixtures/`                | Test data: HTML and JSON responses from Train2Go                                   |

## Test Structure

### AAA Pattern (Enforced)

Every `it()` must contain `// Arrange`, `// Act`, `// Assert` markers:

```javascript
it("should reject requests from untrusted origins", () => {
  // Arrange
  const request = { action: "readThisWeek", date: "2026-05-14" };
  const sender = { url: "https://evil.com" };

  // Act
  const result = isOriginAllowed(sender.url);

  // Assert
  expect(result).toBe(false);
});
```

### Title Convention (Enforced)

All test titles **must** start with `"should "`:

```javascript
it("should extract activities from weekly HTML", () => { ... });
it("should return empty array on malformed input", () => { ... });
it("should validate profile snapshot fields", () => { ... });
```

## Running Tests

```bash
# All tests
pnpm --filter @kaiord/train2go-bridge test

# Watch mode
pnpm --filter @kaiord/train2go-bridge test:watch

# Coverage report
pnpm --filter @kaiord/train2go-bridge test:coverage
```

## chrome-mock.js

Mock implementation of Chrome APIs needed by extension scripts:

- `chrome.tabs.query(filter, callback)` — Returns mock tabs matching URL pattern
- `chrome.tabs.sendMessage(tabId, message, callback)` — Mocked message passing
- `chrome.runtime.onMessage.addListener(handler)` — Registers message handler
- `chrome.runtime.sendMessage(message, callback)` — Mocked message sending
- `chrome.storage.sync.get/set/remove` — In-memory mock store

Usage in tests:

```javascript
import { setupChromeMock } from "./chrome-mock.js";

beforeEach(() => {
  setupChromeMock();
  // chrome.* is now available globally
});
```

## Fixture Files (under `fixtures/`)

- **weekly.html** — Train2Go weekly workplan page fragment (contains activity table)
- **daily.html** — Train2Go daily workplan fragment
- **details-active.html** — Server-rendered details page with training zones
- **ping-active.json** — Active session response from `/api/v2/profile/ping`
- **ping-expired.json** — Expired session response

Load fixtures in tests:

```javascript
const html = fs.readFileSync(
  import.meta.dirname + "/fixtures/weekly.html",
  "utf-8"
);
const activities = parseWeeklyHtml(html);
```

## Coverage Targets

- **Overall:** 70% (frontend extension)
- **Focus areas:**
  - Parser: 90%+ (critical for data integrity)
  - Background routing: 85%+ (message handling)
  - Content script allowlist: 100% (privacy critical)

## For AI Agents

### Adding a New Test

1. Create `*.test.js` in this directory
2. Import `setupChromeMock` or test utilities
3. Follow AAA pattern + "should " title prefix
4. Use fixtures from `fixtures/` via `fs.readFileSync` or hardcoded objects
5. Run `pnpm --filter @kaiord/train2go-bridge test:watch` to iterate
6. Verify coverage: `pnpm --filter @kaiord/train2go-bridge test:coverage`

### Debugging a Test

```javascript
// In the test, add console.log
it("should debug parser", () => {
  // Arrange
  const html = ...;

  // Act
  const result = parseWeeklyHtml(html);
  console.log("Parsed activities:", result); // Will appear in test output

  // Assert
  expect(result.length).toBeGreaterThan(0);
});

// Then run watch mode and check stderr/stdout
pnpm --filter @kaiord/train2go-bridge test:watch
```

### Mocking chrome.\* APIs

chrome-mock registers a global mock; no imports needed. If you need custom behavior:

```javascript
beforeEach(() => {
  setupChromeMock();
  // Customize behavior
  globalThis.chrome.tabs.query = vi.fn((_, cb) =>
    cb([{ id: 1, url: "https://app.train2go.com/user/index" }])
  );
});
```

<!-- MANUAL: Add notes on debugging flaky tests, fixture refresh procedures, and chrome-mock API coverage -->
