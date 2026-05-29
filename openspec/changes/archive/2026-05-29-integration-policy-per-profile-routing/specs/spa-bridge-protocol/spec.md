## MODIFIED Requirements

### Requirement: Typed bridge capabilities

The system SHALL define bridge capability tokens as opaque strings declared in bridge manifests. The SPA SHALL resolve `(profile, dataType, direction)` tuples into enabled bridges by querying `IntegrationPolicy` rows through the resolver use cases (`resolveImportPolicies` / `resolveExportPolicies`), NOT by reading `extensionInstalled` state or raw capability tokens directly.

`bridgeCapabilitySchema` remains the SPA-layer vocabulary guard. A runtime SPA-side assertion (in `bridge-schemas.test.ts`) SHALL fail if any capability token referenced by `MANAGED_DATA_REGISTRY` is absent from `bridgeCapabilitySchema`. `@kaiord/core`'s `MANAGED_DATA_REGISTRY` stores capability tokens as opaque strings and MUST NOT import `bridgeCapabilitySchema` — the cross-check is a SPA-layer concern enforced at test time, not at compile time.

The prior requirement stated: "the SPA SHALL adapt its UI based on detected capabilities (e.g., 'Push to Garmin' only shown if a bridge with `write:workouts` is registered)." This is superseded. UI affordances are now gated on resolver results (see Requirement: Policy resolution below), not on raw capability-token presence.

#### Scenario: Bridge with write:workouts capability does not directly gate push affordance

- **WHEN** a bridge registers with capability `write:workouts`
- **THEN** the SPA SHALL NOT show the push affordance based on that capability alone; the push affordance MUST also require at least one enabled `IntegrationPolicy` row for `(activeProfileId, dataType: 'workout', direction: 'export')` via `resolveExportPolicies`

#### Scenario: No bridges installed

- **WHEN** no bridge extensions are detected
- **THEN** the SPA SHALL function as a standalone editor with no bridge-related UI elements; `IntegrationPolicy` rows for uninstalled bridges remain stored and render as disabled with a "Bridge not installed" hint (per C-8)

## ADDED Requirements

### Requirement: Policy resolution

The SPA SHALL resolve per-profile import and export intentions through a resolver layer, not through raw bridge-capability inspection. For any `(profileId, dataType, direction)` triple, the resolver queries the `integrationPolicies` Dexie store and returns the matching `IntegrationPolicy` rows.

- `resolveImportPolicies(profileId, dataType): Promise<IntegrationPolicy[]>` — returns all rows where `direction = 'import'` for the given profile and data type.
- `resolveExportPolicies(profileId, dataType): Promise<IntegrationPolicy[]>` — returns all rows where `direction = 'export'` for the given profile and data type.

Both resolvers return rows regardless of `enabled` state. Callers filter by `enabled` and `mode` as needed. Bridge-discovery state (VERIFIED / UNAVAILABLE) is consulted at the affordance layer, not inside the resolver.

An `IntegrationPolicy` row references a bridge by stable `BridgeId` string. A row whose referenced bridge is not currently discovered SHALL NOT be deleted; the affordance SHALL render the row as disabled with a "Bridge not installed" hint.

#### Scenario: Resolver returns all rows for a profile and data type

- **GIVEN** a profile has two `IntegrationPolicy` rows for `(dataType: 'weight', direction: 'import')` — one enabled for `garmin-bridge` and one disabled for a hypothetical `fitbit-bridge`
- **WHEN** `resolveImportPolicies(profileId, 'weight')` is called
- **THEN** both rows are returned; the caller decides how to filter by `enabled`

#### Scenario: Policy row survives bridge uninstall

- **GIVEN** a profile has an enabled `IntegrationPolicy` row for `(dataType: 'workout', direction: 'export', bridgeId: 'garmin-bridge')`
- **WHEN** the Garmin Bridge extension is uninstalled and bridge discovery produces no `garmin-bridge` entry
- **THEN** the `IntegrationPolicy` row remains in the `integrationPolicies` store unchanged
- **AND** the push affordance renders as disabled with a "Bridge not installed" hint rather than disappearing

#### Scenario: No policies means no affordance

- **WHEN** `resolveExportPolicies(profileId, 'workout')` returns an empty array
- **THEN** the push affordance for `workout` exports SHALL NOT be shown for that profile
