<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/garmin-bridge AGENTS.md

Chrome extension (Manifest V3) that bridges the Kaiord workout editor SPA to Garmin Connect via the user's authenticated browser session. The extension captures CSRF tokens from Garmin, relays API requests from the SPA to Garmin through a content script, and survives service worker cold starts via persistent storage.

## Purpose

**What lives here:** Service worker (background script), content scripts for Garmin Connect and SPA origins, extension popup UI, profile snapshot validator, and unit tests against a Chrome API mock.

**Core responsibility:** Intercept and store Garmin CSRF tokens. Enforce a path allowlist for content-script fetch requests. Relay messages between the SPA and Garmin Connect's private API. Persist CSRF state so the bridge survives service worker restarts.

**Dependency direction:** Depends on `@kaiord/core` (test setup only, via devDependencies). No runtime dependencies on external libraries (plain JavaScript for security and bundle size). Built files loaded directly into Chrome via manifest entry points.

## Key Files

- `manifest.json` — Development manifest (Manifest V3, service worker, content scripts, host permissions for `connect.garmin.com`)
- `manifest.prod.json` — Production manifest for Chrome Web Store release (swaps service worker context, updates host permissions)
- `background.js` — Service worker. CSRF token capture via `webRequest.onBeforeSendHeaders`. Message routing for `ping`, `list`, `push` actions. Tab-finding and content script messaging.
- `content.js` — Content script injected on `connect.garmin.com`. Validates fetch requests against an allowlist. Executes requests with session cookies intact.
- `kaiord-announce.js` — Content script injected on SPA origins (`https://*.kaiord.com/*`, `http://localhost/*`). Announces extension ID and capabilities to the page via window message.
- `profile-snapshot.js` — Hand-rolled validator for profile snapshot objects (plain JS, no dependencies, parity-tested against `@kaiord/core` Zod schema).
- `popup.html` / `popup.js` / `popup.css` — Extension toolbar popup. Status indicator, athlete card, workout sync count, deep-link footer.
- `package.json` — npm metadata; scripts: test, test:watch, test:coverage
- `vitest.config.js` — Test setup (globals, chrome-mock.js setupFile, coverage config)
- `TESTING.md` — Manual integration test checklist (CSRF capture, list workouts, SPA messaging, service worker restart, path allowlist)
- `README.md` — User-facing documentation

## Subdirectories

- **`test/`** — Unit test suite (vitest)
  - `chrome-mock.js` — Minimal Chrome Extension API mock (runtime, tabs, storage, webRequest, scripting)
  - `background.test.js` — Service worker tests (CSRF capture, message routing, session validation)
  - `content.test.js` — Content script tests (fetch allowlist, CSRF token injection)
  - `kaiord-announce.test.js` — Announce script tests (runtime detection, context invalidation, re-injection)
  - `popup.test.js` — Popup UI tests (status rendering, snapshot staleness, fetch timeouts)
  - `profile-snapshot.test.js` — Profile validator tests (shape validation, pollution detection, length cap)
- **`icons/`** — Extension icons (16px, 48px, 128px PNG files referenced in manifest)
- **`assets/`** — Chrome Web Store marketing assets (promo images, screenshots for listing)

## For AI Agents: Working in This Directory

### Key Concepts

1. **Manifest V3**: Service worker (not background page). `host_permissions` for `connect.garmin.com`. `externally_connectable` matches SPA origins and localhost dev server.
2. **Content script messaging**: Background sends messages to content script on Garmin tab via `chrome.tabs.sendMessage()`. Content script responds via `sendResponse()` callback (async).
3. **CSRF token lifecycle**: Captured at `webRequest.onBeforeSendHeaders` on Garmin API requests. Stored in `chrome.storage.session` (survives tab reload, cleared on browser restart). Re-validated via `ping` action.
4. **Path allowlist**: Content script rejects any fetch request not matching the allowlist in `content.js` (GET `/workout-service/workouts*`, POST `/workout-service/workout`).
5. **Profile snapshot**: Hand-rolled validator ensures no prototype pollution (`__proto__`, `constructor`, `prototype` keys rejected). JSON.stringify length cap (8192 UTF-16 code units). Output uses `Object.create(null)`.
6. **Service worker cold start**: Extension reloads the service worker after 5 minutes of inactivity. CSRF token is preserved in `chrome.storage.session`, but the validator is re-imported via `importScripts()` on every background.js load.

