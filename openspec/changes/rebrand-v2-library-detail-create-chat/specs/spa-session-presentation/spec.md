## ADDED Requirements

### Requirement: A session's zone profile is rendered wherever the session is listed or proposed

Any surface that renders a structured session — the Library row, the Workout
detail sheet, the Create-workout result, a proposal card in the chat transcript
or on a coaching draft — SHALL render that session's time-in-zone distribution
as a horizontal segmented bar, one segment per zone with a positive fraction and
the segment's flex weight equal to that fraction. Zones with a zero fraction
SHALL NOT be rendered.

The bar SHALL be 10 px tall on list and card surfaces, and SHALL be driven by
the same `dist` array the review model already derives from the session's KRD
and the athlete's per-sport thresholds — no surface SHALL compute its own.

A session whose distribution is entirely zero (no classifiable structure) SHALL
render no bar and no substitute placeholder.

#### Scenario: A saved template shows its profile in the list

- **WHEN** the Library renders a template whose KRD yields a non-empty zone distribution
- **THEN** a 10 px segmented bar SHALL appear under the template's title, with one segment per zone that has a positive fraction, sized in proportion to it

#### Scenario: An unstructured template shows no bar

- **GIVEN** a template whose KRD yields no classifiable time-in-zone
- **WHEN** the Library renders its row
- **THEN** no zone bar and no placeholder SHALL be rendered

### Requirement: The lateral card border carries the dominant zone

A card representing one session SHALL carry a 4 px lateral border in the
session's **dominant** zone — the zone with the largest fraction of classified
time, resolving a tie to the lower zone number.

A session with no classifiable structure SHALL receive no zone-coloured border,
because it has no dominant zone to name.

The border SHALL NOT encode lifecycle, state, or freshness; those are said in
words.

#### Scenario: A mixed session takes its largest zone

- **GIVEN** a session whose classified time is 30% in zone 2 and 45% in zone 4
- **WHEN** its card is rendered
- **THEN** the lateral border SHALL be zone 4's colour

#### Scenario: A tie resolves downward

- **GIVEN** a session whose classified time is split equally between zone 2 and zone 4
- **WHEN** its card is rendered
- **THEN** the lateral border SHALL be zone 2's colour

### Requirement: A zone is never identified by colour alone

Wherever a surface names one specific zone as a value — the hardest zone of a
session, the dominant zone of a card summary — it SHALL render both a colour
swatch and the zone's name as a word, in the active locale.

The five zone names SHALL be single-sourced in the `zones` i18n namespace and
SHALL be available in every shipped locale.

A zone SHALL NOT be encoded by hue alone, by position in a ramp alone, or by
relative lightness: the zone ramp is not lightness-monotonic and the same zone
resolves to different lightness values in the light and dark themes.

#### Scenario: Hardest zone is said with a word

- **WHEN** a session summary reports the hardest zone the session reaches
- **THEN** it SHALL render the zone's swatch and its translated name together, and SHALL NOT rely on the swatch alone

#### Scenario: The word survives a theme flip

- **GIVEN** a session whose hardest zone is zone 4
- **WHEN** the theme switches between light and dark
- **THEN** the swatch colour MAY change with the theme and the zone's name SHALL NOT

### Requirement: A derived target states the threshold it derives from

A surface that writes or displays intensity targets derived from the athlete's
thresholds — the Create-workout generator and the Workout detail structure —
SHALL state which threshold those targets are computed against, its value, its
unit, and when the source of that number last changed.

The claim SHALL be bounded by what the profile stores: the sport's primary
threshold as already ordered for the Athlete screen (FTP for cycling, threshold
pace for running, CSS pace for swimming), its stored value, and the athlete
profile's own `updatedAt` rendered as relative time. The line SHALL attribute the
timestamp to the profile, not to the individual threshold field, because no
per-field provenance is stored.

When the active sport has no primary threshold set, the line SHALL be omitted
entirely rather than rendered with a placeholder value.

The line SHALL be placed above the control it justifies, not below it.

#### Scenario: Generation names the FTP it writes against

- **GIVEN** a profile with a cycling FTP set
- **WHEN** the Create-workout input phase renders for cycling
- **THEN** a line above the description field SHALL name FTP, its value in watts, and how long ago the athlete profile was last updated

#### Scenario: A sport with no threshold says nothing

- **GIVEN** a profile with no threshold set for the active sport
- **WHEN** the Create-workout input phase renders
- **THEN** no threshold line SHALL be rendered, in place of a line with an empty or placeholder value

### Requirement: A proposed session is rendered, not merely linked

When the assistant creates a session, or a coaching draft is opened for review,
the surface SHALL render the proposed session as a card carrying its title, its
dominant-zone lateral border, its zone profile bar, and its headline metrics —
rather than only a link to open it elsewhere.

Each metric MAY carry a **before** value, rendered beneath the figure. A before
value SHALL be shown only when a real prior value exists for that metric:

- in the chat transcript, the session already persisted on the proposed date;
- on a coaching draft, the duration and workload the coach prescribed.

When no prior value exists the metric SHALL render alone, with no dash, no
"n/a", and no empty comparison row.

The card SHALL NOT claim to replace an existing session unless the write path it
reports actually removes one.

#### Scenario: A proposal on an occupied date compares itself

- **GIVEN** a date that already holds a persisted session
- **WHEN** the assistant's confirmed create-workout result is rendered in the transcript
- **THEN** the proposal card SHALL render the new session's duration and TSS with the existing session's values beneath them, and SHALL name that session as the one it lands beside

#### Scenario: A proposal on an empty date states no comparison

- **GIVEN** a date holding no other session
- **WHEN** the proposal card is rendered
- **THEN** each metric SHALL render its value alone, with no comparison row and no placeholder
