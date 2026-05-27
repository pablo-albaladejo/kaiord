## MODIFIED Requirements

### Requirement: Runtime extension ID announcement on SPA origins

The Garmin Bridge announcement payload SHALL continue to include `capabilities: ["write:workouts"]`. This token remains the bridge's declaration of what it _can_ do. No change to the announcement protocol.

The prior spec stated that the SPA shows "Push to Garmin" UI based on the presence of `write:workouts` in the detected manifest. This coupling is superseded by the policy resolver (see `spa-bridge-protocol` delta, Requirement: Policy resolution). The bridge protocol is unchanged; the SPA-side consumption is what changes.

#### Scenario: Garmin Bridge announces write:workouts capability

- **WHEN** the Garmin Bridge extension is installed and announces via content script
- **THEN** the announcement SHALL include `capabilities: ["write:workouts"]`
- **AND** the SPA SHALL register the bridge as VERIFIED via the existing ping/verify flow
- **AND** the SPA SHALL NOT use capability presence alone to show the push affordance — it SHALL additionally require at least one enabled `IntegrationPolicy` row via `resolveExportPolicies(profileId, 'workout')` (plan T-18)

### Requirement: Push workout via extension

The `GarminPushButton` component SHALL gate its visibility on `resolveExportPolicies(activeProfileId, 'workout')` returning at least one enabled `IntegrationPolicy` row, in addition to requiring the bridge to be currently discovered (VERIFIED state). Consulting `extensionInstalled` directly for affordance visibility is superseded.

The push operation itself (`{ action: "push", gcn: payload }`) is unchanged.

When a policy row exists but the `garmin-bridge` is not currently discovered (UNAVAILABLE or REMOVED), the push affordance SHALL render as disabled with a "Bridge not installed" hint rather than being hidden entirely. The `IntegrationPolicy` row is not deleted on bridge uninstall (C-8).

#### Scenario: Push affordance visible when policy row exists and bridge is discovered

- **GIVEN** the active profile has an enabled `IntegrationPolicy` row for `(dataType: 'workout', direction: 'export', bridgeId: 'garmin-bridge')`
- **AND** the Garmin Bridge is currently in VERIFIED state
- **WHEN** the workout editor renders
- **THEN** the `GarminPushButton` is visible and enabled

#### Scenario: Push affordance hidden when no policy row exists

- **GIVEN** the active profile has no `IntegrationPolicy` row for `(dataType: 'workout', direction: 'export')`
- **WHEN** the workout editor renders
- **THEN** the `GarminPushButton` is NOT shown, even if the Garmin Bridge is VERIFIED

#### Scenario: Push affordance disabled when policy row exists but bridge not installed

- **GIVEN** the active profile has an enabled `IntegrationPolicy` row for `(dataType: 'workout', direction: 'export', bridgeId: 'garmin-bridge')`
- **AND** the Garmin Bridge is not currently discovered (UNAVAILABLE or no announcement received)
- **WHEN** the workout editor renders
- **THEN** the `GarminPushButton` renders as disabled with a "Bridge not installed" hint
