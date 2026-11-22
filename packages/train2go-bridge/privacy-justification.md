# Permission Justification

Why Kaiord for Train2Go asks for each permission in `manifest.prod.json`, and the other answers of the Chrome Web Store privacy form. Every paragraph and list item in this file is an entry in `claims/train2go.json`, with the code or test that proves it.

## Single Purpose

Lets the Kaiord App read the athlete's own Train2Go coaching plan, training zones and weight through the athlete's existing Train2Go sign-in.

## Permissions

### `storage`

**Why**: Keep what the popup shows between openings, so it can draw at once.

**Stored in `chrome.storage.local`**: the profile summary the Kaiord App sends for the popup's athlete card, with the time and name of the last one received; this week's planned, completed and workload totals, reused for 5 minutes; the app's theme preference (`light`, `dark` or `system`); when the popup last could and could not read from Train2Go; and a log of the last 25 errors the extension handled without failing.

**Not stored**: no password, cookie or token. The extension holds no credential of any kind.

**Sent anywhere**: nothing stored by the extension is sent to Train2Go or to Kaiord.

No other permission is declared. Opening Train2Go in a new tab from the popup or for the Kaiord App needs none.

## Host Permissions

### `https://app.train2go.com/*`

**Why**: The extension's service worker requests the athlete's own Train2Go data from this host with `credentials: "include"`, so Chrome attaches the athlete's Train2Go sign-in cookie. The extension cannot read that cookie: it does not declare the `cookies` permission.

**Paths**: only five, all `GET`, checked against an allowlist in the service worker before any request is sent: `/api/v2/profile/ping` (who is signed in), `/api/v2/workplan/weekly/{date}` and `/api/v2/workplan/daily/{date}` (the coaching plan), `/api/v2/workplan/tooltip/activity/{id}`, and `/user/details` (zones and weight). Any other path or method is refused without a request.

**No content script on Train2Go**: the extension injects nothing into Train2Go pages and does not read them.

## Content Script

### `kaiord-announce.js` on `https://kaiord.com/*`

**Why**: Tells the Kaiord App that the extension is installed, posting its id, version and capabilities to the page. It reads nothing from the page.

## externally_connectable

### `https://kaiord.com/*`

**Why**: Lets the Kaiord App at https://kaiord.com send messages to the extension. Only this exact origin is declared; subdomains (`www` included) cannot reach the extension, and a message from any other origin gets no answer.

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development builds of the Kaiord App only. They are declared in `manifest.json` and absent from the published `manifest.prod.json`.

## Remote Code

No. The extension runs only the scripts in its package; it loads no remote script and evaluates no code.

## Data Handling

- **No password or cookie**: The extension never reads, stores, or transmits your Train2Go password, and cannot read your Train2Go cookie.
- **Read only**: Every request is a `GET`; the extension never changes anything on Train2Go.
- **Requests to Train2Go only**: Every request the extension makes goes to `app.train2go.com`. What it reads is passed only to the Kaiord App in your browser.
- **No analytics or tracking**: Its error log stays in `chrome.storage.local` and is never sent.
