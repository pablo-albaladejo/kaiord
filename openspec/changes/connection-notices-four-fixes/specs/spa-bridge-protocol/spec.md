## MODIFIED Requirements

### Requirement: Protocol version compatibility

The SPA SHALL define a minimum supported protocol version per capability. A bridge reporting another version, in any envelope it answers, SHALL be the "outdated" Connection state, shown as the Update notice of `connection-notices` ("Update Kaiord for <Platform>"), never as a signed-out Session.

#### Scenario: Outdated bridge version

- **WHEN** a bridge responds with `protocolVersion: 1` but the SPA requires version 2 for `write:workouts`
- **THEN** the SPA SHALL show the Update notice for Garmin and disable push operations for that bridge
