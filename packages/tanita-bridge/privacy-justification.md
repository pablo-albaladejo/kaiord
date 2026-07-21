# Permission Justification

This document explains why each Chrome extension permission is required, for
Chrome Web Store review.

## Permissions

### `storage`

**Why**: Reserved for lightweight local state (e.g. last-sync bookkeeping)
kept entirely on the user's device via `chrome.storage`. No credential value
is ever stored.

## Host Permissions

### `https://mytanita.eu/*`

**Why**: The extension issues a single `GET https://mytanita.eu/en/user/export-csv`
from its background service worker to read the user's own body-composition CSV
export. The request rides the user's existing logged-in session cookie
(`credentials: "include"`); the extension never reads, stores, or transmits the
cookie or the user's password.

## externally_connectable

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development origins for the Kaiord SPA (Vite dev server). Stripped from
the production manifest.

### `https://*.kaiord.com/*`

**Why**: Production origin for the Kaiord editor. Allows the deployed SPA to
request the CSV export via Chrome's one-way inbound `externally_connectable`
channel.

## Data Handling

- **No passwords**: The extension never reads, stores, or transmits the user's
  MyTANITA password. It reuses the browser's existing signed-in session.
- **No cookie access**: The extension does NOT declare the `cookies` permission
  and cannot read the HttpOnly `TANITASESS` session cookie; the cookie travels
  automatically with the fetch and is never exposed to extension code.
- **Raw CSV only**: The export text is handed to the Kaiord editor for parsing;
  the extension does not interpret or persist body-composition data.
- **No external communication**: The extension talks only to `mytanita.eu` and
  the allowed Kaiord SPA origins. No third-party servers, no analytics, no
  telemetry.
