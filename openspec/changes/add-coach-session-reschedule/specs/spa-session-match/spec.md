## MODIFIED Requirements

### Requirement: SessionMatch aggregate

A `SessionMatch` SHALL be a domain aggregate that links exactly one `CoachingActivityRecord` (the planned side) with exactly one `WorkoutRecord` (the executed side) within the same profile. It SHALL be shaped:

```
{
  id: string,                       // nanoid()
  profileId: string,                // owning profile
  coachingActivityId: string,       // composite id from spa-coaching-integration
  workoutId: string,                // WorkoutRecord.id
  date: string,                     // YYYY-MM-DD — the session's effective date
  createdAt: string,                // ISO timestamp from injected clock
  updatedAt?: string,               // ISO timestamp of the last re-date (optional)
  source: "manual" | "auto-suggestion" | "auto-conversion",
  executedWorkoutIds: string[]      // executed recordings auto-linked to the slot
}
```

`date` SHALL be the session's effective date. It is set at creation from the coaching activity's date. Every writer that changes the matched workout's `date` (`moveSession`, `applyCoachDateMoves`) and the match-date heal SHALL re-date the match to the workout's `date` and stamp `updatedAt`. A row without `updatedAt` SHALL remain valid, and its merge clock SHALL be `createdAt`.

The `source` field SHALL distinguish three provenance cases for analytics and bug triage:

- `"manual"`: the user explicitly invoked match via the dialog "Match to…" action.
- `"auto-suggestion"`: the user accepted an auto-match suggestion produced by `autoMatchSessions`. Accepting a suggestion is recorded as `"auto-suggestion"`, NOT `"manual"`, so analytics can distinguish heuristic acceptance from explicit picker selection.
- `"auto-conversion"`: the use case `convertCoachingActivity` produced a workout from a coaching activity and auto-linked them.

The `(profileId, coachingActivityId)` pair MUST be unique — a single planned activity SHALL NOT be matched to more than one workout. The `(profileId, workoutId)` pair MUST be unique within a profile — a single workout SHALL NOT be matched to more than one planned activity in the same profile. Across profiles, the same `WorkoutRecord` MAY be matched to different planned activities (one per profile) because workouts are profile-agnostic per `spa-coaching-integration`; the `SessionMatch` aggregate is profile-scoped and these matches are independent. Deleting a profile cascades only to that profile's `sessionMatches` rows.

These uniqueness invariants are enforced by the `SessionMatchRepository` adapter and surfaced as errors at the application layer; they are not silently overwritten. `SessionMatch` SHALL NOT be created if either side does not exist or if the coaching activity belongs to a different profile.

#### Scenario: Same workout matched in two profiles

- **WHEN** workout `W` is matched to activity `A1` in profile `P1`, and the user (also operating profile `P2` with the same workout visible) calls `matchSession({ profileId: P2, coachingActivityId: A2, workoutId: W })`
- **THEN** a second `SessionMatch` row is persisted in `P2`; the `P1` row is unchanged; the two are independent and do not violate uniqueness (which is scoped per profile)

#### Scenario: Profile delete cascades only to that profile's matches

- **WHEN** profile `P1` is deleted and workout `W` was matched in both `P1` and `P2`
- **THEN** the `P1` `sessionMatches` row is deleted; the `P2` row is untouched

#### Scenario: Cannot double-match a planned activity

- **WHEN** activity `A` is already matched to workout `W1` and the use case is called again with the same `A` and a different workout `W2`
- **THEN** the use case throws `SessionAlreadyMatchedError`; no row is written; the existing `(A, W1)` row is unchanged

#### Scenario: Cannot double-match a workout

- **WHEN** workout `W` is already matched to activity `A1` and the use case is called again with `W` and a different activity `A2`
- **THEN** the use case throws `SessionAlreadyMatchedError`; no row is written

#### Scenario: Cross-profile match rejected

- **WHEN** activity `A` belongs to profile `P1` and the call is `matchSession({ profileId: P2, coachingActivityId: A, workoutId: W })`
- **THEN** the use case throws `CrossProfileMatchError`; no row is written

#### Scenario: A legacy match without updatedAt parses

