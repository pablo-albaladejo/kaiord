> Synced: 2026-05-29

# SPA Bridge Protocol

## Purpose

Transport and lifecycle contract between the workout editor and any bridge Chrome extension: ping manifest, response envelope, rate limits, per-bridge operation queue, and heartbeat-based VERIFIED/UNAVAILABLE/REMOVED state machine.

## Requirements

### Requirement: Bridge capability manifest

Each bridge extension SHALL respond to a `ping` action with a capability manifest containing: id, name, version, protocolVersion, and a capabilities array of typed strings.

#### Scenario: SPA pings a bridge

- **WHEN** the SPA sends `{ action: "ping" }` to a bridge extension via `chrome.runtime.sendMessage`
- **THEN** the bridge SHALL respond with `{ ok: true, protocolVersion: N, data: { id, name, version, capabilities } }`

### Requirement: Bridge response validation

Ping responses used for bridge registration SHALL be validated against the BridgeManifest Zod schema before registration. Responses that fail validation SHALL be rejected.

#### Scenario: Malformed manifest response

- **WHEN** a bridge responds to a ping with a response that does not match the BridgeManifest schema (e.g., missing `capabilities` field)
- **THEN** the SPA SHALL reject the response, NOT register the bridge, and log a warning

### Requirement: Bridge error response schema

Bridge error responses SHALL follow a consistent schema: `{ ok: false, error: string, code?: string, retryable?: boolean }`.

#### Scenario: Bridge operation fails

- **WHEN** a bridge operation (push, list) fails
- **THEN** the bridge SHALL respond with `{ ok: false, error: "<description>", retryable: true|false }` and the SPA SHALL display the error message to the user

### Requirement: Hourly rate limit per bridge

The SPA SHALL NOT send more than 60 operations per hour per bridge. If the limit is reached, queued operations SHALL be paused with user notification.

#### Scenario: Rate limit reached

- **WHEN** the SPA has sent 60 operations to a bridge within the last hour
- **THEN** queued operations SHALL be paused and the user SHALL see "Rate limit reached for [bridge name]. Try again in X minutes."

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

### Requirement: Bridge lifecycle management

The SPA SHALL maintain bridge status through periodic heartbeat checks. Bridges SHALL transition between VERIFIED, UNAVAILABLE, and REMOVED states.

#### Scenario: Heartbeat success

- **WHEN** the SPA pings a registered bridge every 60 seconds and receives a response
- **THEN** the bridge status SHALL remain VERIFIED and `lastSeen` SHALL be updated in syncState

#### Scenario: Heartbeat failure

- **WHEN** a registered bridge fails to respond to 3 consecutive heartbeat pings
- **THEN** the bridge status SHALL transition to UNAVAILABLE and bridge-related UI SHALL be disabled

#### Scenario: Bridge pruning

- **WHEN** a bridge has been UNAVAILABLE for more than 24 hours
- **THEN** the bridge SHALL be REMOVED from the registry and a toast notification SHALL inform the user

### Requirement: Per-bridge operation queue

The SPA SHALL maintain a separate operation queue per bridge with a concurrency of 1. Batch operations SHALL use a configurable delay (default 500ms) between items with exponential backoff on HTTP 429 responses.

#### Scenario: Batch push to Garmin

- **WHEN** the user pushes 5 workouts to Garmin Connect
- **THEN** the SPA SHALL send one push request at a time with 500ms between requests, independent of any concurrent AI processing

#### Scenario: Rate limit response

- **WHEN** a bridge operation receives an HTTP 429 response
- **THEN** the SPA SHALL apply exponential backoff before retrying the operation

### Requirement: Bridge discovery via runtime announcement

Bridge extensions SHALL announce their presence at runtime via `window.postMessage` from injected content scripts (see the `bridge-runtime-discovery` capability). The SPA SHALL discover bridges by listening for `KAIORD_BRIDGE_ANNOUNCE` messages and verifying each announcement with a ping before registering the bridge as VERIFIED. No build-time Vite environment variables (e.g., `VITE_GARMIN_EXTENSION_ID`, `VITE_TRAIN2GO_EXTENSION_ID`) are required or consulted.

#### Scenario: Garmin bridge discovered at runtime

- **WHEN** the Garmin Bridge extension is installed and announces via content script
- **THEN** the SPA SHALL detect the bridge via the announcement, verify with a ping, and register it as VERIFIED

#### Scenario: Bridge extension not installed

- **WHEN** no bridge extension announces and the discovery timeout expires
- **THEN** the SPA SHALL not show bridge-related UI for that platform

### Requirement: Protocol version compatibility

The SPA SHALL define a minimum supported protocol version per capability. Bridges reporting a lower version SHALL trigger a user-visible "Update your extension" warning.

#### Scenario: Outdated bridge version

- **WHEN** a bridge responds with `protocolVersion: 1` but the SPA requires version 2 for `write:workouts`
- **THEN** the SPA SHALL display "Update your Garmin extension" and disable push operations for that bridge
