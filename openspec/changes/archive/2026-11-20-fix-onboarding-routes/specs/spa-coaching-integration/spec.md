## MODIFIED Requirements

### Requirement: Calendar Sync button gated on linked account

The calendar header SHALL render a "Sync <Label>" button for each coaching
source that is linked on the active profile and has a live session. Every other
available coaching source SHALL render the "Connect to <Label>" call to action,
which runs the link flow for the active profile. A source the active profile has
not linked SHALL NOT render a Sync button: the bridge session alone says nothing
about this profile.

#### Scenario: Profile with linked Train2Go shows Sync button

- **WHEN** the active profile has `linkedAccounts: [{ source: "train2go", ... }]` and the Train2Go session is active
- **THEN** the calendar header shows a "Sync Train2Go" button

#### Scenario: Profile with no linked accounts hides Sync buttons

- **GIVEN** the Train2Go extension is installed and signed in
- **WHEN** the active profile has `linkedAccounts: []`
- **THEN** the calendar header shows no Sync button and shows "Connect to Train2Go", which links the source to the active profile

#### Scenario: Profile switch updates Sync buttons

- **WHEN** the user switches from a profile with Train2Go linked to one without
- **THEN** the "Sync Train2Go" button turns into "Connect to Train2Go" without page reload

## ADDED Requirements

### Requirement: An explicit link opens the import routes its source feeds

When the user explicitly links a source, the system SHALL create an enabled
import route for every data type whose import capability that source's bridge
announces, that the SPA serves, and that the bridge's import actually writes
(`bridgeSupportsRoute`). The mode SHALL be automatic, except for the
training-zones route of a profile that already holds a threshold value, which
SHALL be manual so the link never overwrites values the athlete entered. It
SHALL do so only where no policy exists for that profile, data type, direction
and bridge. The explicit link covers the Train2Go link flow and a reconnect from
Connections. The routes' reads and writes SHALL run in one transaction, and a
failure SHALL be logged without failing the link that already succeeded.

A Disconnect from Connections SHALL switch off the source's enabled routes, in
both directions, and mark each one as switched off by the disconnect. The next
explicit link of that source SHALL switch back on every route so marked, keeping
its stored mode. A route the user switched off SHALL NOT carry the mark, and any
later decision on a route SHALL clear it, so an explicit link SHALL leave every
unmarked existing policy untouched, and above all a disabled one.

#### Scenario: Linking Train2Go opens its routes

- **GIVEN** a profile with no integration policies and no threshold value
- **WHEN** the user links Train2Go and the link succeeds
- **THEN** enabled automatic import routes SHALL exist for planned sessions and training zones from `train2go-bridge`

#### Scenario: Linking Train2Go on a tuned profile keeps zones manual

- **GIVEN** a profile with no integration policies and an FTP value
- **WHEN** the user links Train2Go and the link succeeds
- **THEN** the planned-session import route SHALL be enabled and automatic
- **AND** the training-zones import route SHALL be enabled with the manual mode

#### Scenario: A route the user switched off stays off

- **GIVEN** a disabled planned-session import route from `train2go-bridge` without the disconnect mark
- **WHEN** the user links Train2Go again
- **THEN** that route SHALL still be disabled

#### Scenario: Reconnect restores what Disconnect switched off

- **GIVEN** an enabled Garmin activity import route and an enabled Garmin workout export route
- **WHEN** the user disconnects Garmin from Connections and then reconnects it
- **THEN** both routes SHALL be enabled again with their stored modes, and neither SHALL carry the disconnect mark

#### Scenario: A decision after Disconnect is kept

- **GIVEN** a route that Disconnect switched off
- **WHEN** the user switches that route themselves and later reconnects the source
- **THEN** the route SHALL keep the user's decision

#### Scenario: WHOOP opens only the routes its import writes

- **GIVEN** a profile with no integration policies
- **WHEN** the user reconnects WHOOP from Connections
- **THEN** import routes SHALL exist exactly for HRV, sleep, strain, vitals, heart-rate series, stress and activity
- **AND** no weight, daily-wellness or body-composition route SHALL be created

#### Scenario: A failed link opens nothing

- **WHEN** the link flow ends without a link
- **THEN** no import route SHALL be created
