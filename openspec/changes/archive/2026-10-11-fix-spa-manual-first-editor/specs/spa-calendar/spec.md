## ADDED Requirements

### Requirement: Manual use is the main path

Every journey SHALL be completable by hand, without a connected source, an AI key or a browser extension. Manual surfaces (the editor, the detail views and their dialogs) SHALL be canonical; the conversation SHALL be an accelerator that calls the same use cases, and integrations SHALL be optional accelerators that feed the same tables. The first run SHALL propose creating a workout, importing a file and logging wellness, and SHALL present integrations as optional; empty-state copy SHALL NOT assume a coach. The setup checklist SHALL count only steps a user can complete by hand. The readiness card SHALL offer manual entry when it has no data. A manually scheduled session SHALL count as a source of planned sessions.

#### Scenario: First run without integrations

- **GIVEN** a fresh profile with nothing connected
- **WHEN** the calendar renders its first run
- **THEN** it offers "Add a workout", "Import a file" and "Log wellness", and integrations appear as optional

#### Scenario: Checklist completes by hand

- **GIVEN** a profile with no connection, bridge or export
- **WHEN** the user creates a workout, sets a threshold, logs wellness and saves a workout to the library
- **THEN** the setup checklist reaches 100% and steps aside

#### Scenario: Readiness without data

- **WHEN** the readiness card has no score
- **THEN** it offers to log HRV and sleep by hand

#### Scenario: Manual planning is a source

- **GIVEN** a workout scheduled by hand
- **WHEN** the connections page lists planned sessions
- **THEN** the row has a source and does not read "No source"

### Requirement: The step editor speaks the athlete's units

The step editor SHALL take duration as `m:ss` (or `h:mm:ss`) and pace as `m:ss` per kilometre or mile, or per 100 m or 100 yd for swimming, following the workout's sport and the units preference; storage SHALL remain seconds and metres per second, so a value typed survives an export and a reimport. Each step SHALL have an intensity, and a new workout's first step SHALL be a warm-up. Workout metadata SHALL open read-only. The FTP provenance line SHALL show only when some target depends on FTP. The threshold dialog SHALL open on the active sport; pace sports SHALL lead with pace and LTHR and mark FTP optional; the zone method shown SHALL be the one the stored zones were built with, and a change SHALL say it was saved.

#### Scenario: Pace typed per kilometre survives a round trip

- **GIVEN** a running workout of four steps of 3:00 at 4:30/km typed in the step editor
- **WHEN** the workout is exported to FIT and the file imported back
- **THEN** every step reads 3:00 at 4:30 min/km

#### Scenario: Thresholds open on the active sport

- **GIVEN** Running is the active sport on the athlete page
- **WHEN** the user opens the threshold dialog
- **THEN** the Running tab is selected, pace and LTHR come first and FTP is marked optional
