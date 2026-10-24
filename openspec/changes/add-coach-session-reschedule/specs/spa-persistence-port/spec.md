## ADDED Requirements

### Requirement: Date writers stamp updatedAt for cloud sync

Every writer that changes a workout's `date` (`moveSession`, `applyCoachDateMoves`) SHALL stamp the workout's `updatedAt` with the write time, and SHALL stamp the same time on the re-dated `SessionMatch`. As a result, the cloud auto-push change token SHALL advance after a move, and a moved workout and its match SHALL win the snapshot merge against an older remote copy. Because workout and match rows merge independently, the match-date heal SHALL run after every cloud import, so that a torn merge resolves to the workout's date. No Dexie schema version or index SHALL change for this: `SessionMatch.updatedAt` is optional and unindexed. Rows without it, including rows from clients that drop the field, SHALL stay valid.

#### Scenario: A move advances the change token

- **GIVEN** the change token computed before a move
- **WHEN** `moveSession` commits
- **THEN** the change token computed afterwards SHALL differ

#### Scenario: A move survives a stale remote copy

- **GIVEN** a workout moved locally to Thursday and a remote snapshot holding the same workout and match on Tuesday with older clocks
- **WHEN** the snapshots merge
- **THEN** the merged workout and match SHALL both be on Thursday

#### Scenario: A snapshot without match updatedAt imports

- **WHEN** a snapshot whose `sessionMatches` rows carry no `updatedAt` is imported
- **THEN** the import SHALL succeed and the post-import heal SHALL re-date any match whose coach-built workout is on another day

### Requirement: Workout date writers are statically guarded

`scripts/check-workout-date-writers.mjs` SHALL scan the SPA source, excluding tests, for every `workouts.put` and `workouts.bulkPut` call site, including calls made through `db.workouts` and `table("workouts")`. It SHALL fail unless each site is in its allowlist with a reason: `date-writer`, `date-preserving` or `import-exempt`. A `date-writer` file SHALL also call `sessionMatch.updateDate`, or the scan SHALL fail. Snapshot import and backup restore SHALL be `import-exempt`, because the heal covers them. A co-located `check-workout-date-writers.test.mjs` SHALL cover a failing and a passing fixture. The check SHALL run in `pnpm lint`, and its test SHALL run in `pnpm test:scripts`.

#### Scenario: Unlisted writer fails the lint

- **GIVEN** a new source file that calls `workouts.put` and is not in the allowlist
- **WHEN** `pnpm lint` runs
- **THEN** the check SHALL fail and name the file

#### Scenario: Date writer without match re-date fails

- **GIVEN** an allowlisted `date-writer` file that no longer calls `sessionMatch.updateDate`
- **WHEN** the check runs
- **THEN** it SHALL fail
