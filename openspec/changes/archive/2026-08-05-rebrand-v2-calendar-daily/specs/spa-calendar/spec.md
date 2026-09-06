## ADDED Requirements

### Requirement: Session colour carries the dominant training zone

The 4 px lateral border on every calendar session card SHALL encode the
session's dominant training zone, and nothing else. The dominant zone SHALL be
the zone holding the largest share of the session's classified time, resolved
from the session's KRD by the same classifier the rest of the SPA uses; ties
SHALL resolve to the harder zone.

A session whose structure cannot be classified — no KRD, no time-based steps,
or no target the classifier resolves — SHALL render a neutral edge. The SPA
SHALL NOT derive a zone from a coaching activity's `effort`, which is an
effort rating and not a zone.

The session's lifecycle SHALL be rendered as a word, never as the border
colour and never as a hue-coded glyph.

#### Scenario: A structured session takes its zone

- **GIVEN** a workout record whose KRD classifies mostly into zone 4
- **WHEN** its calendar card renders
- **THEN** the card's left border SHALL use the zone-4 role token, and the rest of the card's border SHALL stay on the neutral edge role

#### Scenario: A raw session stays uncoloured

- **GIVEN** a workout record with `state: "raw"` and no KRD
- **WHEN** its calendar card renders
- **THEN** the card's left border SHALL use the neutral edge role, and the card SHALL carry the lifecycle word "Raw"

#### Scenario: A coach plan with no expansion stays uncoloured

- **GIVEN** a `CoachingActivity` with `effort: 4` and no linked structured workout
- **WHEN** its calendar card renders
- **THEN** the card's left border SHALL use the neutral edge role

### Requirement: Zone profile bar on structured cards

A calendar card for a session with a classifiable structure SHALL render a
zone-profile bar directly under its title: one segment per contiguous run of
same-zone time, the segment's width proportional to its duration and its
height proportional to its zone, so the shape reads without colour.

The bar SHALL be a single shared component with a caller-supplied height, so
one implementation serves the grid (14 px), the list (20 px) and the library
(10 px). A session with no classifiable structure SHALL render no bar rather
than an empty or a placeholder one.

#### Scenario: Grid and list share one component at two heights

- **WHEN** the same session renders in the week grid and in the week list
- **THEN** both SHALL render the same zone-profile component, at 14 px and 20 px respectively

#### Scenario: Height encodes the zone

- **GIVEN** a session with time in zone 1 and in zone 4
- **WHEN** the zone-profile bar renders
- **THEN** the zone-4 segment SHALL be taller than the zone-1 segment

#### Scenario: No structure, no bar

- **GIVEN** a workout record with no KRD
- **WHEN** its calendar card renders
- **THEN** no zone-profile bar SHALL be rendered

### Requirement: Week status bar

The calendar SHALL render a week-level status bar stating, in three neutral
steps, how many of the week's sessions are done and matched, ready but not
pushed, and still needing structure. The counts SHALL be rendered as text, not
only as bar widths. The steps SHALL be distinguished by lightness, not by hue.

The status bar SHALL NOT render when all three counts are zero — a week with
nothing to report says nothing (principle 2).

#### Scenario: A week with work in every state

- **GIVEN** a week with 2 matched sessions, 2 sessions in `ready` and 2 in `raw`
- **WHEN** the calendar renders
- **THEN** the status bar SHALL show three steps and SHALL state each count in text

#### Scenario: An untouched week is silent

- **GIVEN** a week with no matched, ready or raw sessions
- **WHEN** the calendar renders
- **THEN** no week status bar SHALL be rendered

### Requirement: One week-scoped action

The calendar SHALL render at most one week-scoped call to action for the raw
sessions in the displayed week. When an AI provider is configured, that action
SHALL be the batch processing banner; when none is configured, it SHALL be the
banner that names the consequence of the missing key. The two SHALL NOT render
together.

#### Scenario: Raw sessions with a provider configured

- **GIVEN** a week with 2 raw sessions and an AI provider configured
- **WHEN** the calendar renders
- **THEN** the batch processing banner SHALL render and the missing-key banner SHALL NOT

#### Scenario: Raw sessions with no provider

- **GIVEN** a week with 2 raw sessions and no AI provider configured
- **WHEN** the calendar renders
- **THEN** the missing-key banner SHALL render, naming what the raw sessions cannot do, and the batch processing banner SHALL NOT

### Requirement: The first run states what has to be true

When the profile has no workouts at all, the calendar SHALL render an ordered
guide naming the three conditions that have to hold before the week fills
itself, each stating what stays broken while it does not, plus the manual path
that requires none of them. The calendar SHALL NOT render an empty week with
no explanation.

The dependency banners SHALL each name the consequence of the missing
dependency rather than the name of the missing component.

#### Scenario: A brand-new profile

- **GIVEN** a profile with zero workouts in any week
- **WHEN** the calendar renders
- **THEN** the first-run guide SHALL render with its three ordered steps

#### Scenario: The guide replaces the per-dependency banners

- **GIVEN** a profile with zero workouts
- **WHEN** the calendar renders
- **THEN** the empty-week, missing-key and missing-bridge banners SHALL NOT also render, because the guide already states all three
