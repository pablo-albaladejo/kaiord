<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-09-28 -->

# @kaiord/garmin-bridge AGENTS.md

Chrome extension (Manifest V3) that bridges the Kaiord workout editor SPA to Garmin Connect. The service worker mints an OAuth token from the user's existing Garmin browser session (no password) and calls `connectapi.garmin.com` directly with `Authorization: Bearer`. No Garmin tab, content script, or CSRF capture is involved.

## Purpose

**What lives here:** Service worker (background script), the OAuth token-minting module, a content script for the SPA origin (identity announce only), extension popup UI, profile snapshot validator, and unit tests against a Chrome API mock.

**Core responsibility:** Mint + refresh a Garmin OAuth token from the user's session (only for a real request), persist it across service worker restarts, and run the App's `request` against the closed list.

**Thin Bridge** (`docs/adr/0004-thin-bridge-smart-connector.md`, protocol
version 2): the App reaches it only through `{ action: "request", method,
path, body? }`, which runs only an entry of the closed `ALLOWED` list in
`background.js` (method + path pattern, and for a write the name of the body
schema the vendored `bridge-request-gate.js` checks it against) and answers
Garmin's answer unread but for its Session secrets (removed by
the vendored `bridge-answer.js`) as `{ status, contentType, body }`. What to ask for,
how to read it, pacing and retries are the App's Connector (`packages/workout-spa-editor/src/adapters/garmin/connector/`). The App
falls back to the protocol-1 actions for the store version. The internal
channel uses `createInternalDispatch`: only the popup is answered, never a
content script (`test/thin-bridge.test.js`).

**Dependency direction:** Depends on `@kaiord/core` (test setup only, via devDependencies). No runtime dependencies on external libraries (plain JavaScript + Web Crypto for security and bundle size). Built files loaded directly into Chrome via manifest entry points.

## Key Files

- `manifest.json` — Development manifest (MV3, service worker, `storage` permission, host permissions for `connectapi.garmin.com` and `sso.garmin.com` only; opening `connect.garmin.com` in a tab needs none).
- `manifest.prod.json` — Production manifest for Chrome Web Store release (same surface, no localhost origins).
- `background.js` — Service worker. The closed list with body schemas (`workout`, `fit-file`, `schedule`), `request` under one deadline and send cut-off, action routing for `ping`/`request`/`open-garmin`/`profile-snapshot(-clear)`/`set-theme`, swallowed-error telemetry.
- `personal-fields.js` — The one declaration of the personal fields of the Platform's answers that no Connector reads, starting from the vendored `personal-identity.js`; `bridge-answer.js` removes them by name from every answer.
- `garmin-deadline.js` — The one deadline every request runs under (`boundedCall`: 25 s, no write after 15 s, `deadline-before-send` / `deadline-exceeded`).
- `garmin-request-bodies.js` — The body schemas of the write entries: `workout` is the GCN @kaiord/garmin's writer emits (one segment; executable steps and repeat groups of executable steps; every key named, Garmin's own type keys; name ≤255, step notes ≤256, ≤100 steps, ≤50 per repeat), `fit-file` is `garmin-fit-check.js`, `schedule` is one date.
- `garmin-fit-check.js` — Admits only the App's body-composition upload: a FIT file (≤4 KB, header and file CRC valid) of file type 9 "weight" holding one `file_id` then one `weight_scale` message, no other message, no developer field.
- `garmin-oauth.js` — OAuth token minting (bridge-specific, NOT vendored). OAuth1 HMAC-SHA1 signer, session→ticket→OAuth1→OAuth2 mint, refresh-and-persist, `connectapiFetch` (optional abort `signal`, raced against the token lifecycle by `raceAbort`).
- `kaiord-announce.js` — Content script injected on SPA origins (exactly `https://kaiord.com/*`; `http://localhost:5173/*` and `http://localhost:5174/*` in the dev manifest only). Announces extension ID and capabilities to the page via window message.
- `profile-snapshot.js` — Hand-rolled validator for profile snapshot objects (plain JS, parity-tested against `@kaiord/core` Zod schema).
- `popup.html` / `popup.js` / `popup.css` — Extension toolbar popup on the shared bridge shell. Status block (verdict + cause), "Feeds Kaiord" capability chips, athlete card, workout sync rollup, fix-first CTA pair.
- `package.json` — npm metadata; scripts: test, test:watch, test:coverage.
- `vitest.config.js` — Test setup (globals, chrome-mock.js setupFile, coverage config).
- `TESTING.md` — Manual integration test checklist.
- `README.md` — User-facing documentation.

