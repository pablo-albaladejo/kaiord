> Synced: 2026-06-22 (energy-balance-tracking)

# nutrition-intake Specification

## Purpose

Defines manual nutrition intake logging: per-entry energy and protein/carb/fat with an optional meal slot, plus reusable presets. Intake is persisted locally and syncs through the cloud snapshot, with tombstones for deletes.

## Requirements

### Requirement: Manual intake entry

The system SHALL let a user log a nutrition intake entry for a date with `kcal`,
`proteinG`, `carbG`, and `fatG`, plus an optional `label` and `mealSlot`
(`breakfast` | `lunch` | `dinner` | `snack`). Energy and macro values MUST be
non-negative.

#### Scenario: Logging a meal entry

- **GIVEN** the user is on a given date
- **WHEN** they save an entry of 600 kcal, 40 g protein, 60 g carb, 20 g fat for `lunch`
- **THEN** the entry is persisted for that date
- **AND** the day's intake totals increase by those amounts

#### Scenario: Rejecting negative values

- **WHEN** the user submits an intake entry with a negative kcal or macro value
- **THEN** the system rejects the entry
- **AND** no entry is persisted

### Requirement: Reusable intake presets

The system SHALL let a user save a reusable intake preset (`label`, `kcal`,
`proteinG`, `carbG`, `fatG`, optional default `mealSlot`) and create an intake entry
from it in one action.

#### Scenario: Logging from a saved preset

- **GIVEN** a saved preset "my usual breakfast"
- **WHEN** the user applies the preset to today
- **THEN** an intake entry is created for today with the preset's values

### Requirement: Synced intake persistence

Intake entries and presets SHALL be persisted locally and SHALL travel in the cloud snapshot and the backup, each carrying an `updatedAt` clock so the newest edit wins, and a delete SHALL record a tombstone so it propagates.

#### Scenario: Intake included in snapshot

- **GIVEN** intake entries and presets exist for a profile
- **WHEN** a cloud snapshot is produced
- **THEN** the snapshot contains them, each with its `updatedAt`
