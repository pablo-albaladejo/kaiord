> Synced: 2026-04-20 (bridge-runtime-discovery)

# SPA Garmin Extension

## Purpose

SPA-side integration with the garmin-bridge extension — runtime discovery via content script announcement, heartbeat, and push-to-Garmin operations routed through the bridge-protocol port.

## Requirements

### Requirement: Extension detection

The SPA SHALL detect whether the Kaiord Garmin Bridge extension is installed by listening for `KAIORD_BRIDGE_ANNOUNCE` messages on `window` with `bridgeId: "garmin-bridge"`. Upon receiving an announcement, the SPA SHALL verify the bridge by sending a `ping` message to the announced `extensionId` via `chrome.runtime.sendMessage`. Detection SHALL use the bridge protocol lifecycle: 60-second heartbeat interval, 3 consecutive failures mark the bridge as UNAVAILABLE, and 24 hours of UNAVAILABLE status triggers REMOVED with user notification.

The extension ID SHALL be discovered at runtime from the content script announcement. No build-time environment variable is required.

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

#### Scenario: Extension protocol version mismatch

- **WHEN** the SPA receives a ping response without `protocolVersion` or with an unsupported version
- **THEN** the SPA shows "Update your Kaiord Garmin Bridge extension" instead of the normal controls

#### Scenario: Extension context invalidated (extension upgraded)

- **WHEN** the SPA sends a message and receives "Extension context invalidated" error
- **THEN** the SPA automatically re-runs detection and shows "Extension was updated. Reconnecting..."

### Requirement: Settings tab labeled "Extensions"

The Settings panel SHALL have a tab labeled "Extensions" (not "Garmin") to accommodate multiple bridge extensions (Garmin Connect, Train2Go, and future bridges). The tab SHALL display all registered bridges in a status table.

#### Scenario: Settings tab label

- **WHEN** the user opens the Settings panel
- **THEN** the tab is labeled "Extensions" (not "Garmin")

#### Scenario: Extensions tab shows all bridges

- **WHEN** the user opens the Extensions tab
- **THEN** the tab displays a table with rows for each registered bridge (Garmin Connect, Train2Go) showing name and status

### Requirement: Extension install prompt

When the extension is not installed, the SPA SHALL display a prompt to install the Kaiord Garmin Bridge extension with a link to the installation source. The prompt SHALL include manual install instructions (load unpacked from GitHub release) since Web Store is not yet available. The message SHALL say "installed AND enabled" to cover the case where the extension is disabled.

#### Scenario: User sees install prompt

- **WHEN** the SPA detects the extension is not installed
- **THEN** the Garmin section shows an "Install Kaiord Garmin Bridge" button/link with instructions instead of push/list controls

### Requirement: Session status display

When the extension is installed but the session is not active, the SPA SHALL display a "Connect to Garmin" button. Clicking it sends `{ action: "open-garmin" }` to the extension, which opens a Garmin Connect tab. The SPA then polls via ping every 2s (up to 5 attempts) until `sessionActive: true`, showing a "Connecting to Garmin..." spinner.

#### Scenario: One-click Garmin connection

- **WHEN** the user clicks "Connect to Garmin"
- **THEN** the extension opens a Garmin Connect tab and the SPA polls until the session is active

#### Scenario: Connection polling times out

- **WHEN** the SPA polls 5 times without `sessionActive: true`
- **THEN** the SPA shows guidance: "Open Garmin Connect, log in, and navigate around to activate the session"

### Requirement: Push workout via extension

When the extension is installed and the session is active, the SPA SHALL provide a "Send to Garmin" button that converts the current workout to GCN format and sends it to the extension via `{ action: "push", gcn: payload }`. The SPA SHALL use a 15-second timeout for push operations.

On any push/list failure with status 401 or 403, the SPA SHALL automatically re-run detection (`ping`) to update `sessionActive` before setting `lastError`.

#### Scenario: Successful push

- **WHEN** the user clicks "Send to Garmin" and the extension returns `{ ok: true }`
- **THEN** the SPA shows a success notification

#### Scenario: Push fails

- **WHEN** the extension returns `{ ok: false, error: "..." }`
- **THEN** the SPA shows an error notification with the error message

#### Scenario: Push fails with 401/403

- **WHEN** the extension returns `{ ok: false, status: 403 }`
- **THEN** the SPA re-runs detection, updates `sessionActive: false`, and shows "Garmin session expired. Please reconnect."

#### Scenario: Push times out

- **WHEN** the extension does not respond within 15 seconds
- **THEN** the SPA shows "Extension did not respond. The workout may have been created — check Garmin Connect before retrying."

### Requirement: List workouts via extension

The SPA SHALL support listing workouts from Garmin Connect via `{ action: "list" }` when the extension session is active. The SPA SHALL use a 10-second timeout for list operations.

#### Scenario: List workouts

- **WHEN** the SPA requests the workout list and the extension returns `{ ok: true, data: [...] }`
- **THEN** the SPA displays the list of Garmin workouts

### Requirement: Remove Lambda integration

The SPA SHALL remove all Lambda proxy integration code:

- `VITE_GARMIN_LAMBDA_URL` environment variable
- Lambda URL configuration in settings panel (`GarminLambdaInput` component)
- Username/password credential storage (`garmin-store-persistence`)
- Direct `fetch()` calls to Lambda endpoint (`lib/garmin-push.ts`)

#### Scenario: No Lambda references remain

- **WHEN** the SPA is built
- **THEN** no code references `VITE_GARMIN_LAMBDA_URL`, Lambda URL validation, or credential storage for Garmin

### Requirement: Garmin store redesign

The Zustand Garmin store SHALL be redesigned to track extension state instead of credentials:

- `extensionInstalled: boolean`
- `sessionActive: boolean`
- `pushing: boolean`
- `lastError: string | null`
- `lastDetectionTimestamp: number | null`

The store SHALL NOT persist any data to localStorage (no credentials, no tokens).

#### Scenario: Store initial state

- **WHEN** the SPA loads
- **THEN** the Garmin store initializes with `extensionInstalled: false, sessionActive: false, pushing: false, lastError: null, lastDetectionTimestamp: null`

#### Scenario: Store updated after detection

- **WHEN** the extension ping completes
- **THEN** the store reflects the detected state and updates `lastDetectionTimestamp`

#### Scenario: Bridge lifecycle heartbeat

- **WHEN** the bridge heartbeat runs every 60 seconds
- **THEN** the store reflects the detected state via the bridge protocol lifecycle (VERIFIED / UNAVAILABLE / REMOVED)

### Requirement: Extension ping response includes capability manifest

The garmin-bridge extension SHALL include a capability manifest in its ping response, declaring its bridge ID, name, version, protocol version, and supported capabilities.

#### Scenario: SPA pings garmin-bridge

- **WHEN** the SPA sends `{ action: "ping" }` to the garmin-bridge extension
- **THEN** the extension SHALL respond with `{ ok: true, protocolVersion: 1, data: { id: "garmin-bridge", name: "Garmin Connect", version: "<current>", capabilities: ["write:workouts"] } }` in addition to the existing session status fields

#### Scenario: Backward compatibility

- **WHEN** an older SPA version pings the updated garmin-bridge
- **THEN** the extension SHALL still include the existing session status fields alongside the new manifest fields, maintaining backward compatibility
