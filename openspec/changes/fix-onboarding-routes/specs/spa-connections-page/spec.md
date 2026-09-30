## ADDED Requirements

### Requirement: A row can switch each export destination on and off

The system SHALL let an exportable data type's row switch an individual
destination's export route on or off. Without this control a profile created
after the seeding migrations ran can never send workouts anywhere, because no
other surface creates an export route. A destination SHALL be offered only where
its bridge is connected and announces the type's export capability; an enabled
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

#### Scenario: The no-export-route message leads to the control

- **WHEN** Send week or a push is blocked because no workout export route is enabled
- **THEN** the message SHALL link to the Connections section

### Requirement: A coaching card states whether the active profile is linked

A coaching source is linked per athlete profile, and a bridge session says
nothing about the active profile. When the active profile has no link for a
coaching source whose bridge is present, the source's card SHALL say so and
SHALL offer to link it to the active profile.

#### Scenario: An unlinked profile is told and offered the link

- **GIVEN** the Train2Go bridge is present and the active profile has no Train2Go link
- **WHEN** the Connections section renders
- **THEN** the Train2Go card SHALL state that the source is not linked to this profile and SHALL offer "Link to this profile"
