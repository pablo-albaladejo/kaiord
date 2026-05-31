## ADDED Requirements

### Requirement: Deletes record tombstones

Delete operations through `PersistencePort` SHALL record a tombstone so that deletions can propagate across devices during cloud sync. The system SHALL provide a `tombstones` Dexie table with primary key `[table+id]` and fields `table`, `id`, `deletedAt` (ISO 8601), and optional `profileId`. Tombstone writing SHALL be implemented as a decorator over `PersistencePort` so that every delete records its tombstone at a single chokepoint, requiring no changes at individual call sites. The tombstone write SHALL occur in the same transaction as the underlying delete, so a failed delete leaves no tombstone and a committed delete always leaves one.

#### Scenario: Deleting a workout records a tombstone

- **WHEN** a workout is deleted via the decorated `PersistencePort`
- **THEN** a `tombstones` row with `table = "workouts"`, the workout's `id`, and a `deletedAt` timestamp SHALL exist after the delete commits

#### Scenario: Tombstone and delete are atomic

- **GIVEN** the underlying delete fails and rolls back
- **WHEN** the operation completes
- **THEN** no tombstone SHALL be recorded for that record

#### Scenario: Call sites are unchanged

- **WHEN** existing application code calls a repository `delete`/`deleteByProfile` method
- **THEN** the tombstone SHALL be recorded by the decorator without that call site passing any extra argument

### Requirement: Tombstone schema migration

The Dexie schema SHALL bump from version 18 to version 19 to add the `tombstones` table. The migration SHALL be additive (a new empty table) and SHALL run automatically on first load of the new code without altering existing tables' data.

#### Scenario: Additive upgrade on existing database

- **GIVEN** a browser holding a version 18 `kaiord-spa` database
- **WHEN** the version 19 code loads
- **THEN** the `tombstones` table SHALL be created and all existing tables' rows SHALL remain intact
