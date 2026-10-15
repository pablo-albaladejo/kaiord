## MODIFIED Requirements

### Requirement: Bridge manifest for protocol discovery

The Train2Go bridge's `BRIDGE_MANIFEST.capabilities` array SHALL include `"read:training-plan"`, `"read:training-zones"` and `"read:body"`. These tokens remain the bridge's declaration of what it _can_ do: `read:body` declares the athlete's weight, which the `read-details` action already returns in its `physiological` block. The announce identity in `bridge-identity.js` SHALL carry the same capabilities, enforced by the bridge-core parity guard. No new action and no protocol version bump.

The prior spec stated that the SPA gates the `Sync zones` toggle on the presence of `"read:training-zones"` in the manifest's `capabilities` array. This coupling is superseded. Policy authority for zones import moves to `IntegrationPolicy`; the bridge protocol is unchanged.

#### Scenario: Manifest exposes the plan, zones and body capabilities

- **GIVEN** a bridge build that ships the `read-details` action
- **WHEN** the SPA fetches the bridge's `ping` response
- **THEN** the response data SHALL include `capabilities` containing `"read:training-plan"`, `"read:training-zones"` and `"read:body"`
- **AND** the page announcement SHALL carry the same capabilities
- **AND** the SPA SHALL register the capability tokens via the bridge registry as before
- **AND** the SPA SHALL NOT gate any user-facing zones-sync UI directly on capability presence — zones import is governed by `IntegrationPolicy` rows

#### Scenario: Older bridge without read:training-zones — behavior unchanged

- **GIVEN** the bridge response advertises `capabilities: ["read:training-plan"]` only (older extension not yet updated)
- **WHEN** the SPA renders the profile's Data Flows section
- **THEN** the `training-zones` import row for `train2go-bridge`, if present, renders as disabled with a "Bridge not installed / capability unavailable" hint
- **AND** the `IntegrationPolicy` row is NOT deleted (C-8)

#### Scenario: Older bridge without read:body offers no weight route

- **GIVEN** the bridge advertises `["read:training-plan", "read:training-zones"]` (released before the weight route)
- **WHEN** the Connections section derives Train2Go's routes
- **THEN** no `weight` route SHALL be offered for `train2go-bridge`
- **AND** the zones sync SHALL keep recording the weight as it did before the route existed
