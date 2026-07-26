# Manual Integration Test Checklist

## Prerequisites

- Chrome (or Chromium-based browser)
- A MyTANITA account with at least one recorded measurement

## Setup

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked" and select `packages/tanita-bridge/`
4. Note the extension ID displayed under the extension name

## Test: Session Probe (ping)

- [ ] Open `https://mytanita.eu/en/user` and sign in (leave the tab open or
      not — the session cookie is what matters)
- [ ] Open the extension popup (click the extension icon)
- [ ] Verify: status shows "Connected to MyTANITA"

## Test: Read CSV Export (SPA)

- [ ] Open the browser console on `http://localhost:5173` (Kaiord SPA)
- [ ] Run:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "read-export-csv" }, console.log)`
- [ ] Verify: response is `{ ok: true, protocolVersion: 1, data: { csv: "…" } }`
      and `data.csv` contains the raw CSV header row followed by rows

## Test: No Session (needsReauth)

- [ ] Sign out of MyTANITA (or use a fresh profile)
- [ ] Open the extension popup
- [ ] Verify: status shows "No MyTANITA session"
- [ ] Via SPA console, `read-export-csv` returns an error envelope with
      `needsReauth: true`

## Test: SPA Communication (ping)

- [ ] From the SPA console:
      `chrome.runtime.sendMessage("EXTENSION_ID", { action: "ping" }, console.log)`
- [ ] Verify: response includes
      `{ ok: true, data: { authenticated: true, capabilities: ["read:body"] } }`

## Test: Origin Pinning

- [ ] From a non-Kaiord origin (e.g. `https://example.com` console), send
      `read-export-csv` to the extension ID
- [ ] Verify: response is
      `{ ok: false, error: "Origin or action not permitted" }`
