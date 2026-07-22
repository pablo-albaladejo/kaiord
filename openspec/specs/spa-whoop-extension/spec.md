> Synced: 2026-07-22 (rewrite-whoop-session-bridge)

# spa-whoop-extension Specification

## Purpose

TBD - created by archiving change rewrite-whoop-session-bridge. Update Purpose after archive.

## Requirements

### Requirement: WHOOP bridge discovery reuses the generic protocol

The SPA SHALL discover the `whoop-bridge` extension through the existing
`bridge-runtime-discovery` and `spa-bridge-protocol` capabilities: it listens
for a `KAIORD_BRIDGE_ANNOUNCE` with `bridgeId: "whoop-bridge"`, verifies it with
a `ping`, and tracks its VERIFIED / UNAVAILABLE / REMOVED lifecycle via the
shared heartbeat. No WHOOP-specific discovery, build-time extension id, or new
bridge infrastructure SHALL be introduced.

#### Scenario: WHOOP bridge discovered at runtime

- **WHEN** the `whoop-bridge` extension announces and its verification ping returns `{ ok: true, protocolVersion: 1, data: { id: "whoop-bridge", capabilities: [...] } }`
- **THEN** the SPA registers the bridge as VERIFIED via the shared bridge protocol

#### Scenario: WHOOP bridge not installed

- **WHEN** no `whoop-bridge` announcement is received within the discovery timeout
- **THEN** the SPA shows WHOOP as not installed and any existing WHOOP `IntegrationPolicy` rows render disabled with a "Bridge not installed" hint, unchanged from every other bridge

### Requirement: WHOOP read transport over the bridge relay

The SPA SHALL provide a read transport that fulfills `@kaiord/whoop`'s injected
read port by relaying `whoop-fetch` messages to the discovered `whoop-bridge`
and returning the parsed result. The transport SHALL only issue reads whose
paths are on the bridge's allowlist; it SHALL NOT hold or forward any token
(the token stays in the extension).

#### Scenario: Transport relays a read

- **WHEN** a sync use case requests an allowed WHOOP read through the transport
- **THEN** the transport sends `{ action: "whoop-fetch", path: "<allowed path>" }` to the `whoop-bridge` and resolves with the relayed `{ ok, status, data }`

#### Scenario: Transport surfaces a bridge error

- **WHEN** the bridge returns `{ ok: false, error: "No session token captured — open app.whoop.com and reload it." }`
- **THEN** the transport SHALL propagate a typed error carrying that message, and SHALL persist nothing

### Requirement: WHOOP data sync into the managed stores

The SPA SHALL provide sync use cases that pull WHOOP data for a bounded window
through the transport, convert via `@kaiord/whoop`, and upsert the results
stamped `sourceBridgeId: "whoop-bridge"`. Two gating regimes apply:

- **Managed-data-type imports** (each a `ManagedDataType` with an
  `IntegrationPolicy` row): `cycles/details` → HRV, sleep, vitals, strain, and
  `activity` records; `metrics-service` → heart-rate-series; `stress-bff` →
  stress-episode. Each SHALL be a no-op when no enabled WHOOP import policy
  exists for that data type and SHALL be gated by the policy resolver exactly
  like every other import bridge.
- **Advanced-Labs import** (the `lab` domain, which is NOT a `ManagedDataType`
  and has no `IntegrationPolicy` representation): biomarker tests → lab reports
  follow the existing labs-import path (as the AI lab-extraction feature does),
  a user-initiated import that requires the WHOOP bridge to be VERIFIED but is
  NOT gated by the policy resolver. It SHALL NOT claim policy-resolver parity.

All syncs SHALL chunk windows longer than the internal BFF limit. Which data
types are wired is delivered per implementation wave; the transport and upsert
path are shared across all of them.

#### Scenario: Cycles sync persists WHOOP health and activity records

- **GIVEN** enabled WHOOP import policies for the recovery/HRV, sleep, vitals, strain, and activity data types and a VERIFIED `whoop-bridge`
- **WHEN** the cycles sync runs for a window returning two cycles, each with a workout
- **THEN** the SPA SHALL persist the converted HRV, sleep, vitals, and strain records and the two `activity` records, all stamped `sourceBridgeId: "whoop-bridge"`

#### Scenario: Sync is a no-op without an import policy

- **GIVEN** no enabled WHOOP `IntegrationPolicy` import row for a data type
- **WHEN** a WHOOP sync for that data type is requested
- **THEN** no read SHALL be issued and no record SHALL be persisted

#### Scenario: Long window is chunked

- **WHEN** the requested window exceeds the internal BFF's maximum span
- **THEN** the use case SHALL issue multiple bounded reads and merge their results rather than a single over-long request

#### Scenario: Records dedupe on re-sync

- **GIVEN** a prior sync already persisted a WHOOP record for a cycle/day
- **WHEN** the same window is synced again
- **THEN** the record SHALL be upserted by its stable `(sourceBridgeId, externalId)` identity, not duplicated

#### Scenario: Labs import is not policy-resolver gated

- **GIVEN** a VERIFIED `whoop-bridge` and no `IntegrationPolicy` row for labs (labs is not a `ManagedDataType`)
- **WHEN** the user triggers an Advanced-Labs import
- **THEN** the biomarker tests SHALL import into the `lab` domain with WHOOP provenance without consulting the policy resolver, and no managed-store gating SHALL be required

### Requirement: WHOOP connect and disconnect via the bridge

The Athlete Connections section SHALL treat WHOOP as a `bridge` provider:
"Connect" SHALL open an `app.whoop.com` tab (so the user's session is present
for capture) and the row SHALL reflect the bridge's discovered session status;
"Disconnect" SHALL clear the local WHOOP bridge linkage, set the connection
record to `disconnected`, and disable WHOOP's `IntegrationPolicy` flows. No
WHOOP credential SHALL be stored at any point.

#### Scenario: Connect opens the WHOOP tab

- **WHEN** the user clicks Connect on the WHOOP row
- **THEN** the SPA opens an `app.whoop.com` tab and the row reflects the bridge session status once discovery/ping resolves

#### Scenario: Disconnect clears linkage and disables flows

- **WHEN** the user disconnects WHOOP
- **THEN** the local bridge linkage is cleared, the connection record is set to `disconnected`, and WHOOP's import flow policies are disabled
- **AND** no stored credential is left behind (none was ever stored)

### Requirement: No WHOOP credentials or tokens in the SPA

The SPA SHALL NOT store a WHOOP client id, secret, or session token in any
persistence, and the WHOOP integration SHALL NOT write to the encrypted
credential store. Only relayed read results (converted records) SHALL cross
from the bridge into SPA persistence.

#### Scenario: No WHOOP secret in persistence

- **WHEN** the SPA persistence is inspected after a WHOOP connect and sync
- **THEN** it SHALL contain WHOOP-sourced records but no WHOOP credential or token
