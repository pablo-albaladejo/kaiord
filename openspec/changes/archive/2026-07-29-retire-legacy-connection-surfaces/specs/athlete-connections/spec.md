## MODIFIED Requirements

<!-- MODIFIED FROM openspec/specs/athlete-connections/spec.md / Requirement:
     "Provider catalog declares a connect mechanism". Two corrections. First,
     the prior text asserted that "connect for a `bridge` provider opens the
     provider site so its session is available to the extension", and its WHOOP
     scenario asserted a Connect affordance that "opens an `app.whoop.com`
     tab". No such affordance was ever built: the only connect a bridge
     provider has ever performed is the record write, and no code path in the
     SPA opens a provider tab. The spec was describing an intention, and a
     reviewer checking the code against it would have found a missing feature
     rather than the truth, which is that the extension picks the session up on
     its own once the user is signed in on the provider's own site. Second, the
     requirement named "the Athlete Connections section" as the surface; that
     section was retired and its role belongs to the Connections page. The
     credential, device-locality, disconnect and cascade requirements are
     untouched — they were never about the retired page. -->

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
