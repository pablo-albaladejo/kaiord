## ADDED Requirements

### Requirement: Synced intake persistence

Intake entries and presets SHALL be persisted locally and SHALL travel in the cloud snapshot and the backup, each carrying an `updatedAt` clock so the newest edit wins, and a delete SHALL record a tombstone so it propagates.

#### Scenario: Intake included in snapshot

- **GIVEN** intake entries and presets exist for a profile
- **WHEN** a cloud snapshot is produced
- **THEN** the snapshot contains them, each with its `updatedAt`

## REMOVED Requirements

### Requirement: Device-local intake persistence

**Reason**: Nutrition now syncs with the cloud snapshot so a second device sees the intake log and presets, and the backup restores them with tombstones.

**Migration**: Dexie v37 backfills `updatedAt` on existing rows; no user action is needed. See "Synced intake persistence".
