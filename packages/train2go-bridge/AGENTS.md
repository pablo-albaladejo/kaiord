<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-07-26 -->

# @kaiord/train2go-bridge

**Private Chrome Extension (Manifest V3)**, a thin Bridge (`docs/adr/0004-thin-bridge-smart-connector.md`, protocol version 2): it lends the athlete's Train2Go (https://app.train2go.com) Session and executes requests from a closed list of method + path patterns, handing the Kaiord App Train2Go's raw answer. What to ask for, how to read it and the mapping to KRD are the App's Train2Go Connector (`packages/workout-spa-editor/src/adapters/train2go/connector/`).

## Purpose

- Fetch `app.train2go.com` directly from the service worker with `credentials:"include"` (SW-direct) so the site's HttpOnly session cookie travels automatically — no content script on `app.train2go.com`, no relay hop
- Expose an external message surface (`ping`, `request`, `open-train2go`, `profile-snapshot`, `profile-snapshot-clear`, `set-theme`) for the App. `request` goes through the vendored `bridge-request-gate.js` and takes `{ method, path }` only, refuses anything outside `ALLOWED` (and any header or body) without a request, and answers `{ status, contentType, body }` unread
- Answer the internal channel only from the extension's own pages (the popup), never a content script, and only `ping`, `read-profile` and `read-week`: the popup's Session check, the profile it shows (athlete, coach's name and notes) and its weekly figures are the one thing still read inside the extension. `ping` is the Session check and answers yes or no only (`{ session, authenticated, sessionActive }`, #1643)
- Restrict communication to the exact Kaiord App origin (`https://kaiord.com/*`, no subdomain; `http://localhost:5173/*` and `http://localhost:5174/*` in dev builds only)
- Persist the user profile snapshot via `chrome.storage.local`
- Surface a dead session (redirect / login response) as `needsReauth` so the editor can prompt a re-login

**No JavaScript public API** — contract is the `chrome.runtime` message shape (documented inline in `background.js`) and parser output shape in `parser.js`.

## Key Files

| File                                    | Role                                                                                                                                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json`                         | Development manifest (MV3, Load Unpacked mode)                                                                                                                                                            |
| `manifest.prod.json`                    | Production manifest (Chrome Web Store)                                                                                                                                                                    |
| `background.js`                         | Service worker; SW-direct cookie fetch, closed path list, `request` action, external and internal (popup-only) message routers                                                                            |
| `session-fetch.js`                      | Vendored bridge-core cookie transport (`credentials:"include"` fetch + redirect detection)                                                                                                                |
| `parser.js`                             | Popup-only reader: who is signed in (ping JSON) and this week's done/workload counts                                                                                                                      |
| `kaiord-announce.js`                    | Content script on Kaiord origins; announces extension ID to SPA via `window.postMessage`                                                                                                                  |
| `profile-snapshot.js`                   | Validates + persists user profile state (ID, name, zones)                                                                                                                                                 |
| `popup.html` / `popup.js` / `popup.css` | Toolbar popup on the shared bridge shell: status block, capability chips, athlete card, weekly rollup with completion bar, coach notes, fix-first CTA pair. Its session probe re-wakes the service worker |
| `vitest.config.js`                      | Vitest configuration; jsdom environment for DOM mocking                                                                                                                                                   |
| `store-listing.md`                      | Chrome Web Store listing copy. Its Short and Detailed Description are a registered claims surface (`claims/train2go.json`, `pnpm lint:claims`)                                                            |
| `privacy-justification.md`              | Single purpose, permission justifications and remote-code answer for the CWS privacy form. A registered claims surface: every paragraph needs an entry in `claims/train2go.json`                          |

## Manifest Entries (MV3)

```json
{
  "manifest_version": 3,
  "permissions": ["storage"],
  "host_permissions": ["https://app.train2go.com/*"],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "background": { "service_worker": "background.js" },
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "48": "icons/icon48.png", "128": "icons/icon128.png" }
  },
  "content_scripts": [
    {
      "matches": [
        "https://kaiord.com/*",
        "http://localhost:5173/*",
        "http://localhost:5174/*"
      ],
      "js": ["bridge-identity.js", "kaiord-announce.js"],
      "run_at": "document_start"
    }
  ],
  "externally_connectable": {
    "matches": [
      "http://localhost:5173/*",
      "http://localhost:5174/*",
      "https://kaiord.com/*"
    ]
  }
}
```

## Subdirectories

### `/test`

Unit tests for all extension scripts (vitest + jsdom + chrome-API mock).

- `chrome-mock.js` — Mock `chrome.*` APIs for testing
- `*.test.js` — Test files for `background.js`, `parser.js`, `popup.js`, `kaiord-announce.js`, `profile-snapshot.js`
- `request-confinement.test.js` — Every request goes to `app.train2go.com` with the browser's cookies and no other credential, only `GET`; `chrome.storage.local` holds popup state only; a connection check (`ping`) is one profile ping answering yes or no only; the athlete's profile and the coach's name and notes go only to `read-profile`; only packaged scripts run. Proof for the listing and policy claims.
- `fixtures/` — HTML and JSON test data

See [TESTING.md](./TESTING.md) for integration / smoke test procedures on real Train2Go sessions.

### `/test/fixtures`

Test data: Train2Go HTML responses and API payloads.

- `weekly.html` — Sample weekly workplan HTML
- `daily.html` — Sample daily workplan HTML
- `details-active.html` — Sample details page with zones (server-rendered)
- `ping-active.json` — Active session ping response
- `ping-expired.json` — Expired session ping response

### `/assets`

Chrome Web Store promotional images (not loaded by extension at runtime).

- `marquee-promo-1400x560.png`
- `screenshot-1280x800.png`
- `small-promo-440x280.png`

### `/icons`

Extension icons for the Chrome Web Store and browser toolbar.

- `icon16.png` — 16×16 favicon
- `icon48.png` — 48×48 popup icon
- `icon128.png` — 128×128 Web Store icon

## For AI Agents

### Working in This Directory

**Key architectural patterns:**

1. **Service Worker (SW-direct) ↔ SPA (thin Bridge)**
   - `kaiord-announce.js` discovers extension at runtime (resilient to service-worker reload); it announces protocol version 2 from `bridge-identity.js`
   - SPA calls `chrome.runtime.sendMessage({ action: "request", method: "GET", path })`
   - `background.js` checks `ALLOWED`, fetches `app.train2go.com` with `credentials:"include"` (via the vendored `session-fetch` master), and returns the raw answer with its Session secrets (the `_token` anti-forgery field) removed by the vendored `bridge-answer.js`; the App parses it
   - The App accepts protocol 1 too: an extension not yet updated refuses `request` in a version-1 envelope and the App falls back to `read-week` / `read-day` / `read-details`
2. **Popup parser graceful degradation**
   - `parser.js` returns empty arrays on malformed HTML
   - No exceptions thrown; safe for jsdom mocking
3. **Session validation**
   - Profile snapshot cached in `chrome.storage.local`
   - A dead session (redirect / login response) is surfaced as `needsReauth`

4. **Privacy surface hardening**
   - `background.js` `ALLOWED` allowlist enforces exact API paths/methods before any fetch
   - `scripts/check-bridge-privacy-surface.mjs` (in repo root) validates allowlist syntax
   - No interpolation of user data in console/toast (rule: R-PIIInterpolation)

### Testing Requirements

- **Run tests:** `pnpm --filter @kaiord/train2go-bridge test`
- **Watch mode:** `pnpm --filter @kaiord/train2go-bridge test:watch`
- **Coverage:** `pnpm --filter @kaiord/train2go-bridge test:coverage` (target: 70% frontend)
- **Fixtures:** Place HTML/JSON under `test/fixtures/` and load via `fs.readFileSync`

**Test conventions (mechanically enforced):**

- `it()` titles: **must** start with `"should "`
- `it()` bodies: **must** contain `// Arrange`, `// Act`, `// Assert` (Pascal-case, in order, blank-line separated)

