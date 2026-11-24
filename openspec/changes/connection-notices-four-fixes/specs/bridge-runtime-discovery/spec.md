## MODIFIED Requirements

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
- **THEN** the SPA only registers the bridge if the ping response:
  - validates against the BridgeManifest schema,
  - has a compatible `protocolVersion`, and
  - has `data.id` equal to the announced `bridgeId`
- **AND** if any check fails, the SPA SHALL reject the announcement and not register the bridge

#### Scenario: An extension on a protocol the App does not accept is remembered as outdated

- **WHEN** a genuine announcement's verification ping reports a `protocolVersion` outside the versions the App accepts for that extension
- **THEN** the SPA SHALL NOT register the bridge, and SHALL remember it as outdated, so its Connection shows the Update notice rather than Install
