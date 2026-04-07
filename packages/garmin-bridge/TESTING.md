# Manual Integration Test Checklist

## Prerequisites

- Chrome (or Chromium-based browser)
- A Garmin Connect account with at least one workout

## Setup

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked" and select `packages/garmin-bridge/`
4. Note the extension ID displayed under the extension name

## Test: CSRF Token Capture

- [ ] Open `https://connect.garmin.com/modern/`
- [ ] Log in if needed
- [ ] Navigate to any page (dashboard, activities, workouts)
- [ ] Open the extension popup (click the extension icon)
- [ ] Verify: status shows "Connected to Garmin Connect"

## Test: List Workouts

- [ ] With popup showing "Connected", click "List Workouts"
- [ ] Verify: workout names appear in the popup

## Test: SPA Communication (ping)

- [ ] Open browser console on `http://localhost:5173` (Kaiord SPA)
- [ ] Run: `chrome.runtime.sendMessage("EXTENSION_ID", { action: "ping" }, console.log)`
- [ ] Verify: response includes `{ ok: true, protocolVersion: 1, data: { csrfCaptured: true, gcApi: { ok: true } } }`

## Test: SPA Communication (push)

- [ ] Build a GCN workout payload
- [ ] Run: `chrome.runtime.sendMessage("EXTENSION_ID", { action: "push", gcn: payload }, console.log)`
- [ ] Verify: response includes `{ ok: true, data: { workoutId: ... } }`
- [ ] Verify: workout appears in Garmin Connect

## Test: Service Worker Restart

- [ ] Open `chrome://serviceworker-internals/`
- [ ] Find and stop the Kaiord Garmin Bridge service worker
- [ ] Open the extension popup and click "Check Session"
- [ ] Verify: CSRF token was preserved (session still connected)

## Test: No Garmin Tab

- [ ] Close all Garmin Connect tabs
- [ ] Open extension popup, click "Check Session"
- [ ] Verify: error message about no Garmin tab

## Test: Path Allowlist

- [ ] From console: `chrome.runtime.sendMessage("EXTENSION_ID", { action: "list" }, console.log)`
- [ ] Verify: succeeds (allowed path)
- [ ] The content script blocks disallowed paths internally (not testable via external API, covered by unit tests)
