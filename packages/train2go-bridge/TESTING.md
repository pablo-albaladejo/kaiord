# Manual Testing Guide — Kaiord Train2Go Bridge

## Prerequisites

- Chrome or Chromium-based browser
- A Train2Go account with an active training plan

## Load the Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `packages/train2go-bridge/` directory
5. Note the extension ID shown on the card

## Test Session Check

1. Open `https://app.train2go.com` and log in
2. Click the extension icon (puzzle piece → Kaiord Train2Go Bridge)
3. Click **Check Session**
4. Expected: Green "Connected — {Your Name}"

## Test Read This Week

1. With session connected, click **Read This Week**
2. Expected: "{N} activities found"

## Test with SPA

1. Start the SPA: `cd packages/workout-spa-editor && pnpm dev`
2. Open the SPA — the extension's content script auto-announces to
   the page and the SPA discovers the extension ID at runtime.
3. No `.env` entry is required.

## Verify the SW-direct cookie fetch (required after the relay migration)

This bridge is **service-worker-direct**: `background.js` calls
`fetch("https://app.train2go.com${path}", { credentials: "include" })` from
the service worker itself — there is no content script on `app.train2go.com`.
The migration relies on the browser attaching the site's `SameSite=Lax`
session cookie to that SW-initiated first-party request. Confirm it manually
before trusting the migration:

1. Log in at `https://app.train2go.com` in the same Chrome profile.
2. Open the extension's service worker devtools
   (`chrome://extensions/` → the bridge card → "service worker" → Inspect).
3. Trigger a read (open the popup, or from the SPA run **Read This Week**).
4. In the SW devtools **Network** tab, confirm the `app.train2go.com` request
   carries the session cookie and returns `200` (not a `3xx` login redirect).
   A redirect / login response must surface as `{ needsReauth: true }`.

## Troubleshooting

- **"Not connected"**: Confirm you are logged in at `app.train2go.com` in the
  same browser profile, then reopen the popup.
- **`needsReauth`**: The session cookie is missing or expired — sign in at
  `app.train2go.com` and retry.
- **Service worker inactive**: Open the popup to wake it up.
