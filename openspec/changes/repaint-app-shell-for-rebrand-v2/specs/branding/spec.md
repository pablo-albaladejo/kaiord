## ADDED Requirements

### Requirement: The app shell carries no semantic hue

The chrome present on every route — the header and its menus, the mobile
bottom nav, the command palette, the shortcut sheet, the setup checklist and
the coach marks — SHALL be painted from the role layer alone. It SHALL contain
no colour literal, no raw Tailwind palette utility, and no hue that stands for
a state.

Specifically, the shell SHALL NOT use amber, green or red to mean warning,
success or danger. Those three semantics left the palette: amber is
`--zone-4`, so a warning drawn in it competes with the athlete's threshold
zone, and a success colour asserts a distinction the system does not make. A
state that needs the user SHALL be said with an icon and a sentence; a state
that does not need the user SHALL render nothing.

The one exception is the header mark's core, which takes the dominant training
zone of the week through `--core-live`. Zone hues mean training zones and
nothing else, so no other shell element SHALL take one.

An interactive fill in the shell SHALL be `--control` with `--control-ink` on
top, never a ramp step and never a gradient between two ramp steps.

#### Scenario: A shell component painted with a literal colour fails the gate

- **GIVEN** a component under the app shell declaring a colour as a hex literal or a raw Tailwind palette utility
- **WHEN** the definition-of-done greps for literal colour in component source run
- **THEN** they SHALL report it, because a literal cannot follow the theme and cannot be re-pointed when a role changes

#### Scenario: A source that is down is reported without amber

- **GIVEN** an attention model reporting at least one affected source
- **WHEN** the shell renders its source-health signal
- **THEN** the signal SHALL carry an alert icon and the consequence sentence over neutral surface and border roles, and SHALL introduce no warning hue

#### Scenario: A healthy shell renders no status element at all

- **GIVEN** an attention model reporting no affected source
- **WHEN** the shell renders on any route
- **THEN** no status element SHALL be present — not a neutral chip, not a grey dot, not a zero count — because an element present in the healthy case carries no information

#### Scenario: The create action is ink, not accent

- **GIVEN** the mobile bottom nav's raised create button
- **WHEN** it renders in either theme
- **THEN** its fill SHALL be `--control` and its glyph `--control-ink`, and it SHALL carry no gradient and no hue within 5° of a training zone

#### Scenario: Progress is shown without asserting success

- **GIVEN** the setup checklist with some items complete
- **WHEN** its progress rail and completed rows render
- **THEN** the rail SHALL be filled with `--control` and a completed row SHALL be said by its tick and strike-through, with no green anywhere
