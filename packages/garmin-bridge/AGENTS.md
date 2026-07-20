<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-07-15 -->

# @kaiord/garmin-bridge AGENTS.md

Chrome extension (Manifest V3) that bridges the Kaiord workout editor SPA to Garmin Connect. The service worker mints an OAuth token from the user's existing Garmin browser session (no password) and calls `connectapi.garmin.com` directly with `Authorization: Bearer`. No Garmin tab, content script, or CSRF capture is involved.

## Purpose

**What lives here:** Service worker (background script), the OAuth token-minting module, a content script for the SPA origin (identity announce only), extension popup UI, profile snapshot validator, and unit tests against a Chrome API mock.

**Core responsibility:** Mint + refresh a Garmin OAuth token from the user's session, persist it across service worker restarts, enforce a path allowlist, and relay `list`/`push`/`activities`/`profile-snapshot` messages between the SPA and Garmin.

**Dependency direction:** Depends on `@kaiord/core` (test setup only, via devDependencies). No runtime dependencies on external libraries (plain JavaScript + Web Crypto for security and bundle size). Built files loaded directly into Chrome via manifest entry points.

## Key Files

- `manifest.json` — Development manifest (MV3, service worker, `storage` permission, host permissions for `connect.garmin.com`, `connectapi.garmin.com`, `sso.garmin.com`).
- `manifest.prod.json` — Production manifest for Chrome Web Store release (same surface, no localhost origins).
- `background.js` — Service worker. `garminFetch` (Bearer call to connectapi + path allowlist), action routing for `ping`/`list`/`push`/`activities`/`open-garmin`/`profile-snapshot(-clear)`, swallowed-error telemetry.
- `garmin-oauth.js` — OAuth token minting (bridge-specific, NOT vendored). OAuth1 HMAC-SHA1 signer, session→ticket→OAuth1→OAuth2 mint, refresh-and-persist, `connectapiFetch`.
- `kaiord-announce.js` — Content script injected on SPA origins (`https://*.kaiord.com/*`, `http://localhost/*`). Announces extension ID and capabilities to the page via window message.
- `profile-snapshot.js` — Hand-rolled validator for profile snapshot objects (plain JS, parity-tested against `@kaiord/core` Zod schema).
- `popup.html` / `popup.js` / `popup.css` — Extension toolbar popup. Status indicator, athlete card, workout sync count, deep-link footer.
- `package.json` — npm metadata; scripts: test, test:watch, test:coverage.
- `vitest.config.js` — Test setup (globals, chrome-mock.js setupFile, coverage config).
- `TESTING.md` — Manual integration test checklist.
- `README.md` — User-facing documentation.

## Subdirectories

- **`test/`** — Unit test suite (vitest)
  - `chrome-mock.js` — Minimal Chrome Extension API mock (runtime, tabs, storage, scripting).
  - `background.test.js` — Service worker tests (allowlist, Bearer routing, ping/list/push/activities).
  - `garmin-oauth.test.js` — Signer (locked against `oauth-1.0a`), mint/refresh, 401 re-mint, token store.
  - `kaiord-announce.test.js` — Announce script tests (runtime detection, context invalidation, re-injection).
  - `popup.test.js` — Popup UI tests (status rendering, snapshot staleness, fetch timeouts).
  - `profile-snapshot.test.js` — Profile validator tests (shape validation, pollution detection, length cap).
- **`icons/`** — Extension icons (16px, 48px, 128px PNG files referenced in manifest).
- **`assets/`** — Chrome Web Store marketing assets (promo images, screenshots for listing).

## For AI Agents: Working in This Directory

### Key Concepts

1. **Manifest V3**: Service worker (not background page). Host permissions for the three Garmin hosts. `externally_connectable` matches SPA origins and localhost dev server. Only the `storage` permission — no `tabs`/`webRequest`/`scripting`.
2. **OAuth token lifecycle** (`garmin-oauth.js`): the user's SSO session (cookie `CASTGC` on `sso.garmin.com`) is exchanged — WITHOUT a password — for a service ticket, then for an OAuth1 token (2-legged signed), then for an OAuth2 Bearer (3-legged signed). Tokens live in `chrome.storage.local` and survive cold starts. The Bearer is refreshed by re-running `exchange` with the long-lived OAuth1 (~1 year); if that fails, the bridge re-mints from the session. A 401 triggers one re-mint + retry.
3. **Path allowlist**: `background.js` `garminFetch` refuses any path outside the `ALLOWED` array (GET `/workout-service/workouts*`, POST `/workout-service/workout`, GET the activities-search endpoint). Locked against drift by `scripts/check-bridge-privacy-surface.mjs`.
4. **Profile snapshot**: Hand-rolled validator ensures no prototype pollution and an 8192-code-unit JSON cap; output uses `Object.create(null)`.
5. **Service worker cold start**: modules are re-imported via `importScripts()` on every `background.js` load; tokens are reloaded from `chrome.storage.local`.

