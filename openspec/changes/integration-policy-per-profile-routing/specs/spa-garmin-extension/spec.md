## MODIFIED Requirements

### Requirement: Extension detection

The SPA SHALL continue to set `extensionInstalled: boolean` via the bridge-discovery lifecycle (announcement + ping + heartbeat). The detection protocol is unchanged.

`extensionInstalled` SHALL govern only bridge-lifecycle state (VERIFIED / UNAVAILABLE / REMOVED) and the "Bridge not installed" hint on existing `IntegrationPolicy` rows. It MUST NOT be used as the sole gate for push-affordance visibility; push affordance visibility MUST be determined by `resolveExportPolicies(profileId, 'workout')` (plan T-18).

#### Scenario: Extension installed and session active — state tracked, not used for affordance gate

- **WHEN** the SPA receives a bridge announcement and the verification ping returns `{ ok: true, protocolVersion: 1, data: { gcApi: { ok: true } } }`
- **THEN** the SPA state is set to `extensionInstalled: true, sessionActive: true` as before
- **AND** the push affordance visibility is determined by `resolveExportPolicies(profileId, 'workout')`, not by `extensionInstalled` alone

#### Scenario: Extension not installed — policy rows remain

- **WHEN** no `KAIORD_BRIDGE_ANNOUNCE` with `bridgeId: "garmin-bridge"` is received within the discovery timeout
- **THEN** the SPA state is set to `extensionInstalled: false, sessionActive: false`
- **AND** any existing `IntegrationPolicy` rows referencing `garmin-bridge` are NOT deleted — they render as disabled with a "Bridge not installed" hint in the Data Flows section

### Requirement: Push workout via extension

The `GarminPushButton` SHALL be visible if and only if `resolveExportPolicies(activeProfileId, 'workout')` returns at least one enabled `IntegrationPolicy` row. Bridge-discovery state is a secondary check: if the row exists but the bridge is not currently VERIFIED, the button renders as disabled with a hint rather than hidden.

The prior requirement gated the button on `extensionInstalled && sessionActive`. This coupling is removed (plan T-18). The push operation itself (`{ action: "push", gcn: payload }`) is unchanged.

#### Scenario: Push button shown when policy row exists and bridge is verified

- **GIVEN** `resolveExportPolicies(profileId, 'workout')` returns an enabled row for `garmin-bridge`
- **AND** the Garmin Bridge is in VERIFIED state
- **WHEN** the workout editor renders
- **THEN** the `GarminPushButton` is visible and enabled

#### Scenario: Push button hidden when no policy row exists

- **GIVEN** `resolveExportPolicies(profileId, 'workout')` returns an empty array for the active profile
- **WHEN** the workout editor renders
- **THEN** the `GarminPushButton` is NOT rendered, regardless of `extensionInstalled` state

#### Scenario: Push button disabled with hint when policy row exists but bridge unavailable

- **GIVEN** `resolveExportPolicies(profileId, 'workout')` returns an enabled row for `garmin-bridge`
- **AND** the Garmin Bridge is UNAVAILABLE or not detected
- **WHEN** the workout editor renders
- **THEN** the `GarminPushButton` renders as disabled with a "Bridge not installed" hint

### Requirement: Garmin store redesign

The Zustand Garmin store SHALL retain its existing fields: `extensionInstalled`, `sessionActive`, `pushing`, `lastError`, and `lastDetectionTimestamp`. The store MUST NOT gain a `policies` field — policy state SHALL be read from Dexie via the resolver use cases, not from the Zustand store.

#### Scenario: Store does not control push affordance visibility

- **WHEN** `extensionInstalled` is `false` in the Garmin store
- **THEN** an existing `IntegrationPolicy` row for `(profileId, 'workout', 'export', 'garmin-bridge')` still causes the `GarminPushButton` to render as disabled with a hint, rather than being hidden entirely
