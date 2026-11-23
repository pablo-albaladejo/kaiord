## ADDED Requirements

### Requirement: Bridge protocol versions accepted per extension

The SPA SHALL accept, per extension, its current Bridge protocol version and the one before it, listed in `src/adapters/bridge/bridge-protocol.ts` (`train2go-bridge`: 1 and 2; every other extension: 1). Discovery verification, the ping-based Session probes and the Train2Go detection SHALL use that list. The Session probe and the detection SHALL report a version outside the list as outdated, never as a signed-out Session; discovery verification SHALL not register it (what the athlete is then shown is the Connection notices' concern, #1644).

#### Scenario: Train2Go one protocol version behind

- **WHEN** the Train2Go extension pings with `protocolVersion: 1`
- **THEN** discovery accepts it and its Session is read as usual

#### Scenario: Train2Go on a version the App does not know

- **WHEN** the Train2Go extension pings with `protocolVersion: 3`
- **THEN** the Session probe reports it outdated

#### Scenario: Another extension does not gain protocol 2

- **WHEN** the Garmin extension pings with `protocolVersion: 2`
- **THEN** the Session probe reports it outdated, because Garmin's only version is 1

## REMOVED Requirements

### Requirement: Protocol version compatibility

**Reason**: No per-capability minimum version exists in the SPA; compatibility is the current and previous protocol version per extension (ADR 0004).
**Migration**: "Bridge protocol versions accepted per extension".
