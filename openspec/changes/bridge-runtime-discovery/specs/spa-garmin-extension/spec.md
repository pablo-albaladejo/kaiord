## MODIFIED Requirements

### Requirement: Extension detection

The SPA SHALL detect whether the Kaiord Garmin Bridge extension is installed by listening for `KAIORD_BRIDGE_ANNOUNCE` messages on `window` with `bridgeId: "garmin-bridge"`. Upon receiving an announcement, the SPA SHALL verify the bridge by sending a `ping` message to the announced `extensionId` via `chrome.runtime.sendMessage`. Detection SHALL use the bridge protocol lifecycle: 60-second heartbeat interval, 3 consecutive failures mark the bridge as UNAVAILABLE, and 24 hours of UNAVAILABLE status triggers REMOVED with user notification.

The extension ID SHALL be discovered at runtime from the content script announcement. The `VITE_GARMIN_EXTENSION_ID` environment variable is no longer required.

If the browser is not Chrome-based (no `chrome.runtime.sendMessage` available), the SPA SHALL show a "Chrome required" message instead of the install prompt.

#### Scenario: Extension is installed and session active

- **WHEN** the SPA receives a bridge announcement and the verification ping returns `{ ok: true, protocolVersion: 1, data: { gcApi: { ok: true } } }`
- **THEN** the SPA state is set to `extensionInstalled: true, sessionActive: true`

#### Scenario: Extension is installed but no session

- **WHEN** the SPA receives a bridge announcement and the verification ping returns `{ ok: true, protocolVersion: 1, data: { gcApi: { ok: false } } }`
- **THEN** the SPA state is set to `extensionInstalled: true, sessionActive: false`

#### Scenario: Extension is not installed

- **WHEN** no `KAIORD_BRIDGE_ANNOUNCE` with `bridgeId: "garmin-bridge"` is received within the discovery timeout
- **THEN** the SPA state is set to `extensionInstalled: false, sessionActive: false`

#### Scenario: Browser has no extension API

- **WHEN** `chrome.runtime` is undefined (e.g., Safari, Firefox, non-extension-capable browser)
- **THEN** the SPA shows a "Chrome or Chromium-based browser required for Garmin integration" message
