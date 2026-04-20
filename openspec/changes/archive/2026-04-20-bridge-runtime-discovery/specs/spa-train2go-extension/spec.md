## MODIFIED Requirements

### Requirement: Train2Go extension detection

The SPA SHALL detect whether the Kaiord Train2Go Bridge extension is installed by listening for `KAIORD_BRIDGE_ANNOUNCE` messages on `window` with `bridgeId: "train2go-bridge"`. Upon receiving an announcement, the SPA SHALL verify the bridge by sending a `ping` message to the announced `extensionId` via `chrome.runtime.sendMessage`. Detection SHALL follow the same two-stage timeout pattern as the Garmin bridge: first attempt with 2s timeout, retry once with 4s timeout on service worker cold start.

The extension ID SHALL be discovered at runtime from the content script announcement. The `VITE_TRAIN2GO_EXTENSION_ID` environment variable is no longer required.

The existing bridge registry (`adapters/bridge/bridge-registry.ts`) SHALL register bridges from content script announcements. Both bridges can be active simultaneously.

#### Scenario: Train2Go extension is installed and session active

- **WHEN** the SPA receives a bridge announcement with `bridgeId: "train2go-bridge"` and the verification ping returns `{ ok: true, protocolVersion: 1, data: { sessionActive: true, userId: 28035 } }`
- **THEN** the bridge registry registers the Train2Go bridge with capability `"read:training-plan"` and status `"verified"`

#### Scenario: Train2Go extension is not installed

- **WHEN** no `KAIORD_BRIDGE_ANNOUNCE` with `bridgeId: "train2go-bridge"` is received within the discovery timeout
- **THEN** the Train2Go integration is silently hidden (no error shown — it is optional)

#### Scenario: Both Garmin and Train2Go bridges discovered

- **WHEN** the SPA receives announcements from both bridges
- **THEN** `hasCapability("write:workouts")` returns true (Garmin) and `hasCapability("read:training-plan")` returns true (Train2Go)
