> Synced: 2026-07-22 (rewrite-whoop-session-bridge)

# athlete-connections Specification

## Purpose

Define honest connect/disconnect semantics for the Athlete Connections section.
Connection state is tracked per `(profileId, providerId)` independently of
integration-policy flows; each provider declares a connect mechanism (`bridge`,
`api-key`, or `not-supported`); credentials are encrypted at rest, kept
device-local (excluded from cloud sync), and removed by the profile-delete
cascade. Disconnect is a real account-unlink, not a policy toggle.

## Requirements

### Requirement: Connection state is tracked independently of integration policies

The system SHALL persist a per-`(profileId, providerId)` connection record whose
status is one of `connected`, `disconnected`, or `not-supported`, and SHALL
derive the Athlete Connections UI state from that record rather than inferring it
from whether any `IntegrationPolicy` is enabled.

#### Scenario: No record yet for a supported provider

- **WHEN** the Connections section renders a supported provider with no stored connection record
- **THEN** the provider is shown as `disconnected`
- **AND** its data-flow toggles are not treated as evidence of an active account link

#### Scenario: Stored connected record

- **WHEN** a provider has a connection record with status `connected`
- **THEN** the provider is shown as `connected` regardless of how many of its flow policies are enabled

### Requirement: Provider catalog declares a connect mechanism

Each provider in the connection catalog SHALL declare a connect `mechanism` of
`bridge`, `api-key`, or `not-supported`, and the UI SHALL offer only the connect
affordance that matches the declared mechanism. Providers whose data is read
through a session-piggyback extension — Garmin, Train2Go, and WHOOP — SHALL
declare `bridge`; connect for a `bridge` provider opens the provider site so its
session is available to the extension and reflects the extension's discovered
session status, and disconnect clears the local bridge linkage without any
stored credential.

#### Scenario: Mechanism per current provider

- **WHEN** the catalog is read
- **THEN** Garmin, Train2Go, and WHOOP declare `bridge`
- **AND** intervals.icu declares `api-key`
- **AND** Strava and Wahoo declare `not-supported`

#### Scenario: WHOOP connects the bridge way, not via credentials

- **WHEN** the Connections section renders the WHOOP row
- **THEN** its Connect affordance opens an `app.whoop.com` tab and reflects the `whoop-bridge` session status
- **AND** there SHALL be no client-id/secret or API-key entry for WHOOP

### Requirement: intervals.icu connects via a validated API key

For an `api-key` provider, connect SHALL validate the user-supplied key with a
live provider request and SHALL persist the connection only when validation
succeeds; an invalid or unauthorized key MUST surface an error and MUST NOT be
persisted.

#### Scenario: Valid API key

- **WHEN** the user submits a valid intervals.icu API key
- **THEN** a live validation request succeeds
- **AND** a `connected` record is stored with the key held as an encrypted credential

#### Scenario: Invalid API key

- **WHEN** the user submits a key the provider rejects
- **THEN** an error message is shown
- **AND** no connection record or credential is persisted

### Requirement: Disconnect clears the connection and disables its flows

Disconnect SHALL be a real account-unlink: it MUST clear the provider's
connection record and any stored credential or bridge linkage, AND MUST disable
that provider's `IntegrationPolicy` flows. Disconnect MUST NOT leave a stored
credential behind.

#### Scenario: Disconnect an api-key provider

- **WHEN** the user disconnects intervals.icu
- **THEN** its encrypted credential is deleted and its connection record is cleared
- **AND** its import/export flow policies are set to disabled

#### Scenario: Disconnect a bridge provider

- **WHEN** the user disconnects Garmin
- **THEN** the locally stored bridge linkage is cleared and its connection record is set to `disconnected`
- **AND** its flow policies are set to disabled

### Requirement: Unsupported providers present an honest state

A provider whose mechanism is `not-supported` SHALL render an accurate
"not supported yet" state and SHALL NOT expose a Connect action that initiates or
simulates a connection flow.

#### Scenario: Strava and Wahoo rows

- **WHEN** the Connections section renders Strava or Wahoo
- **THEN** the row shows a "not supported yet" state
- **AND** there is no functional Connect action (no fake OAuth, no deep-link masquerading as connect)

### Requirement: Provider credentials are encrypted at rest

Any stored provider credential SHALL be encrypted with the application's
AES-GCM credential encryption before being written to persistence, and MUST NOT
be stored in plaintext.

#### Scenario: API key persisted

- **WHEN** an intervals.icu API key is stored on successful connect
- **THEN** the persisted value is ciphertext, not the plaintext key
- **AND** decrypting it yields the original key

### Requirement: Connection records are device-local

Connection records and their credentials SHALL be excluded from the cloud sync
snapshot so provider secrets are never written to remote storage.

#### Scenario: Snapshot export

- **WHEN** a cloud sync snapshot is produced
- **THEN** the connections store is not included in the exported snapshot

### Requirement: Connection records are removed when a profile is deleted

Deleting a profile SHALL remove that profile's connection records and stored
credentials via the existing profile-delete cascade.

#### Scenario: Profile deletion

- **WHEN** a profile is deleted
- **THEN** all connection records and credentials for that profile are removed
