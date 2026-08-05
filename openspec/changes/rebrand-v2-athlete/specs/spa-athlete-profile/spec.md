## ADDED Requirements

### Requirement: Every threshold states where it came from

The Athlete page SHALL render, beside every threshold value it shows, the origin
of that value and — when the origin is datable — its age.

Origin SHALL be derived, not stored: for each threshold field the system SHALL
compare the profile's current value against the corresponding scalar in every
linked account's `lastSyncedZonesSnapshot`. An exact match SHALL be reported as
having arrived from that account at the snapshot's `syncedAt`. Anything else —
a differing value, a field the snapshot does not carry, or a profile with no
linked account — SHALL be reported as entered by hand.

A hand-entered value SHALL be dated only from `profile.updatedAt`, and only
because that timestamp bounds it: no field can have been typed after the profile
was last written. The system SHALL NOT present a per-field edit time, because
none is recorded.

#### Scenario: A value that matches what a source sent

- **GIVEN** a profile whose linked account snapshot holds `cyclingFtp: 268` synced four days ago
- **WHEN** the profile's cycling FTP is 268
- **THEN** the FTP metric SHALL name that account as its origin and state that it arrived four days ago

#### Scenario: A value the user changed after a sync

- **GIVEN** a linked account snapshot holding `cyclingFtp: 268`
- **WHEN** the profile's cycling FTP is 250
- **THEN** the FTP metric SHALL be reported as entered by hand, and SHALL NOT name the account

#### Scenario: A field no snapshot carries

- **WHEN** a threshold has no corresponding scalar in any linked account snapshot
- **THEN** it SHALL be reported as entered by hand

### Requirement: Provenance has two states

Threshold provenance SHALL be rendered in exactly two visual states: silent, and
needing the user. There SHALL be no permanent status dot, badge or colour-coded
marker on a value that is fine.

A threshold SHALL enter the attention state only when its provenance carries a
date and that date is older than the staleness window. In the attention state
the provenance line SHALL be rendered with the `--text` role and preceded by a
`triangle-alert` icon; in the silent state it SHALL be rendered dim with no
icon. Neither state SHALL use a success, warning or danger colour — those hues
do not exist in the palette.

An undated hand-entered value SHALL stay silent, because its age is unknown.

#### Scenario: A freshly synced value

- **WHEN** a threshold arrived from a source inside the staleness window
- **THEN** its provenance SHALL render dim with no icon

#### Scenario: A value older than the staleness window

- **WHEN** a threshold's provenance date is older than the staleness window
- **THEN** its provenance SHALL render with the `--text` role preceded by a `triangle-alert` icon

#### Scenario: A hand-entered value on a recently written profile

- **GIVEN** a threshold reported as entered by hand
- **WHEN** `profile.updatedAt` is inside the staleness window
- **THEN** no date SHALL be shown and the provenance SHALL stay silent

### Requirement: A source that disagrees is surfaced with its fix

When a linked account's `lastSyncedZonesSnapshot` holds a value for a threshold
that differs from the profile's current value, the Athlete page SHALL state the
disagreement on the card that shows that threshold: what the source recorded,
when it recorded it, and what Kaiord is using instead.

The row SHALL be marked with neutral surface and border roles only. Its primary
action SHALL apply the source's value, and SHALL be labelled with that value;
its secondary action SHALL keep the current value, and SHALL be labelled with
that value. Neither label SHALL be a generic verb — the action is the fix, so it
names the fix.

Keeping the current value SHALL dismiss the row for the session without writing
to the profile or to the snapshot, because a preference for the current number
is not recorded anywhere.

#### Scenario: The source recorded a higher max heart rate

- **GIVEN** a snapshot holding `maxHeartRate: 191` and a profile holding 186
- **WHEN** the Athlete page renders the cycling thresholds
- **THEN** a row SHALL state both numbers and the snapshot's date, and SHALL offer "Use 191" as its primary action and "Keep 186" as its secondary

#### Scenario: Applying the source's value

- **WHEN** the primary action is taken
- **THEN** the profile field SHALL be written with the source's value, and the threshold SHALL thereafter report that account as its origin

#### Scenario: Agreement is silent

- **WHEN** every snapshot scalar equals the profile's current value
- **THEN** no disagreement row SHALL render

### Requirement: The auto-import control governs the real policy

The Athlete page SHALL render a control for whether a connected source may
overwrite these numbers, and that control SHALL read and write the `mode` of the
profile's `(dataType: training-zones, direction: import)` `IntegrationPolicy`
rows — the same predicate the zones auto-import lifecycle gates on.

The control SHALL read as on when at least one such policy is enabled with mode
`auto`. Turning it off SHALL set those policies to mode `manual`, leaving
`enabled` untouched, so an import the user asks for still runs. The control
SHALL carry a one-line statement of what off means.

When the profile has no `(training-zones, import)` policy the control SHALL NOT
render, because there is no mechanism for it to govern.

#### Scenario: No source can send zones

- **WHEN** the profile has no training-zones import policy
- **THEN** the auto-import control SHALL be absent

#### Scenario: Turning auto-import off

- **GIVEN** an enabled training-zones import policy with mode `auto`
- **WHEN** the control is switched off
- **THEN** the policy's mode SHALL become `manual` and its `enabled` flag SHALL be unchanged

### Requirement: The zone map encodes intensity twice

`ZoneMap` SHALL encode a zone's range as the width of its bar and the zone's
intensity as the height of that bar, so the ramp remains readable with colour
removed. Zone labels SHALL be rendered below the bars, aligned to them, and
SHALL NOT be drawn inside the bars.

The reason the zones exist SHALL be stated above the map, not below it, and
SHALL name the threshold the bands are derived from.

#### Scenario: The ramp read without colour

- **WHEN** the zone bars are rendered
- **THEN** bar height SHALL increase monotonically from Z1 to Z5 independently of hue

#### Scenario: Label placement

- **WHEN** the zone bars are rendered
- **THEN** each zone's label SHALL sit below its bar

#### Scenario: The reason precedes the map

- **WHEN** the zones card is rendered with a derivable zone map
- **THEN** the statement of what the zones feed SHALL appear above the bars and SHALL name the threshold value they derive from