## Subdirectories

- **`test/`** — Unit test suite (vitest)
  - `chrome-mock.js` — Minimal Chrome Extension API mock (runtime, tabs, storage, scripting).
  - `thin-bridge.test.js` — The message contract: protocol 2, the closed list and body schemas refusing anything else without a request, raw answers, needsReauth, the popup-only internal channel.
  - `background.test.js` — Service worker tests (manifest, Session check, the request deadline and send cut-off under fake timers, telemetry).
  - `garmin-oauth.test.js` — Signer (locked against `oauth-1.0a`), mint/refresh, 401 re-mint, token store.
  - `kaiord-announce.test.js` — Vendored from `_shared/bridge-core/test/` — edit the master, then `pnpm bridge:sync` (runtime detection, context invalidation).
  - `popup.test.js` — Popup UI tests (status rendering, snapshot staleness, fetch timeouts).
  - `profile-snapshot.test.js` — Profile validator tests (shape validation, pollution detection, length cap).
  - `request-bodies.test.js` — The write bodies at the message contract: the App's own body-composition FIT and GCN writer output are sent; an activity, settings, workout or truncated FIT, a changed byte, an oversized body, unknown keys, wrong types, long strings and too many steps are refused with nothing sent.
  - `library-delete.test.js` — No library delete: `DELETE /workout-service/workout/<id>` is refused before any token or request, whatever the id or origin (owner decision 2026-11-24; the entry returns with the App's `GARMIN_LIBRARY_DELETES` switch).
  - `answer-secrets.test.js` — Every answer is Garmin's, byte for byte, but for a credential member, which is dropped.
  - `signed-out-verified.test.js` — needsReauth only when Garmin's sign-in page issues no ticket or a step answers 401; a 429, 403 or 5xx keeps its status.
  - `legacy-ping.test.js` — The ping an older App tab reads never implies signed out.
  - `fixtures/` — `body-composition-upload.fit` (output of @kaiord/fit `encodeBodyCompositionFit`) and `*.gcn.json` (output of @kaiord/garmin's writer), regenerated from those packages, never hand-edited.
  - `token-confinement.test.js` — A Session check (`ping`) makes no request, mints and stores nothing and carries no workout; tokens a real request minted stay in `chrome.storage.local`; no answer to any external action carries one; every request goes to `sso.garmin.com` or `connectapi.garmin.com`. Proof for the listing and policy claims.
- **`icons/`** — Extension icons (16px, 48px, 128px PNG files referenced in manifest).
- **`assets/`** — Chrome Web Store marketing assets (promo images, screenshots for listing).

## For AI Agents: Working in This Directory

### Key Concepts

1. **Manifest V3**: Service worker (not background page). Host permissions for the three Garmin hosts. `externally_connectable` matches SPA origins and localhost dev server. Only the `storage` permission — no `tabs`/`webRequest`/`scripting`.
2. **OAuth token lifecycle** (`garmin-oauth.js`): the user's SSO session (cookie `CASTGC` on `sso.garmin.com`) is exchanged — WITHOUT a password — for a service ticket, then for an OAuth1 token (2-legged signed), then for an OAuth2 Bearer (3-legged signed). Tokens live in `chrome.storage.local` and survive cold starts. The Bearer is refreshed by re-running `exchange` with the long-lived OAuth1 (~1 year); if that fails, the bridge re-mints from the session. A 401 triggers one re-mint + retry.
3. **Closed list**: `background.js` refuses any request outside the `ALLOWED` array (GET `/workout-service/workouts?start=N&limit=N`, POST `/workout-service/workout` with a `workout` body, POST `/upload-service/upload/.fit` with a `fit-file` body, GET the activities search with `start`/`limit`, POST `/workout-service/schedule/<id>` with a `schedule` body and DELETE it, GET `/calendar-service/year/<yyyy>/month/<m>`; ids canonical, no leading zero; no path deletes a library workout). A body is refused on every entry that declares none, and on a write it must match the declared schema (`BODY_SCHEMAS`). Locked against drift by `scripts/check-bridge-privacy-surface.mjs`, which records each entry's body schema; refresh its golden (`scripts/fixtures/bridge-privacy-surface.json`) deliberately when the surface changes, keeping each allowlist entry on one physical line.
4. **Profile snapshot**: Hand-rolled validator ensures no prototype pollution and an 8192-code-unit JSON cap; output uses `Object.create(null)`.
5. **One deadline for every request**: a write is NOT idempotent (two schedule POSTs make two calendar entries), so the bridge never retries one. Every `request` runs under one deadline `REQUEST_DEADLINE_MS` (25 s, below Chrome's ~30 s pending-fetch limit in an MV3 service worker) from handler entry. The deadline signal is injected into the request itself; the token lifecycle runs on the untimed `fetch` and only this caller's wait is raced against the signal (`raceAbort`), so a mint other callers join is never aborted by one caller's deadline, and an aborted refresh never falls back to a session re-mint. No write starts after `REQUEST_SEND_CUTOFF_MS` (15 s, measured with `performance.now()`). The outcome travels in the envelope's `error` string: `deadline-before-send` (nothing reached Garmin) or `deadline-exceeded` (sent, then aborted — no status, so the App treats it as ambiguous). Reading the schedule id, picking one workout's entries out of a calendar month, pacing and retrying the activities pull are the App's Garmin Connector, not this extension.
6. **Feature flags**: `ping` reports `features` (`BRIDGE_FEATURES`, today `["calendar-write-v1", "calendar-find-v1"]`) next to the manifest. They are NOT capabilities: `BRIDGE_MANIFEST.capabilities` and `bridge-identity.js` stay in lockstep and do not change for a new calendar contract.
7. **Service worker cold start**: modules are re-imported via `importScripts()` on every `background.js` load; tokens are reloaded from `chrome.storage.local`.

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

**The one App action in background.js:**

```javascript
const request = async (message) => {
  const { method, path, body } = admitRequest(message); // closed list + body schema
  const res = await boundedCall(path, method, toWireBody(path, body)); // deadline
  if (!res?.ok) throw toBridgeError("Request failed", res);
  return { status: res.status, contentType: res.contentType, body: res.body };
};
```

**Bearer call surface (garmin-oauth.js):**

```javascript
// ensureToken() mints/refreshes as needed; a 401 re-mints once and retries.
const res = await garminOAuth.connectapiFetch(path, method, body, fetch);
// → { ok, status, data } | { ok:false, status, body }
```

**Closed list (background.js):**

```javascript
const ALLOWED = [
  {
    method: "GET",
    pattern: /^\/workout-service\/workouts\?start=\d+&limit=\d+$/,
  },
  { method: "POST", pattern: /^\/workout-service\/workout$/, body: "workout" },
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
- `store-listing.md` — Chrome Web Store listing copy (category, description, features). Its Short and Detailed Description are a registered claims surface (`claims/garmin.json`, `pnpm lint:claims`).
- `privacy-justification.md` — Permission justifications (required by Chrome Web Store). A registered claims surface: every paragraph needs an entry in `claims/garmin.json`.

### Vendored bridge-core files

`bridge-envelope.js`, `bridge-answer.js`, `bridge-telemetry.js`, `bridge-request-gate.js`, `bearer-fetch.js`,
`kaiord-announce.js`, `bridge-popup-utils.js`,
`bridge-popup-shell.js`, `bridge-popup-snapshot.js`, `popup.css`,
`profile-snapshot.js`, and
`test/{chrome-mock,bridge-envelope.test,bridge-popup-shell.test}.js` are
byte-identical vendored
copies of `packages/_shared/bridge-core/` masters — never edit them here;
edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). Per-bridge identity lives in
`bridge-identity.js` and must match `BRIDGE_MANIFEST` in `background.js`.
`garmin-oauth.js` is bridge-specific (NOT vendored).