### Working In This Directory

- **NEVER add a password `login()` here.** The whole point of the OAuth flow is that the user's existing browser session mints the token — the extension never sees a password. (The old cookie/CSRF relay was replaced precisely because Garmin rate-limits and the relay needed a live Garmin tab.)
- The consumer key/secret in `garmin-oauth.js` are Garmin's public reverse-engineered values (same as garth). Hardcoded to avoid an extra host permission; bump them if Garmin rotates the S3 `oauth_consumer.json`.
- Auth failures throw with `needsReauth: true` so the SPA/popup can prompt the user to open Garmin Connect and sign in.
- The OAuth1 signer is verified byte-for-byte against `oauth-1.0a` in `test/garmin-oauth.test.js` with a frozen nonce/timestamp — keep that lock if you touch signing.

### File Size Limits & Structure

- Target: Files under 100 lines (tests exempt).
- Service worker + `garmin-oauth.js`: ~200–300 LOC each; modular by concern (signing, minting, fetch orchestration, action dispatch).
- Utilities: Pure functions (profile validator, allowlist check, message builders).

### Testing Requirements

- **Unit tests**: All public functions and message handlers (vitest + chrome-mock).
- **Coverage**: `background.js`, `garmin-oauth.js`, `kaiord-announce.js` (exclude `popup.js` due to DOM dependency).
- **Fixtures**: Shared profile snapshot fixtures between `profile-snapshot.test.js` and `@kaiord/core/test-utils` (run `pnpm --filter @kaiord/core build` first so the subpath resolves).
- **Chrome mock**: Stateful mock in `test/chrome-mock.js` with `__resetChromeMock()` helper for between-test isolation.
- **Integration smoke checks**: `TESTING.md` covers the manual e2e flow (sign in → mint → list/push).

### Common Patterns

**Action handler in background.js:**

```javascript
const listWorkouts = async () => {
  const res = await garminFetch(
    "/workout-service/workouts?start=0&limit=20",
    "GET"
  );
  if (!res?.ok) throw toBridgeError("List failed", res);
  return res.data;
};
```

**Bearer call surface (garmin-oauth.js):**

```javascript
// ensureToken() mints/refreshes as needed; a 401 re-mints once and retries.
const res = await garminOAuth.connectapiFetch(path, method, body, fetch);
// → { ok, status, data } | { ok:false, status, body }
```

**Path allowlist (background.js):**

```javascript
const ALLOWED = [
  { method: "GET", pattern: /^\/workout-service\/workouts(\?.*)?$/ },
  { method: "POST", pattern: /^\/workout-service\/workout$/ },
];
```

## Dependencies

### Internal (`@kaiord/*` workspace)

- `@kaiord/core` — (devDependencies only) Test utilities and fixture loaders for profile snapshot parity testing.

### External

- **vitest** — Test runner (devDependencies).
- **jsdom** — DOM mock for popup tests (devDependencies).
- Chrome Extension API + Web Crypto — Built-in (no npm dependency; mock in tests).

## Build & Release

This is not a library. The extension is packaged as a ZIP file for the Chrome Web Store:

1. **Development**: Load unpacked from this directory via `chrome://extensions/` with `manifest.json`.
2. **Production**: Swap `manifest.json` for `manifest.prod.json`, then ZIP this directory for Web Store submission.

See the root `release.yml` GitHub Actions workflow for automated packaging.

## MANUAL

Non-generated files beyond the AI agent's responsibility:

- `README.md` — User documentation (purpose, testing instructions, license).
- `.gitignore` — Excludes coverage, node_modules.
- `tsconfig.json`, `tsconfig.tsbuildinfo` — TypeScript config (if any `.ts` files added in future).
- `package.json` — npm metadata and version pinning.
- `CHANGELOG.md` — Version history.
- `TESTING.md` — Manual integration test checklist (not automated).
- `store-listing.md` — Chrome Web Store listing copy (category, description, features).
- `privacy-justification.md` — Privacy rationale for host permissions (required by Chrome Web Store).

### Vendored bridge-core files

`bridge-envelope.js`, `kaiord-announce.js`, `bridge-popup-utils.js`,
`bridge-popup-snapshot.js`, `popup.css`, `profile-snapshot.js`, and
`test/{chrome-mock,bridge-envelope.test}.js` are byte-identical vendored
copies of `packages/_shared/bridge-core/` masters — never edit them here;
edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). Per-bridge identity lives in
`bridge-identity.js` and must match `BRIDGE_MANIFEST` in `background.js`.
`garmin-oauth.js` is bridge-specific (NOT vendored).
