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

## Test: Origin Pinning

- [ ] From a non-Kaiord origin (e.g. `https://example.com` console), send
      any external action to the extension ID
- [ ] Verify: response is
      `{ ok: false, error: "Origin or action not permitted" }`
