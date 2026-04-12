## ADDED Requirements

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

The system SHALL define these capability types: `read:workouts`, `write:workouts`, `read:body`, `read:sleep`. The SPA SHALL adapt its UI based on detected capabilities (e.g., "Push to Garmin" only shown if a bridge with `write:workouts` is registered).

#### Scenario: Bridge with read:workouts capability

- **WHEN** a bridge registers with capability `read:workouts`
- **THEN** the SPA SHALL show import/sync UI elements for that bridge's platform

#### Scenario: No bridges installed

- **WHEN** no bridge extensions are detected
- **THEN** the SPA SHALL function as a standalone editor with no bridge-related UI elements

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

### Requirement: V1 bridge discovery via env vars

In V1, bridge extension IDs SHALL be configured via Vite environment variables (e.g., `VITE_GARMIN_EXTENSION_ID`). The SPA SHALL attempt to detect each configured bridge on boot and periodically thereafter.

#### Scenario: Garmin bridge configured and installed

- **WHEN** `VITE_GARMIN_EXTENSION_ID` is set and the extension is installed
- **THEN** the SPA SHALL detect the bridge via `chrome.runtime.sendMessage` ping and register it as VERIFIED

#### Scenario: Bridge extension not installed

- **WHEN** a configured extension ID does not respond to ping
- **THEN** the SPA SHALL not show bridge-related UI for that platform

### Requirement: Protocol version compatibility

The SPA SHALL define a minimum supported protocol version per capability. Bridges reporting a lower version SHALL trigger a user-visible "Update your extension" warning.

#### Scenario: Outdated bridge version

- **WHEN** a bridge responds with `protocolVersion: 1` but the SPA requires version 2 for `write:workouts`
- **THEN** the SPA SHALL display "Update your Garmin extension" and disable push operations for that bridge
