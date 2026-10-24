## ADDED Requirements

### Requirement: Date writers stamp updatedAt for cloud sync

Every writer that changes a workout's `date` (`moveSession`, `applyCoachDateMoves`) SHALL stamp the workout's `updatedAt` with the write time, and SHALL stamp the same time on the re-dated `SessionMatch`. As a result the cloud auto-push change token SHALL advance after a move, and a moved workout and its match SHALL win the snapshot merge against an older remote copy. No Dexie schema version or index SHALL change for this: `SessionMatch.updatedAt` and `ExportLedgerEntry.destinationDate` are optional, unindexed fields, and rows without them SHALL stay valid.

#### Scenario: A move advances the change token

- **GIVEN** the change token computed before a move
- **WHEN** `moveSession` commits
- **THEN** the change token computed afterwards SHALL differ

#### Scenario: A move survives a stale remote copy

- **GIVEN** a workout moved locally to Thursday and a remote snapshot holding the same workout and match on Tuesday with older clocks
- **WHEN** the snapshots merge
- **THEN** the merged workout and match SHALL both be on Thursday
