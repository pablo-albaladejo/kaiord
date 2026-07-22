## MODIFIED Requirements

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
