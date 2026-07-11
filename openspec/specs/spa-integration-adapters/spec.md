> Synced: 2026-07-11 (add-shared-bridge-core)

# SPA Integration Adapters

## Purpose

SPA-side contract for integration data access: named application-layer port
types for the operations `CoachingTransport` does not cover, per-integration
adapter placement under `adapters/<integration>/`, and encapsulation of
`chrome.runtime` messaging inside the shared bridge transport layer.

## Requirements

### Requirement: Named per-data-type integration ports

The SPA SHALL define integration data access as named port types in the
application layer, one per `(dataType, direction)` operation the SPA
performs. The existing `CoachingTransport` port
(`application/coaching/coaching-transport-port.ts`) remains the contract for
coaching-plan and training-zones reads; the operations it does not cover
(fetch activities, push workout, push profile snapshot) SHALL be declared in
`application/integrations/integration-ports.ts`. Ports SHALL be plain
function/object types over existing domain/protocol DTOs — no classes, no
runtime code in the port module. Per-integration adapters SHALL implement
these ports; consumers (hooks, contexts, use cases) SHALL depend on the port
types, not on concrete adapter modules' internal shapes.

#### Scenario: Garmin activities adapter implements its port

- **WHEN** the SPA needs a garmin activities read
- **THEN** it invokes an implementation of the activities-fetch port type exported by the garmin adapter, and the call compiles against the port signature

#### Scenario: Policy gating is unchanged by ports

- **GIVEN** an integration port implementation is registered for a data type
- **WHEN** the SPA decides whether to surface the corresponding affordance
- **THEN** the decision SHALL still flow through `resolveImportPolicies`/`resolveExportPolicies` per `spa-bridge-protocol`, not through port presence

### Requirement: Integration adapter placement

Integration-specific adapter modules SHALL live under
`packages/workout-spa-editor/src/adapters/<integration>/` (e.g.
`adapters/garmin/`, `adapters/train2go/`). The `adapters/bridge/` directory
SHALL contain only integration-agnostic transport and lifecycle code
(message transport, discovery, verification, operation queue).

#### Scenario: Garmin transport module lives in its integration directory

- **WHEN** looking up the garmin activities transport
- **THEN** it is found under `adapters/garmin/`, and `adapters/bridge/` contains no module specific to a single integration

### Requirement: Bridge transport encapsulation

SPA code outside `adapters/bridge/` MUST NOT invoke `chrome.runtime`
messaging APIs (`sendMessage`, `connect`); only modules under
`adapters/bridge/` MAY call them. Integration adapters and all other SPA
code SHALL reach extensions exclusively through the shared transport
(`sendBridgeMessage`) and operation queue. This constraint SHALL be enforced
by a test-time assertion over `packages/workout-spa-editor/src`.

#### Scenario: Integration adapter uses the shared transport

- **WHEN** the train2go zones adapter fetches zones
- **THEN** the extension round-trip goes through `sendBridgeMessage`, and the encapsulation assertion passes

#### Scenario: Direct chrome.runtime call outside the transport layer is rejected

- **WHEN** a module outside `adapters/bridge/` calls `chrome.runtime.sendMessage`
- **THEN** the transport-encapsulation test SHALL fail, naming the offending file
