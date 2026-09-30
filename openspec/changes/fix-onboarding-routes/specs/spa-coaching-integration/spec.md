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
import route, with the automatic mode, for every data type whose import
capability that source's bridge announces and the SPA serves. It SHALL do so only
where no policy exists for that profile, data type, direction and bridge. An
existing policy SHALL be left untouched, and above all a disabled one, which
records the user's decision to switch the route off. The explicit link covers the
Train2Go link flow and a reconnect from Connections.

#### Scenario: Linking Train2Go opens its routes

- **GIVEN** a profile with no integration policies
- **WHEN** the user links Train2Go and the link succeeds
- **THEN** enabled automatic import routes SHALL exist for planned sessions and training zones from `train2go-bridge`

#### Scenario: A route the user switched off stays off

- **GIVEN** a disabled planned-session import route from `train2go-bridge`
- **WHEN** the user links Train2Go again
- **THEN** that route SHALL still be disabled

#### Scenario: A failed link opens nothing

- **WHEN** the link flow ends without a link
- **THEN** no import route SHALL be created
