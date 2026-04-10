## MODIFIED Requirements

### Requirement: Extension manifest

The extension v1 SHALL target Chrome (Chromium-based browsers) only. Firefox is not supported due to lack of `externally_connectable` API.

The extension SHALL use Manifest V3 with the following permissions:

- `storage` — persist CSRF token in `chrome.storage.session` across service worker restarts
- `tabs` — query for Garmin Connect tabs and open new tabs
- `webRequest` — intercept outgoing requests to capture CSRF tokens

Host permissions SHALL include `https://connect.garmin.com/*`.

The `externally_connectable` field SHALL declare SPA origins: `http://localhost:5173/*`, `http://localhost:5174/*`, and `https://*.kaiord.com/*`.

The manifest SHALL declare a top-level `icons` field with sizes 16, 48, and 128. The `action.default_icon` field SHALL reference sizes 48 and 128 (Chrome does not use 16px for the action icon).

A production variant (`manifest.prod.json`) SHALL exist that excludes localhost origins from `externally_connectable` and is used for Chrome Web Store packaging.

#### Scenario: Extension loads with required permissions

- **WHEN** the extension is installed
- **THEN** it registers a `webRequest.onBeforeSendHeaders` listener for `https://connect.garmin.com/*`

#### Scenario: Extension declares icon sizes

- **WHEN** the extension manifest is read
- **THEN** the top-level `icons` field SHALL declare sizes 16, 48, and 128
- **AND** `action.default_icon` SHALL declare sizes 48 and 128
