## MODIFIED Requirements

### Requirement: Train2Go extension detection

The SPA SHALL continue to detect the Train2Go bridge via the existing discovery lifecycle (announcement + ping + heartbeat + 30s cache). No change to the detection protocol.

`extensionInstalled` SHALL continue to track VERIFIED / UNAVAILABLE state. It MUST NOT gate zones-sync triggering — zones import SHALL be governed by `IntegrationPolicy` rows resolved via `resolveImportPolicies` (plan T-19).

#### Scenario: Detection does not trigger zones sync

- **WHEN** `detectExtension` fires (app boot, heartbeat, or visibility change) and the Train2Go bridge is found VERIFIED
- **THEN** `extensionInstalled` and `sessionActive` are updated as before
- **AND** no zones import is triggered solely by detection — zones auto-import is governed by `resolveImportPolicies(profileId, 'training-zones')` with `mode: 'auto'` filter, not by `detectExtension` completing

### Requirement: `CoachingTransport` exposes an optional `readZones` capability

The `CoachingTransport` port SHALL retain the optional `readZones?: (externalUserId: string, signal?: AbortSignal) => Promise<ZonesPayload | null>` method unchanged. The caller change is that the `mode: 'auto'` zones import SHALL be triggered by the SPA-mount import lifecycle for any `IntegrationPolicy` row with `dataType: 'training-zones'`, `direction: 'import'`, `mode: 'auto'`, `enabled: true` (plan T-19), rather than by the deprecated `syncZones` flag fan-out in `useConnectCallback` / `useSyncCallback`.

#### Scenario: Auto-import fires on SPA mount when policy row exists

- **GIVEN** the active profile has an enabled `IntegrationPolicy` row for `(dataType: 'training-zones', bridgeId: 'train2go-bridge', direction: 'import', mode: 'auto')`
- **AND** the Train2Go bridge is VERIFIED
- **WHEN** the SPA mounts
- **THEN** `resolveImportPolicies(profileId, 'training-zones')` returns the row
- **AND** the zones import fires once per SPA mount, deduplicating via natural-key upsert (C-3)

#### Scenario: Auto-import does not fire when no policy row

- **GIVEN** the active profile has no `IntegrationPolicy` row for `(dataType: 'training-zones', direction: 'import')`
- **WHEN** the SPA mounts with the Train2Go bridge VERIFIED
- **THEN** no zones import is triggered

#### Scenario: Manual import policy row requires explicit user action

- **GIVEN** the active profile has an `IntegrationPolicy` row for `(dataType: 'training-zones', bridgeId: 'train2go-bridge', direction: 'import', mode: 'manual')`
- **WHEN** the SPA mounts
- **THEN** no zones import is triggered automatically; a user-facing affordance in the Data Flows section allows the user to trigger it manually

### Requirement: `LinkedAccountRow` exposes the `Sync zones` toggle

This requirement is superseded. The `LinkedAccountRow` SHALL NOT expose a `Sync zones` toggle. Zone-sync configuration MUST be performed via the Data Flows section in ProfileManager (see ADDED Requirements below). The `syncZones` field SHALL be removed from `linkedCoachingAccountSchema` at the Zod schema layer (plan T-08); the Dexie column remains nullable in v17 as a rollback buffer and is dropped in v18 (F-4).

#### Scenario: No Sync zones toggle in LinkedAccountRow after migration

- **WHEN** the user opens ProfileManager and views a linked Train2Go account after the v17 upgrade
- **THEN** the `LinkedAccountRow` SHALL NOT show a `Sync zones` checkbox or switch
- **AND** the existing authentication and identity controls (connect, disconnect) SHALL remain unchanged

## ADDED Requirements

### Requirement: Data Flows configuration for training-zones import

The ProfileManager **Data Flows** section SHALL expose the `training-zones` data type group with a Sources subsection. The Train2Go bridge SHALL appear as an available source when `MANAGED_DATA_REGISTRY['training-zones'].capabilities.import` resolves to a token present in the Train2Go manifest's `capabilities` array.

Users can add, enable/disable, and set the mode (`manual` / `auto`) for the `training-zones` import policy row from this surface. The prior `SyncZonesToggle` in `LinkedAccountRow` is deleted; this is the replacement.

#### Scenario: Data Flows section shows training-zones group when train2go-bridge is discovered

- **GIVEN** the Train2Go bridge is VERIFIED and the active profile has an `IntegrationPolicy` row for `(dataType: 'training-zones', bridgeId: 'train2go-bridge', direction: 'import', mode: 'auto', enabled: true)`
- **WHEN** the user opens ProfileManager > Data Flows > training-zones
- **THEN** the group shows one source row for `train2go-bridge` with mode `auto` and enabled state on
- **AND** no `Sync zones` toggle appears in the `LinkedAccountRow`

#### Scenario: Migrated profile row appears in Data Flows after v17 upgrade

- **GIVEN** a profile had `syncZones: true` before the v17 Dexie migration
- **WHEN** the user opens ProfileManager > Data Flows > training-zones after the upgrade
- **THEN** a source row for `train2go-bridge` with `mode: 'auto'` and `enabled: true` is visible
- **AND** the user can toggle mode or disable it from this surface
