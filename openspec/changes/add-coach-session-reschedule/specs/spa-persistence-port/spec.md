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

`scripts/check-workout-date-writers.mjs` SHALL scan the SPA source, excluding tests, for every `workouts.put` and `workouts.bulkPut` call site, including calls made through `db.workouts` and `table("workouts")`. It SHALL classify each site against a registry named `WORKOUT_DATE_WRITERS`: an array of `{ file, reason, note }` objects, not a `Set` named `ALLOWLIST`, so that `check-allowlists-empty.mjs` does not apply to it. Each reason SHALL be one of:

- `date-writer`: the file changes a workout's `date`, and it SHALL also call `sessionMatch.updateDate`, or the scan SHALL fail.
- `date-preserving`: the file re-reads the workout and writes it inside one transaction, keeping the fresh `date`.
- `creator`: the file writes a new row or restores a deleted one.

The check SHALL fail on an unlisted call site, and on a registry entry that matches no call site. Generic writers that name no `workouts` literal (snapshot import, profile ops and Dexie migrations, which write through `table(name).bulkPut`) are outside the scan; the match-date heal after every import covers them, so the registry SHALL NOT carry an entry for them. A co-located `check-workout-date-writers.test.mjs` SHALL cover an unlisted writer, a `date-writer` without `updateDate`, a stale entry and a passing tree. The check SHALL run in `pnpm lint`, and its test SHALL run in `pnpm test:scripts`.

#### Scenario: Unlisted writer fails the lint

- **GIVEN** a new source file that calls `workouts.put` and is not in `WORKOUT_DATE_WRITERS`
- **WHEN** `pnpm lint` runs
- **THEN** the check SHALL fail and name the file

#### Scenario: Date writer without match re-date fails

- **GIVEN** a registered `date-writer` file that no longer calls `sessionMatch.updateDate`
- **WHEN** the check runs
- **THEN** it SHALL fail

#### Scenario: Stale registry entry fails

- **GIVEN** a `WORKOUT_DATE_WRITERS` entry whose file no longer has a `workouts.put` or `bulkPut` call site
- **WHEN** the check runs
- **THEN** it SHALL fail and name the entry

### Requirement: Workout writers do not write stale snapshots

A writer that updates an existing workout after an `await`, or from a copy held in UI state, SHALL re-read the row and write it inside one `PersistencePort.transaction`. It SHALL merge only the fields it owns and keep the re-read `date`, `coachDate` and `updatedAt`. It SHALL NOT recreate a row that no longer exists. If the fresh row's state no longer fits the writer's transition (for example, it was skipped during the AI call), the write SHALL be a no-op skip: no throw and no write. This applies to batch processing, skip and unskip, the AI convert of an existing workout and the manual template convert.

#### Scenario: A move during an AI convert survives

- **GIVEN** an existing coach-built workout on Tuesday whose AI convert is awaiting the model
- **WHEN** `moveSession` moves it to Thursday before the model returns
- **THEN** after the convert commits, the workout SHALL be structured and dated Thursday

#### Scenario: A workout skipped during the AI call is left skipped

- **GIVEN** a batch AI convert awaiting the model for a raw workout
- **WHEN** the user skips that workout before the model returns
- **THEN** the convert SHALL write nothing, SHALL NOT throw, and the workout SHALL stay skipped

#### Scenario: Skip from a stale dialog keeps the moved date

- **GIVEN** the dialog holds a workout snapshot dated Tuesday and the workout is then moved to Thursday
- **WHEN** the user skips it from that dialog
- **THEN** the workout SHALL be skipped and dated Thursday
