> Synced: 2026-06-27 (train2go-coach-links)

# train2go-coach-links Specification

## Purpose

End-to-end preservation of Train2Go coach instructions and their embedded links
(YouTube/Dropbox): prefetch-on-demand availability, mapping into the canonical KRD
workout-level notes, export/push preservation (full fidelity to ZWO, best-effort
to FIT/Garmin), and editor visibility/editability.

## Requirements
### Requirement: Coach description prefetched on demand

The system SHALL fetch a coaching activity's `description` on demand before it is
needed, because the Train2Go weekly endpoint (`/api/v2/workplan/weekly`) returns
no activity descriptions — only the per-day `/api/v2/workplan/daily?source=sidebar`
response carries the `activity-description` block.

When a coaching activity whose `description` is `undefined` is opened, converted
to a workout, or exported, the system SHALL trigger a single `expandDay`/`readDay`
fetch for that activity's day, upsert every activity returned (siblings included),
and proceed once the description is populated. A persisted empty string `""` is
treated as "known empty" and SHALL NOT re-fire the fetch (consistent with
`spa-coaching-integration` "Dialog opens and lazy-loads description"). The prefetch
SHALL NOT advance `coachingSyncState.lastSyncedAt` (per `spa-coaching-integration`
"Auto-sync with staleness gate").

#### Scenario: Convert prefetches a missing description

- **GIVEN** a coaching activity synced via the weekly endpoint whose `description` is `undefined`
- **WHEN** the user converts it to a workout
- **THEN** the system fires `read-day` once, upserts the day's activities, and the convert proceeds with the now-populated description

#### Scenario: Known-empty description does not re-fetch

- **GIVEN** a coaching activity whose persisted `description` is `""`
- **WHEN** the user opens or converts it
- **THEN** no `read-day` call is made and the activity is treated as having no coach description

#### Scenario: Already-populated description does not re-fetch

- **GIVEN** a coaching activity whose `description` is already populated
- **WHEN** the user opens or converts it
- **THEN** no additional `read-day` call is made

### Requirement: Coach description flows into the KRD workout

The system SHALL write the coach `description` into the KRD workout-level `notes`
field (per `krd-format` "Workout-level notes field") when a coaching activity is
converted to a structured workout (AI, manual, or plain convert paths), in
addition to the existing `raw.description` used for sidebar display. When the
activity has no description (absent or `""`), the KRD workout-level `notes` SHALL
be omitted.

The markdown link form `[label](url)` produced by the Train2Go bridge
(`anchorToMarkdown`) SHALL be preserved verbatim when written into KRD `notes`.

#### Scenario: Manual conversion carries description into KRD notes

- **GIVEN** a coaching activity with `description: "Warmup Z1 — see [video](https://youtu.be/abc)"`
- **WHEN** `convertCoachingActivityManual` runs successfully
- **THEN** the resulting `WorkoutRecord.krd` workout exposes `notes` equal to the source description, AND `raw.description` also equals the source description

#### Scenario: Empty description omits KRD notes

- **GIVEN** a coaching activity with `description: ""`
- **WHEN** it is converted to a workout
- **THEN** the resulting KRD workout omits `notes` (no empty-string notes are written)

### Requirement: Coach notes preserved on export and push

Exporting a workout whose KRD carries workout-level `notes` SHALL preserve those
notes to the extent the target format allows:

- ZWO export SHALL include the notes as the workout `description` (full fidelity).
- FIT export and Garmin push SHALL attach the notes best-effort, truncated to the
  256-character step-note limit, without raising an error. The truncation SHALL be
  deterministic (leading 256 characters) and the loss SHALL be surfaced per
  `conversion-loss-honesty`.

#### Scenario: ZWO export includes coach notes as description

- **GIVEN** a workout whose KRD workout-level `notes` is non-empty
- **WHEN** it is exported to ZWO
- **THEN** the ZWO `<description>` contains the notes text

#### Scenario: FIT export attaches truncated coach notes

- **GIVEN** a workout whose KRD workout-level `notes` exceeds 256 characters
- **WHEN** it is exported to FIT or pushed to Garmin
- **THEN** export/push succeeds and a 256-character-truncated note is attached; no error is raised

### Requirement: Coach notes visible and editable in the editor

The workout editor SHALL display the workout-level coach `notes` and SHALL allow
the user to edit them. Edits SHALL persist to the workout's KRD via the existing
workout persistence path. The coaching sidebar SHALL continue to render the
coach description with its links.

#### Scenario: Editor renders and persists workout-level notes

- **GIVEN** a converted workout whose KRD carries workout-level `notes`
- **WHEN** the user opens the editor, edits the notes, and saves
- **THEN** the editor shows the notes on open, and the saved KRD reflects the edited notes

#### Scenario: Sidebar still renders coach description links

- **GIVEN** a coaching activity whose description contains a `[label](url)` link
- **WHEN** the user views the activity/workout
- **THEN** the sidebar renders the description with the link intact

