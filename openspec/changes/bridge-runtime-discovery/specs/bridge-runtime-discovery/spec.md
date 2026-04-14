## ADDED Requirements

### Requirement: Bridge announcement via content script

Each bridge extension SHALL inject a content script into pages matching `https://*.kaiord.com/*` and `http://localhost:*/*`. The content script SHALL post a message to `window` on injection:

```json
{
  "type": "KAIORD_BRIDGE_ANNOUNCE",
  "bridgeId": "<bridge-id>",
  "extensionId": "<chrome.runtime.id>",
  "name": "<human-readable name>",
  "version": "<extension version>",
  "protocolVersion": 1,
  "capabilities": ["<capability-1>", ...]
}
```

The content script SHALL use `run_at: "document_start"` to announce as early as possible.

#### Scenario: Garmin Bridge announces on kaiord.com

- **WHEN** the Garmin Bridge extension is installed and the user navigates to `https://kaiord.com/calendar`
- **THEN** the content script posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId: "garmin-bridge", extensionId: "<runtime-id>", capabilities: ["write:workouts"] }` to `window`

#### Scenario: Train2Go Bridge announces on localhost

- **WHEN** the Train2Go Bridge extension is installed and the user navigates to `http://localhost:5173/`
- **THEN** the content script posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId: "train2go-bridge", extensionId: "<runtime-id>", capabilities: ["read:training-plan"] }` to `window`

#### Scenario: Extension not installed

- **WHEN** no bridge extensions are installed
- **THEN** no announcements are posted and the SPA receives no bridge messages

### Requirement: Re-announcement on discovery request

The content script SHALL listen for `KAIORD_BRIDGE_DISCOVER` messages on `window`. When received, the content script SHALL re-post its announcement.

#### Scenario: SPA requests discovery after late load

- **WHEN** the SPA posts `{ type: "KAIORD_BRIDGE_DISCOVER" }` to `window`
- **THEN** all installed bridge content scripts re-post their `KAIORD_BRIDGE_ANNOUNCE` messages

### Requirement: SPA bridge discovery listener

The SPA SHALL listen for `KAIORD_BRIDGE_ANNOUNCE` messages on `window` at application boot. When an announcement is received, the SPA SHALL validate the message structure and use the `extensionId` from the announcement for all subsequent `chrome.runtime.sendMessage` calls to that bridge.

#### Scenario: SPA discovers Garmin Bridge

- **WHEN** the SPA receives a `KAIORD_BRIDGE_ANNOUNCE` with `bridgeId: "garmin-bridge"`
- **THEN** the SPA uses the announced `extensionId` for ping, push, and list operations

#### Scenario: SPA discovers multiple bridges

- **WHEN** the SPA receives announcements from both Garmin and Train2Go bridges
- **THEN** both bridges are registered with their respective `extensionId` values

#### Scenario: No announcements received

- **WHEN** no `KAIORD_BRIDGE_ANNOUNCE` messages arrive within 3 seconds
- **THEN** the SPA posts `{ type: "KAIORD_BRIDGE_DISCOVER" }` and waits 2 more seconds before concluding no bridges are installed

#### Scenario: Spoofed announcement rejected

- **WHEN** the SPA receives an announcement and sends a verification ping to the announced `extensionId`
- **THEN** the SPA only registers the bridge if the ping response matches the expected protocol
