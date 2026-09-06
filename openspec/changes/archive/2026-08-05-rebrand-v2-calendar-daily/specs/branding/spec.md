## ADDED Requirements

### Requirement: The live core reads the week's dominant zone

The app-header mark's core SHALL take the dominant training zone of the week
through `--core-live`, set at runtime on the mark's wrapper. This is the one
chromatic accent permitted inside the login; its value SHALL be one of
`--zone-1` … `--zone-5` and SHALL NOT be a `--mkt-` token.

The dominant zone SHALL be derived by the same classifier the calendar cards
use: the zone holding the largest share of the week's classified time across
its structured sessions, with ties resolving to the harder zone. It SHALL NOT
be derived from a coaching activity's `effort`, which is an effort rating and
not a zone.

A week with no calculable dominant zone — no sessions, or none whose structure
the classifier resolves — SHALL leave `--core-live` unset on the wrapper, so
the core inherits the ink value the role layer declares. The empty case SHALL
NOT be handled by a JavaScript branch that paints ink explicitly, and the
writer SHALL therefore remove the property rather than assign a fallback to it.

#### Scenario: A week dominated by threshold work

- **GIVEN** a week whose structured sessions spend most of their classified time in zone 4
- **WHEN** the header renders
- **THEN** the mark's wrapper SHALL set `--core-live` to the zone-4 role token

#### Scenario: An empty week

- **GIVEN** a week with no session whose structure the classifier resolves
- **WHEN** the header renders
- **THEN** the mark's wrapper SHALL NOT declare `--core-live`, and the core SHALL render in ink in both themes

#### Scenario: A raw-only week is empty for this purpose

- **GIVEN** a week whose only sessions are raw imports with no KRD
- **WHEN** the header renders
- **THEN** the mark's wrapper SHALL NOT declare `--core-live`
