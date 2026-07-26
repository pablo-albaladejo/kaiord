# Manual Integration Test Checklist

## Prerequisites

- Chrome (or Chromium-based browser)
- A Garmin Connect account with at least one workout

## Setup

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked" and select `packages/garmin-bridge/`
4. Note the extension ID displayed under the extension name

## Test: Token Mint From Session

- [ ] Open `https://connect.garmin.com/modern/` and log in (leave the tab open or not — the session cookie is what matters)
- [ ] Open the extension popup (click the extension icon)
- [ ] Verify: status shows "Connected to Garmin Connect"
- [ ] In `chrome://extensions/` → the bridge → "service worker" → Inspect → Application → Storage → Local: verify `garminOAuth1` and `garminOAuth2` are present

## Test: List Workouts (ping / gcApi)

- [ ] With the popup showing "Connected", the workout-library count renders in the Sync rollup
- [ ] Verify the underlying `list` action works (see SPA test below)

## Test: SPA Communication (ping)

- [ ] Open browser console on `http://localhost:5173` (Kaiord SPA)
- [ ] Run: `chrome.runtime.sendMessage("EXTENSION_ID", { action: "ping" }, console.log)`
- [ ] Verify: response includes `{ ok: true, protocolVersion: 1, data: { authenticated: true, gcApi: { ok: true } } }`

## Test: SPA Communication (push)

- [ ] Build a GCN workout payload
- [ ] Run: `chrome.runtime.sendMessage("EXTENSION_ID", { action: "push", gcn: payload }, console.log)`
- [ ] Verify: response includes `{ ok: true, data: { workoutId: ... } }`
- [ ] Verify: workout appears in Garmin Connect

## Test: Service Worker Restart (token survives cold start)

- [ ] Open `chrome://serviceworker-internals/`
- [ ] Find and stop the Kaiord Garmin Bridge service worker
- [ ] Open the extension popup
- [ ] Verify: still "Connected" — the stored OAuth token was reused (no re-mint needed unless expired)

## Test: No Session (needsReauth)

- [ ] Sign out of Garmin Connect (or use a fresh profile) and clear the extension's `garminOAuth1`/`garminOAuth2` from Local storage
- [ ] Open the extension popup
- [ ] Verify: status shows "Not connected — open Garmin Connect and refresh"
- [ ] Via SPA console, `ping` returns `data.gcApi.ok: false`; a `list`/`push` error carries `needsReauth: true`

## Test: Token Refresh

- [ ] In Local storage, edit `garminOAuth2.expires_at` to a past epoch-seconds value
- [ ] Trigger a `ping` (open popup)
- [ ] Verify: still "Connected" — the bridge silently refreshed the Bearer via the stored OAuth1 (watch the service-worker Network panel for one `exchange` call)

## Test: Path Allowlist

- [ ] From console: `chrome.runtime.sendMessage("EXTENSION_ID", { action: "list" }, console.log)`
- [ ] Verify: succeeds (allowed path)
- [ ] `garminFetch` blocks disallowed paths internally (not reachable via the external API; covered by unit tests)
