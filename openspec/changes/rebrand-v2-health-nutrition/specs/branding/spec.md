## ADDED Requirements

### Requirement: Data-series colour policy

The five zone hues (`--zone-1`…`--zone-5`) SHALL be reserved for training
intensity. No surface that is not reporting a training zone SHALL paint with
them, and no component SHALL substitute a raw hue that sits within the zone
ramp's arc for one of them.

A chart whose series are not training zones SHALL distinguish those series by
**lightness and label**, never by hue. Series strokes SHALL be drawn from an
ordered neutral ladder built on the ink roles (`--text`, `--text-secondary`,
`--text-dim`, `--text-disabled`), resolved from the live document so the ladder
follows the `.dark` class without the series being rebuilt per theme. Where a
legend or picker names those series outside the canvas, its swatch SHALL carry
the same ladder step as the stroke.

The palette SHALL NOT define a success role or a warning role. A state that
needs the user SHALL be rendered as an icon plus a phrase naming the state, on
`--text`; a state that does not need the user SHALL be rendered as ordinary
muted text, or not rendered at all. Emphasis that is required in addition to
the phrase SHALL be carried by a lightness step (for example a border moving
from `--border` to `--text-disabled`), never by a tint.

`--danger` and its companions (`--danger-text`, `--danger-bg`,
`--danger-border`) SHALL remain reserved for destructive affordances — a
control that deletes or discards user data — and SHALL NOT be used to mark a
measured value as bad.

#### Scenario: A health chart series is not painted with a zone hue

- **GIVEN** a chart whose series are health metrics (sleep, HRV, weight, steps) rather than training zones
- **WHEN** its series strokes are resolved
- **THEN** each stroke SHALL be a distinct step of the neutral ink ladder, no two series SHALL share a step, and no stroke SHALL resolve to any `--zone-*` value or to a literal hue

#### Scenario: The stroke ladder follows the theme

- **GIVEN** a chart rendered under `:root` (light)
- **WHEN** the `.dark` class is applied to the document root and the chart options are rebuilt
- **THEN** the same ladder positions SHALL resolve to the dark theme's ink roles, and the series SHALL keep their relative order of lightness

#### Scenario: An out-of-range measurement names itself

- **WHEN** a measured value falls outside its reference range
- **THEN** the surface SHALL render an alert glyph together with the translated state word on `--text`, and SHALL NOT tint the value, its row background or its border with a hue

#### Scenario: An in-range measurement is silent

- **WHEN** a measured value falls inside its reference range, or no range is known
- **THEN** the surface SHALL render the state as muted text with no glyph, no badge fill and no coloured border

#### Scenario: A progress ring that is over target says so in words

- **GIVEN** a progress ring whose actual value exceeds its target
- **WHEN** the ring is rendered
- **THEN** its arc SHALL keep the same ink stroke as every other ring, the over state SHALL be carried by the ring's label gaining an alert glyph and a word, and no amber, red or green SHALL appear

#### Scenario: Danger is reserved for destructive controls

- **WHEN** the repository is searched for `--danger` consumers under the SPA component tree
- **THEN** every call site SHALL be a control that deletes or discards data, and none SHALL be a rendering of a measured value's quality
