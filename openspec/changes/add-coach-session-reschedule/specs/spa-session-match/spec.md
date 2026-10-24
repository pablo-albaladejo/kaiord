## ADDED Requirements

### Requirement: SessionMatch date is the session's effective date

A `SessionMatch` SHALL carry `date` (`YYYY-MM-DD`) and an optional `updatedAt` (ISO datetime). `date` SHALL be the session's effective date: it is set at creation from the coaching activity's date, and every writer that changes the matched workout's `date` (`moveSession`, `applyCoachDateMoves`) SHALL re-date the match to the workout's new date in the same transaction and stamp `updatedAt`. A row without `updatedAt` SHALL remain valid. The snapshot merge SHALL compare `updatedAt` when present, else `createdAt`, so a re-dated match wins against an older copy of itself.

#### Scenario: A legacy match without updatedAt parses

- **WHEN** a `SessionMatch` row without `updatedAt` is read or imported
- **THEN** it SHALL parse and its merge clock SHALL be its `createdAt`

#### Scenario: A re-dated match wins the merge

- **GIVEN** a local match re-dated to Thursday with `updatedAt` T2 and a remote copy of the same id dated Tuesday with only `createdAt` T1 < T2
- **WHEN** the snapshots merge
- **THEN** the merged match SHALL be dated Thursday

### Requirement: SessionMatchRepository re-dates a match

`SessionMatchRepository` SHALL expose `updateDate(matchId, date, updatedAt)`, which rewrites the row's `date` and `updatedAt` in place, keeping its id, its activity and workout links and its executed ids. It SHALL be a no-op when the row does not exist and MUST reject a `date` that is not `YYYY-MM-DD` without writing. Called inside `PersistencePort.transaction`, it SHALL commit or roll back with the caller's other writes. The Dexie and the in-memory adapters SHALL behave identically.

#### Scenario: Re-date an existing match

- **GIVEN** a match dated 2026-10-20 with two executed ids
- **WHEN** `updateDate(id, "2026-10-22", T)` runs
- **THEN** the row SHALL be dated 2026-10-22 with `updatedAt` T and the same links and executed ids, and the week query for 2026-10-22 SHALL return it

#### Scenario: Missing row is a no-op

- **WHEN** `updateDate` is called for an id that does not exist
- **THEN** it SHALL resolve and write nothing

#### Scenario: Malformed date is rejected

- **WHEN** `updateDate(id, "22/10/2026", T)` is called
- **THEN** it SHALL reject and the row SHALL be unchanged
