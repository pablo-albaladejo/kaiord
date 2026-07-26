# Manual Integration Test Checklist

## Prerequisites

- Chrome (or Chromium-based browser)
- A TrainingPeaks account with at least one recorded body metric (weight)

## Setup

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked" and select `packages/trainingpeaks-bridge/`
4. Note the extension ID displayed under the extension name

## Test: Session Probe (ping)

- [ ] Open `https://app.trainingpeaks.com` and sign in (leave the tab open or
      not — the session cookie is what matters)
- [ ] Open the extension popup (click the extension icon)
- [ ] Verify: status shows "Connected to TrainingPeaks"

## Test: Read Metrics (SPA)

- [ ] Open the browser console on `http://localhost:5173` (Kaiord SPA)
- [ ] Run:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "read-metrics", start: "2026-07-01", end: "2026-07-31" }, console.log)`
- [ ] Verify: response is `{ ok: true, protocolVersion: 1, data: [...] }`
      and `data` is the raw `consolidatedtimedmetrics` array

## Test: No Session (needsReauth)

- [ ] Sign out of TrainingPeaks (or use a fresh profile)
- [ ] Open the extension popup
- [ ] Verify: status shows "No TrainingPeaks session"
- [ ] Via SPA console, `read-metrics` returns an error envelope with
      `needsReauth: true`

## Test: SPA Communication (ping)

- [ ] From the SPA console:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "ping" }, console.log)`
- [ ] Verify: response includes
      `{ ok: true, data: { authenticated: true, athleteId: <n>, capabilities: ["read:body", "write:body"] } }`

## Test: Origin Pinning

- [ ] From a non-Kaiord origin (e.g. `https://example.com` console), send
      `read-metrics` to the extension ID
- [ ] Verify: response is
      `{ ok: false, error: "Origin or action not permitted" }`
