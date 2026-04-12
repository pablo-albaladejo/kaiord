## MODIFIED Requirements

### Requirement: Extension ping response includes capability manifest

The garmin-bridge extension SHALL include a capability manifest in its ping response, declaring its bridge ID, name, version, protocol version, and supported capabilities.

#### Scenario: SPA pings garmin-bridge

- **WHEN** the SPA sends `{ action: "ping" }` to the garmin-bridge extension
- **THEN** the extension SHALL respond with `{ ok: true, protocolVersion: 1, data: { id: "garmin-bridge", name: "Garmin Connect", version: "<current>", capabilities: ["write:workouts"] } }` in addition to the existing session status fields

#### Scenario: Backward compatibility

- **WHEN** an older SPA version pings the updated garmin-bridge
- **THEN** the extension SHALL still include the existing `sessionActive` field alongside the new manifest fields, maintaining backward compatibility
