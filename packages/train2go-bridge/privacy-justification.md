# Permission Justification

This document explains why each Chrome extension permission is required, for Chrome Web Store review.

## Permissions

### `tabs`

**Why**: Query for open Train2Go tabs to route messages to the content script, and open new Train2Go tabs via the popup action.

**Usage**: `chrome.tabs.query({ url: "https://app.train2go.com/*" })` and `chrome.tabs.create()`.

## Host Permissions

### `https://app.train2go.com/*`

**Why**: Required for the content script to execute on Train2Go pages and read the coaching plan DOM. The content script parses training plan data from the page and sends it to the extension popup via messaging.

## externally_connectable

### `https://*.kaiord.com/*`

**Why**: Production origin for the Kaiord SPA. Allows the deployed SPA to communicate with the extension to receive imported workouts.

## Data Handling

- **No credentials stored**: The extension never reads, stores, or transmits user passwords or tokens.
- **No data persistence**: The extension stores no data locally. Training plan data is read on-demand from the Train2Go page DOM.
- **No external communication**: The extension only communicates with `app.train2go.com` (via content script) and allowed SPA origins (via `externally_connectable`).
- **No analytics or tracking**: No telemetry of any kind.