- **WHEN** a `SessionMatch` row without `updatedAt` is read or imported
- **THEN** it SHALL parse and its merge clock SHALL be its `createdAt`

#### Scenario: A re-dated match wins the merge

- **GIVEN** a local match re-dated to Thursday with `updatedAt` T2 and a remote copy of the same id dated Tuesday with only `createdAt` T1 < T2
- **WHEN** the snapshots merge
- **THEN** the merged match SHALL be dated Thursday

## ADDED Requirements

### Requirement: SessionMatchRepository re-dates and lists matches

`SessionMatchRepository` SHALL expose:

- `updateDate(matchId, date, updatedAt)`, which rewrites the row's `date` and `updatedAt` in place, keeping its id, its links and its executed ids. It SHALL be a no-op when the row does not exist. It MUST reject a `date` that is not `YYYY-MM-DD` without writing. Inside `PersistencePort.transaction` it SHALL commit or roll back with the caller's other writes.
- `listByActivityIds(profileId, coachingActivityIds)`, which returns the profile's matches of those activities whatever their date, through the `[profileId+coachingActivityId]` index.
- `listByProfile(profileId)`, which returns every match of the profile.

The Dexie and in-memory adapters SHALL behave identically.

#### Scenario: Re-date an existing match

- **GIVEN** a match dated 2026-10-20 with two executed ids
- **WHEN** `updateDate(id, "2026-10-22", T)` runs
- **THEN** the row SHALL be dated 2026-10-22 with `updatedAt` T and keep the same links and executed ids, and the week query for 2026-10-22 SHALL return it

#### Scenario: Missing row is a no-op

- **WHEN** `updateDate` is called for an id that does not exist
- **THEN** it SHALL resolve and write nothing

#### Scenario: Malformed date is rejected

- **WHEN** `updateDate(id, "22/10/2026", T)` is called
- **THEN** it SHALL reject and the row SHALL be unchanged

#### Scenario: Matches of activities in another week

- **GIVEN** activity A on 2026-10-25 whose match is dated 2026-10-26
- **WHEN** `listByActivityIds(profileId, [A])` runs
- **THEN** it SHALL return that match

### Requirement: Match dates are healed to their workout's date

`healMatchDates({ profileId })` SHALL re-date every match M of the profile to its workout W's `date`, and stamp `updatedAt`, when W exists, `W.coachDate` is defined and `W.date !== M.date`. Each write SHALL re-read inside its own transaction. It SHALL NOT touch a match whose workout has no `coachDate` (a manual cross-day match). It SHALL run once per app session per profile after the database opens, and after every cloud import completes. It SHALL report only a count, with no ids.

#### Scenario: Stale coach-built match is healed

- **GIVEN** a coach-built workout on Thursday whose match is still dated Tuesday
- **WHEN** the heal runs
- **THEN** the match SHALL be dated Thursday with a new `updatedAt`

#### Scenario: Manual cross-day match is left alone

- **GIVEN** a workout without `coachDate` on Thursday, manually matched to a Tuesday plan with the match dated Tuesday
- **WHEN** the heal runs
- **THEN** the match SHALL stay dated Tuesday

#### Scenario: Torn merge is healed after import

- **GIVEN** a cloud import that brings the workout from device A dated Thursday and its match from device B dated Tuesday
- **WHEN** the import completes
- **THEN** the match SHALL be dated Thursday

### Requirement: Executed auto-link never links a recording twice

The executed auto-link SHALL consider a recording taken when any input match lists it as `workoutId` or in `executedWorkoutIds`, or when the same pass has already appended it to another match. It SHALL NOT append a taken recording to another match. A recording on a match's effective `date` with the match's canonical sport that is not taken SHALL be appended.

#### Scenario: Recording on the moved day is linked

- **GIVEN** a run session moved to Thursday and an untaken run recording on Thursday
- **WHEN** the auto-link runs
- **THEN** the recording SHALL be appended to the moved session's match

#### Scenario: Recording held by another match is not linked

- **GIVEN** two run matches on Thursday and a run recording already in the first match's `executedWorkoutIds`
- **WHEN** the auto-link runs
- **THEN** the recording SHALL NOT be appended to the second match
