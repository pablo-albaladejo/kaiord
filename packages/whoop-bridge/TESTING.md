# Manual Integration Test Checklist

## Prerequisites

- Chrome (or Chromium-based browser)
- A WHOOP account with recovery, sleep, and workout history

## Setup

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked" and select `packages/whoop-bridge/`
4. Note the extension ID displayed under the extension name

## Test: Session Bearer Capture

- [ ] Open `https://app.whoop.com/` and log in
- [ ] Let the WHOOP dashboard finish loading (it issues its own
      `api.prod.whoop.com` requests, which the extension intercepts)
- [ ] Open the extension popup
- [ ] Verify: status shows "Connected"
- [ ] In `chrome://extensions/` → the bridge → "service worker" → Inspect →
      Application → Storage → Session: verify `whoopToken`, `whoopUserId`,
      and `whoopCapturedAt` are present

## Test: SPA Communication (ping)

- [ ] Open the browser console on `http://localhost:5173` (Kaiord SPA)
- [ ] Run:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "ping" }, console.log)`
- [ ] Verify: response includes
      `{ ok: true, protocolVersion: 1, data: { id: "whoop-bridge", connected: true, capabilities: ["read:body", "read:sleep", "read:activities"] } }`

## Test: Allowlisted Read (whoop-fetch)

- [ ] With a WHOOP tab open and connected, run from the SPA console:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "whoop-fetch", path: "/core-details-bff/v0/cycles/details" }, console.log)`
- [ ] Verify: response is
      `{ ok: true, protocolVersion: 1, data: { ok: true, status: 200, data: {...} } }`

## Test: Disallowed Path Rejected

- [ ] From the SPA console, run `whoop-fetch` with a path outside the
      allowlist (e.g. `/membership-service/v1/affiliate`)
- [ ] Verify: response data is
      `{ ok: false, error: "Blocked: disallowed path or method" }` and no
      network request appears in the WHOOP tab's Network panel

## Test: No WHOOP Tab Open

- [ ] Close every `app.whoop.com` tab
- [ ] From the SPA console, run `whoop-fetch` for an allowed path
- [ ] Verify: the extension surfaces an error containing "No app.whoop.com
      tab open."

## Test: No Session Captured Yet

- [ ] Use a fresh Chrome profile (or clear `chrome.storage.session` via the
      service worker devtools) and do not open `app.whoop.com`
- [ ] Open the extension popup
- [ ] Verify: status shows "Session signed out"
- [ ] Verify: a `whoop-fetch` attempt fails with "no session token
      captured — open app.whoop.com and reload it"

## Test: Service Worker Restart (token survives cold start)

- [ ] With a captured session, open `chrome://serviceworker-internals/`
- [ ] Find and stop the Kaiord WHOOP Bridge service worker
- [ ] Open the extension popup
- [ ] Verify: still "Connected" — the bearer was reloaded from
      `chrome.storage.session`

## Test: Action Allowlist (reduced external surface)

`chrome.runtime` is only injected into pages matching
`externally_connectable`, so sending from a non-Kaiord origin throws a
`TypeError` in the page rather than returning the rejection envelope — that
proves the manifest gate, not the dispatch gate. To exercise the dispatch
gate, send a **disallowed action** from an allowed origin.

- [ ] From `http://localhost:5173` (an allowed origin), run:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "open-whoop" }, console.log)`
- [ ] Verify: response is
      `{ ok: false, protocolVersion: 1, error: "Origin or action not permitted", retryable: false }`
      and no WHOOP tab opens — `open-whoop` is internal-only and absent from
      `EXTERNAL_ACTIONS`
- [ ] Repeat with `{ action: "capture-token", token: "x" }` and verify the
      same envelope, and that the popup still shows "Session signed out"
      (no token was stored)

## Test: Origin Pinning

- [ ] From a non-Kaiord origin (e.g. the `https://example.com` console), run
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "ping" }, console.log)`
- [ ] Verify: the call throws `TypeError: Cannot read properties of undefined`
      (or similar) because `chrome.runtime` is not injected on that origin —
      the message never reaches the extension at all. This is the manifest's
      `externally_connectable` gate; the dispatch-level origin check in
      `bridge-envelope.js` is the second layer behind it