Example:

```javascript
it("should extract activities from weekly HTML", () => {
  // Arrange
  const html = fs.readFileSync(fixturesDir + "/weekly.html", "utf-8");

  // Act
  const activities = parser.parseWeeklyHtml(html);

  // Assert
  expect(activities.length).toBeGreaterThan(0);
  expect(activities[0]).toHaveProperty("id");
  expect(activities[0]).toHaveProperty("date");
});
```

### Common Patterns

**Message routing in background.js (SW-direct):**

```javascript
const train2goFetch = async (path, method = "GET") => {
  if (!isAllowed(method, path)) {
    return { ok: false, error: "Blocked: disallowed path or method" };
  }
  const res = await sessionFetch.cookieSessionFetch({
    url: `${TRAIN2GO_ORIGIN}${path}`,
    method,
    fetchImpl: fetch, // credentials:"include" + redirect:"manual"
  });
  // res.needsReauth on a dead session; res.body is handed over unread but for its Session secrets.
};
```

**Parser pattern (graceful degradation):**

```javascript
const parseWeeklyHtml = (html) => {
  if (!html || typeof html !== "string") return [];
  const activities = [];
  // Parse HTML with regex or DOM methods
  // Never throw; return empty array on error
  return activities;
};
```

**Profile snapshot validation:**

```javascript
const validateSnapshot = (obj) => {
  // Check required fields: profileId, name, trainingZones
  // Return { valid: boolean, errors?: string[] }
};
```

## Dependencies

### Internal

- `@kaiord/core` (domain types, test utilities)

### External

- **Chrome Runtime API** — storage (Manifest V3)
- **jsdom** (testing, DOM mocking)
- **vitest** (test runner)

## Notes

- **No npm entry point** — extension is loaded unpacked from directory via `chrome://extensions/`
- **Service-worker lifecycle** — can be suspended; the popup's session probe re-wakes it
- **Manifest swap on release** — production workflow uses `manifest.prod.json`
- **Privacy surface** — repo script `scripts/check-bridge-privacy-surface.mjs` validates the `background.js` fetch allowlist

<!-- MANUAL: Add integration test procedures and known Chrome/Train2Go API version constraints here -->

### Vendored bridge-core files

`bridge-envelope.js`, `bridge-answer.js`, `bridge-telemetry.js`, `bridge-request-gate.js`, `session-fetch.js`, `kaiord-announce.js`,
`bridge-popup-utils.js`, `bridge-popup-shell.js`,
`bridge-popup-snapshot.js`, `popup.css`,
`profile-snapshot.js`, and
`test/{chrome-mock,bridge-envelope.test,bridge-popup-shell.test}.js` are
byte-identical vendored copies of `packages/_shared/bridge-core/` masters —
never edit them here;
edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). Per-bridge identity lives in
`bridge-identity.js` and must match `BRIDGE_MANIFEST` in `background.js`.
