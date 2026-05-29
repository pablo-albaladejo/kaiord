## MODIFIED Requirements

### Requirement: Bridge manifest for protocol discovery

The Train2Go bridge's `BRIDGE_MANIFEST.capabilities` array SHALL continue to include `"read:training-plan"` and `"read:training-zones"`. These tokens remain the bridge's declaration of what it _can_ do. No change to the manifest or announcement protocol.

The prior spec stated that the SPA gates the `Sync zones` toggle on the presence of `"read:training-zones"` in the manifest's `capabilities` array. This coupling is superseded. Policy authority for zones import moves to `IntegrationPolicy`; the bridge protocol is unchanged.

#### Scenario: Manifest continues to expose both capabilities

- **GIVEN** a bridge build that ships the `read-details` action
- **WHEN** the SPA fetches the bridge's `ping` response
- **THEN** the response data SHALL include `capabilities` containing both `"read:training-plan"` and `"read:training-zones"`
- **AND** the SPA SHALL register both capability tokens via the bridge registry as before
- **AND** the SPA SHALL NOT gate any user-facing zones-sync UI directly on capability presence — zones import is governed by `IntegrationPolicy` rows (plan T-19)

#### Scenario: Older bridge without read:training-zones — behavior unchanged

- **GIVEN** the bridge response advertises `capabilities: ["read:training-plan"]` only (older extension not yet updated)
- **WHEN** the SPA renders the profile's Data Flows section
- **THEN** the `training-zones` import row for `train2go-bridge`, if present, renders as disabled with a "Bridge not installed / capability unavailable" hint
- **AND** the `IntegrationPolicy` row is NOT deleted (C-8)

### Requirement: `LinkedAccountRow` exposes the `Sync zones` toggle

This requirement is superseded. The `LinkedAccountRow` MUST NOT expose a `Sync zones` toggle. Zone-sync configuration SHALL move to the **Data Flows** section in ProfileManager under the `training-zones` data type group (plan T-23).

Profiles that previously had `syncZones: true` SHALL be migrated to an enabled `IntegrationPolicy` row (`dataType: 'training-zones'`, `bridgeId: 'train2go-bridge'`, `direction: 'import'`, `mode: 'auto'`, `enabled: true`) by the Dexie v17 upgrade (plan T-12). No user action is required.

#### Scenario: Zone auto-import gated on IntegrationPolicy, not syncZones

- **GIVEN** a profile was migrated from `syncZones: true` to an enabled auto-import `IntegrationPolicy` row for `(dataType: 'training-zones', bridgeId: 'train2go-bridge', direction: 'import', mode: 'auto')`
- **WHEN** the SPA mounts and the Train2Go bridge is VERIFIED
- **THEN** the zones import fires once per SPA mount, deduplicating via the natural-key upsert (C-3), with no user-visible change in behavior relative to the prior `syncZones=true` state

#### Scenario: No syncZones toggle in LinkedAccountRow

- **WHEN** the user opens Profile Manager and views a linked Train2Go account
- **THEN** the `LinkedAccountRow` SHALL NOT show a `Sync zones` checkbox or switch
- **AND** authentication / identity / unlink controls SHALL remain unchanged (A-7)

## REMOVED Requirements

### Requirement: Train2Go connect callback fans out into a zones sync when toggle is on

This requirement is superseded. The `syncZones`-flag-driven fan-out in `useConnectCallback` is removed. Zone sync on connect is now governed by the `IntegrationPolicy` row for `training-zones` created at migration time or via the Data Flows UI. If the row exists with `mode: 'auto'` and `enabled: true`, the SPA-mount trigger fires on the next app load.

### Requirement: Train2Go sync callback fans out into a zones sync after the weekly read

This requirement is superseded. The `syncZones`-flag-gated fan-out in `useSyncCallback` is removed. Zone-sync auto-triggers are now governed by the `IntegrationPolicy` resolver layer (plan T-19).