### File Size Limits & Structure

- Target: Files under 100 lines (tests exempt)
- Service worker: ~300 LOC; modular by concern (CSRF capture, fetch relay, action dispatch)
- Content scripts: ~70–80 LOC each; single responsibility
- Utilities: Pure functions (profile validator, allowlist check, message builders)

### Testing Requirements

- **Unit tests**: All public functions and message handlers (vitest + chrome-mock)
- **Coverage**: `background.js`, `content.js`, `kaiord-announce.js` (exclude `popup.js` due to DOM dependency)
- **Test conventions**: Every `it()` title starts with `"should "`, bodies contain `// Arrange`, `// Act`, `// Assert`
- **Fixtures**: Shared profile snapshot fixtures between `profile-snapshot.test.js` and `@kaiord/core/test-utils`
- **Chrome mock**: Stateful mock in `test/chrome-mock.js` with `__resetChromeMock()` helper for between-test isolation
- **Integration smoke checks**: `TESTING.md` covers manual e2e tests (CSRF capture, list/push, context invalidation)

### Common Patterns

**Action handler in background.js:**

```javascript
const myAction = async () => {
  // 1. Load state from storage
  const csrfToken = await getCsrfToken();

  // 2. Execute side effect (e.g., fetch via content script)
  const result = await garminFetch(path, method, body);

  // 3. Validate and return
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.data;
};

// Register handler
const handleAction = async (action, sendResult) => {
  try {
    const data = await myAction();
    sendResult({ ok: true, protocolVersion: 1, data });
  } catch (error) {
    sendResult({ ok: false, error: error.message });
  }
};
```

**Content script fetch allowlist:**

```javascript
const ALLOWED = [
  { method: "GET", pattern: /^\/workout-service\/workouts(\?.*)?$/ },
  { method: "POST", pattern: /^\/workout-service\/workout$/ },
];

const isAllowed = (method, path) =>
  ALLOWED.some((rule) => rule.method === method && rule.pattern.test(path));
```

**Profile snapshot validation:**

```javascript
const validateProfile = (profile, errors) => {
  if (!profile || typeof profile !== "object") {
    errors.push("profile must be an object");
    return null;
  }
  // Check each field for type/bounds
  if (
    typeof profile.name !== "string" ||
    profile.name.length < 1 ||
    profile.name.length > 100
  ) {
    errors.push("profile.name must be a string 1–100 chars");
    return null;
  }
  const out = Object.create(null); // No prototype
  out.name = profile.name;
  // ... copy validated fields
  return out;
};
```

## Dependencies

### Internal (`@kaiord/*` workspace)

- `@kaiord/core` — (devDependencies only) Test utilities and fixture loaders for profile snapshot parity testing

### External

- **vitest** — Test runner (devDependencies)
- **jsdom** — DOM mock for popup tests (devDependencies)
- Chrome Extension API — Built-in (no npm dependency; mock in tests)

## Build & Release

This is not a library. The extension is packaged as a ZIP file for the Chrome Web Store:

1. **Development**: Load unpacked from this directory via `chrome://extensions/` with `manifest.json`
2. **Production**: Swap `manifest.json` for `manifest.prod.json`, then ZIP this directory for Web Store submission

See the root `release.yml` GitHub Actions workflow for automated packaging.

## MANUAL

Non-generated files beyond the AI agent's responsibility:

- `README.md` — User documentation (purpose, testing instructions, license)
- `.gitignore` — Excludes coverage, node_modules
- `tsconfig.json`, `tsconfig.tsbuildinfo` — TypeScript config (if any `.ts` files added in future)
- `package.json` — npm metadata and version pinning
- `CHANGELOG.md` — Version history
- `TESTING.md` — Manual integration test checklist (not automated)
- `store-listing.md` — Chrome Web Store listing copy (category, description, features)
- `privacy-justification.md` — Privacy rationale for host permissions (required by Chrome Web Store)

### Vendored bridge-core files

`bridge-envelope.js`, `kaiord-announce.js`, `bridge-popup-utils.js`,
`bridge-popup-snapshot.js`, `popup.css`, `profile-snapshot.js`, and
`test/{chrome-mock,bridge-envelope.test}.js` are byte-identical vendored
copies of `packages/_shared/bridge-core/` masters — never edit them here;
edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). Per-bridge identity lives in
`bridge-identity.js` and must match `BRIDGE_MANIFEST` in `background.js`.
