> Synced: 2026-07-29 (retire-legacy-connection-surfaces)

# athlete-connections Specification

## Purpose

Define honest connect/disconnect semantics for a provider account link. The
Athlete-page section this capability was named for has been retired into
`/settings/connections` (see `spa-connections-page`); the record contract below
is what survived it and is surface-independent. Connection state is tracked per
`(profileId, providerId)` independently of integration-policy flows; each
provider declares a connect mechanism (`bridge`, `api-key`, `manual`, or
`not-supported`); credentials are encrypted at rest, kept device-local (excluded
from cloud sync), and removed by the profile-delete cascade. Disconnect is a
real account-unlink, not a policy toggle.

## Requirements

### Requirement: Connection state is tracked independently of integration policies

The system SHALL persist a per-`(profileId, providerId)` connection record whose
status is one of `connected`, `disconnected`, or `not-supported`, and SHALL
derive the connection UI state from that record rather than inferring it from
whether any `IntegrationPolicy` is enabled.

For a `bridge` provider the record SHALL be combined with extension discovery
rather than consulted alone: the provider is connected iff its extension is
discovered AND its record does not say `disconnected`. An absent record SHALL be
read as "never disconnected", not as "not connected", so a provider the user has
never explicitly unlinked is presented from what the extension is actually
doing. For an `api-key` provider a record saying `connected` SHALL remain
required, because connecting one writes that record.

Every surface that displays a provider's connection state SHALL apply this same
rule, so two surfaces cannot describe the same provider differently.

#### Scenario: No record yet for a supported provider

- **WHEN** the UI renders a supported provider that has no stored connection record
- **THEN** the absence is read as "never disconnected", not as "not connected"
- **AND** the provider's state follows its mechanism's rule, stated in the two scenarios below

#### Scenario: No record yet for a discovered bridge provider

- **WHEN** the UI renders a bridge provider whose extension is discovered and which has no stored connection record
- **THEN** the provider is shown as connected
- **AND** its data-flow toggles are still not treated as evidence of the account link

#### Scenario: No record yet for an api-key provider

- **WHEN** the UI renders an api-key provider with no stored connection record
- **THEN** the provider is shown as disconnected

#### Scenario: Stored connected record

- **WHEN** a provider has a connection record with status `connected`
- **THEN** the provider is shown as `connected` regardless of how many of its flow policies are enabled

#### Scenario: Disconnecting a bridge is visible

- **GIVEN** a bridge provider whose extension remains discovered
- **WHEN** the user disconnects it and the record is written as `disconnected`
- **THEN** the provider is no longer shown as connected on any surface that displays its state

#### Scenario: Re-linking clears the disconnected state

- **GIVEN** a bridge provider with a `disconnected` record whose extension is discovered
- **WHEN** the user reconnects it
- **THEN** a `connected` record is written and the provider is shown as connected again

### Requirement: Provider catalog declares a connect mechanism

Each provider in the connection catalog SHALL declare a connect `mechanism` of
`bridge`, `api-key`, or `not-supported`, and the UI SHALL offer only the connect
affordance that matches the declared mechanism.

Providers whose data is read through a session-piggyback extension — Garmin,
Train2Go, WHOOP, Tanita and TrainingPeaks — SHALL declare `bridge`. A bridge
provider's session is established by the user on the provider's own site and
observed by the extension; the application SHALL NOT claim to establish it. The
only connect action a bridge provider offers is therefore the record write that
undoes a previous disconnect, and it SHALL be offered only where it can take
effect — that is, where the extension is present. Where the extension is absent,
the provider SHALL say so instead of offering an action that cannot work.
Disconnect clears the local bridge linkage without any stored credential.

The catalog SHALL be the single source of these mechanisms. No surface SHALL
maintain its own parallel provider list, because two lists drift.

#### Scenario: Mechanism per current provider

- **WHEN** the catalog is read
- **THEN** Garmin, Train2Go, WHOOP, Tanita and TrainingPeaks declare `bridge`
- **AND** intervals.icu declares `api-key`
- **AND** Strava and Wahoo declare `not-supported`
- **AND** manual entry declares `manual`

#### Scenario: WHOOP connects the bridge way, not via credentials

- **WHEN** the Connections page renders the WHOOP source
- **THEN** there SHALL be no client-id/secret or API-key entry for WHOOP
- **AND** its state SHALL be reported from the `whoop-bridge` session the extension observes

#### Scenario: Reconnect is offered only where it can take effect

- **GIVEN** a bridge provider the user previously disconnected
- **WHEN** its extension is present
- **THEN** a connect action SHALL be offered that clears the disconnected record
- **AND** when the extension is absent, no connect action SHALL be offered and the surface SHALL say the extension is not running

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

- **WHEN** a connection surface renders Strava or Wahoo
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
