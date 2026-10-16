## ADDED Requirements

### Requirement: The account menu opens complete

The header's account menu SHALL NOT open while the athletes it lists, or the
active athlete it marks, are still loading: its trigger SHALL stay disabled
until both reads have resolved. Once open, the menu SHALL already list every
athlete, so no row is added above the others while the user is pressing one.
The athlete list SHALL be read by the always-mounted menu root, not by the
menu content, so opening the menu never starts that read.

#### Scenario: A first run cannot open a menu that is still loading

- **GIVEN** a first run, while the database opens and the default athlete is created
- **WHEN** the header is on screen
- **THEN** the account menu trigger SHALL be disabled until the athletes have loaded

#### Scenario: The menu opens with every athlete listed

- **GIVEN** two athletes are stored and the header has loaded them
- **WHEN** the user opens the account menu
- **THEN** both athletes SHALL be listed in the first frame the menu shows
