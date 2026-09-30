## MODIFIED Requirements

### Requirement: An export target is offered only where an export can exist

The system SHALL offer a row's "sent onwards" affordance only for data types the
registry gives an export capability. For a type with no export capability the
affordance SHALL be absent, because reporting that the type goes nowhere would
describe the absence of a route that cannot be created. For a type that can be
exported but has no enabled export route, the system SHALL report that it goes
nowhere, which there is true, and SHALL keep reporting it beside the destination
switches until one of them is on.

#### Scenario: An import-only type offers nothing

- **GIVEN** a data type with no export capability in the registry
- **WHEN** its row renders
- **THEN** no "sent onwards" affordance SHALL be present

#### Scenario: An exportable type with no enabled route says so

- **GIVEN** a data type with an export capability and no enabled export route
- **WHEN** its row renders
- **THEN** the row SHALL report that it is sent nowhere

#### Scenario: Nowhere stays beside switches that are all off

- **GIVEN** a data type with an export capability, a destination offered as a switch, and no enabled export route
- **WHEN** its row renders
- **THEN** the row SHALL report that it is sent nowhere beside the switched-off destination
- **AND** once that destination is switched on the row SHALL no longer report that it is sent nowhere

## ADDED Requirements

### Requirement: A row can switch each export destination on and off

The system SHALL let an exportable data type's row switch an individual
destination's export route on or off. Without this control a profile created
after the seeding migrations ran can never send workouts anywhere, because no
other surface creates an export route. A destination SHALL be offered only where
its bridge is connected and announces the type's export capability, and not for
a bridge whose export is not yet verified end to end (TrainingPeaks); an enabled
route SHALL stay offered so it can always be switched back off. Switching SHALL
preserve the stored mode.

Every message that blocks an action for lack of an export route SHALL point to
this control.

#### Scenario: A connected Garmin bridge can be switched on as a workout destination

- **GIVEN** a connected Garmin bridge announcing `write:workouts` and no workout export route
- **WHEN** the workout row is opened
- **THEN** Garmin SHALL be offered, switched off, and switching it on SHALL create an enabled export route with the automatic mode

#### Scenario: A bridge without the export capability is not offered

- **GIVEN** a connected Train2Go bridge, which announces no export capability
- **WHEN** the workout row is opened
- **THEN** Train2Go SHALL NOT be offered as a destination

#### Scenario: An unverified export bridge is not offered

- **GIVEN** a connected TrainingPeaks bridge announcing `write:workouts` and no workout export route from it
- **WHEN** the workout row is opened
- **THEN** TrainingPeaks SHALL NOT be offered as a destination

#### Scenario: The no-export-route message leads to the control

- **WHEN** Send week or a push is blocked because no workout export route is enabled
- **THEN** the message SHALL link to the Connections section

### Requirement: A coaching card states whether the active profile is linked

A coaching source is linked per athlete profile, and a bridge session says
nothing about the active profile. When the active profile has no link for a
coaching source whose bridge is present, the source's card SHALL say so. While
the source has a session in this browser the card SHALL offer to link it to the
active profile, and SHALL disable that offer while a link is in flight; without a
session it SHALL ask the user to sign in to the source first and SHALL offer no
link. A link error SHALL be shown on the card. Nothing SHALL render while the
active profile is loading or once it is linked.

#### Scenario: An unlinked profile is told and offered the link

- **GIVEN** the Train2Go bridge is present and the active profile has no Train2Go link
- **AND** the Train2Go session is signed in on this browser
- **WHEN** the Connections section renders
- **THEN** the Train2Go card SHALL state that the source is not linked to this profile and SHALL offer "Link to this profile"

#### Scenario: An unlinked profile without a session is asked to sign in

- **GIVEN** the Train2Go bridge is present, has no signed-in session, and the active profile has no Train2Go link
- **WHEN** the Connections section renders
- **THEN** the Train2Go card SHALL ask the user to sign in to Train2Go in this browser and SHALL offer no link

#### Scenario: A linked profile is told nothing

- **GIVEN** the active profile has a Train2Go link
- **WHEN** the Connections section renders
- **THEN** the Train2Go card SHALL show no link notice
