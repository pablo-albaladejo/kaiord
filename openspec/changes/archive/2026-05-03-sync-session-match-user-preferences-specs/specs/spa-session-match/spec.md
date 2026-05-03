## ADDED Requirements

### Requirement: SessionMatch aggregate

A `SessionMatch` SHALL be a domain aggregate that links exactly one `CoachingActivityRecord` (the planned side) with exactly one `WorkoutRecord` (the executed side) within the same profile. It SHALL be shaped:

```
{
  id: string,                       // nanoid()
  profileId: string,                // owning profile
  coachingActivityId: string,       // composite id from spa-coaching-integration
  workoutId: string,                // WorkoutRecord.id
  createdAt: string,                // ISO timestamp from injected clock
  source: "manual" | "auto-suggestion" | "auto-conversion"
}
```

The `source` field SHALL distinguish three provenance cases for analytics and bug triage:

- `"manual"`: the user explicitly invoked match via the dialog "Match to…" action.
- `"auto-suggestion"`: the user accepted an auto-match suggestion produced by `autoMatchSessions`.
- `"auto-conversion"`: the use case `convertCoachingActivity` produced a workout from a coaching activity and auto-linked them.

The `(profileId, coachingActivityId)` pair MUST be unique. The `(profileId, workoutId)` pair MUST be unique within a profile. Across profiles, the same `WorkoutRecord` MAY be matched to different planned activities (one per profile). Deleting a profile cascades only to that profile's `sessionMatches` rows.

#### Scenario: Same workout matched in two profiles

- **WHEN** workout `W` is matched in profile `P1`, and the user calls `matchSession({ profileId: P2, coachingActivityId: A2, workoutId: W })`
- **THEN** a second `SessionMatch` row is persisted in `P2`; the `P1` row is unchanged

#### Scenario: Profile delete cascades only to that profile's matches

- **WHEN** profile `P1` is deleted and workout `W` was matched in both `P1` and `P2`
- **THEN** the `P1` `sessionMatches` row is deleted; the `P2` row is untouched

#### Scenario: Cannot double-match a planned activity

- **WHEN** activity `A` is already matched and the use case is called again with the same `A` and a different workout
- **THEN** `SessionAlreadyMatchedError` is thrown; no row is written

#### Scenario: Cannot double-match a workout

- **WHEN** workout `W` is already matched and the use case is called again with `W` and a different activity
- **THEN** `SessionAlreadyMatchedError` is thrown; no row is written

#### Scenario: Cross-profile match rejected

- **WHEN** activity `A` belongs to profile `P1` and the call is `matchSession({ profileId: P2, coachingActivityId: A, workoutId: W })`
- **THEN** `CrossProfileMatchError` is thrown

### Requirement: matchSession use case

The application SHALL expose `matchSession(input, deps): Promise<SessionMatch>` taking `{ profileId, coachingActivityId, workoutId, source? }` and `{ clock, idGenerator, repository, coachingRepository, workoutRepository }`. The use case reads both records, validates uniqueness, and persists a new `SessionMatch` with `id: idGenerator()`, `createdAt: clock()`, and `source: input.source ?? "manual"`. Implementations MUST NOT call `Date.now()` or `nanoid()` directly inside the use case.

#### Scenario: Successful manual match

- **WHEN** the user accepts a suggestion or invokes "Match to…"
- **THEN** `matchSession` runs, a `SessionMatch` row is written with the call site's `source`

#### Scenario: id and createdAt come from injected deps

- **WHEN** the test injects `idGenerator: () => "M1"` and `clock: () => "2026-05-01T12:00:00Z"`
- **THEN** the persisted row has `id: "M1"` and `createdAt: "2026-05-01T12:00:00Z"` exactly

#### Scenario: Activity not found

- **WHEN** `matchSession` is called with a missing `coachingActivityId`
- **THEN** `CoachingActivityNotFoundError` is thrown; no row is written

#### Scenario: Workout not found

- **WHEN** `matchSession` is called with a missing `workoutId`
- **THEN** `WorkoutNotFoundError` is thrown; no row is written

### Requirement: unmatchSession use case

The application SHALL expose `unmatchSession({ profileId, matchId })` which deletes the `SessionMatch` row identified by `matchId` if and only if its `profileId` matches the caller's profile. The use case SHALL be idempotent — deleting a match that does not exist completes silently. `unmatchSession` SHALL NOT delete the underlying records.

#### Scenario: Unmatch a previously matched session

- **WHEN** the user clicks "Split" on a `MatchedSessionCard`
- **THEN** the `SessionMatch` row is deleted; the underlying records are untouched

#### Scenario: Unmatch is idempotent

- **WHEN** `unmatchSession` is called with a `matchId` that no longer exists
- **THEN** the use case completes silently; no error is thrown

#### Scenario: Cross-profile unmatch rejected

- **WHEN** match `M` belongs to profile `P1` and `unmatchSession({ profileId: P2, matchId: M })` is called
- **THEN** `CrossProfileMatchError` is thrown; the row is NOT deleted

### Requirement: SessionMatchRepository port

The infrastructure layer SHALL implement `SessionMatchRepository` exposing `put`, `getByActivityId`, `getByWorkoutId`, `listByProfileAndWeek`, `delete` (idempotent), `deleteByActivityId` (cascade), and `deleteByWorkoutId` (cascade). The Dexie adapter SHALL register cascade hooks so deleting a `coachingActivities` or `workouts` row deletes the corresponding `sessionMatches` row(s) atomically.

#### Scenario: Cascade on coaching activity delete

- **WHEN** a `coachingActivities` row is deleted and that activity was matched
- **THEN** the corresponding `sessionMatches` row is also deleted

#### Scenario: Cascade on workout delete

- **WHEN** a `workouts` row is deleted and that workout was matched
- **THEN** the corresponding `sessionMatches` row is also deleted

#### Scenario: Repository rejects double-match

- **WHEN** `put` is called with a `SessionMatch` whose `(profileId, coachingActivityId)` already exists for a different `id`
- **THEN** the call rejects with `SessionAlreadyMatchedError`

### Requirement: autoMatchSessions suggestion engine

The application SHALL expose `autoMatchSessions({ profileId, weekStart })` which returns a `MatchSuggestion[]` WITHOUT writing any `SessionMatch` rows. Each suggestion has `{ activityId, workoutId, score: number | null, reasons }`. The heuristic enumerates same-day same-sport-family pairs, computes `computeComplianceScore`, filters to `score >= 0.6` OR `score === null` (duration-unknown bypass), and applies greedy assignment with deterministic tiebreaker (`(rank, activityId, workoutId)`). The use case SHALL be deterministic. The use case SHALL NOT consult `autoMatchDismissals` — dismissal filtering is the responsibility of the `useAutoMatchSuggestions` hook.

#### Scenario: Single obvious pair suggested

- **WHEN** the week has one swim activity (45min) and one swim workout (42min) on the same day
- **THEN** `autoMatchSessions` returns one suggestion with score ≥ 0.9; no `SessionMatch` row is written

#### Scenario: Greedy assignment

- **WHEN** Monday has a planned swim and bike, and an executed swim and bike
- **THEN** the use case returns two non-overlapping suggestions

#### Scenario: Score below threshold filtered out

- **WHEN** a planned 60-min run pairs with an executed 20-min run (score 0.33)
- **THEN** no suggestion is returned

#### Scenario: Already-matched activity skipped

- **WHEN** activity `A` already has a `SessionMatch` row
- **THEN** no suggestion is returned for `A`

#### Scenario: Missing duration treated as null score

- **WHEN** the planned activity has `duration: undefined` and a same-day same-sport workout exists
- **THEN** the suggestion is returned with `score: null` and `reasons[1] = { code: "duration-unknown" }`

#### Scenario: Tied scores broken deterministically

- **WHEN** two candidate pairs have identical scores `(A1, W1)` and `(A2, W2)` where `A1 < A2`
- **THEN** `(A1, W1)` is placed before `(A2, W2)` and conflicts are resolved deterministically

#### Scenario: No writes on suggestion enumeration

- **WHEN** `autoMatchSessions` is called
- **THEN** the `sessionMatches` table is unchanged

### Requirement: Sport family canonical mapping

The application SHALL expose `canonicalSportFamily(sport: string): string` in `application/canonical-sport-family.ts`. The function MUST return a lowercase ASCII family identifier. Initial families: `"swimming"`, `"cycling"`, `"running"`, `"strength"`. Unmapped sports SHALL each occupy their own family (NOT collapsed into a single "other" pool, to avoid cross-sport false positives like `yoga` matching `kayaking`).

#### Scenario: Swim variants share family

- **WHEN** `canonicalSportFamily("open_water_swim")` and `canonicalSportFamily("lap_swimming")` are called
- **THEN** both return `"swimming"`

#### Scenario: Unmapped sport does not collapse

- **WHEN** `canonicalSportFamily("yoga")` and `canonicalSportFamily("kayaking")` are called
- **THEN** they return distinct values; auto-match does NOT pair a yoga plan with a kayaking workout

### Requirement: Compliance score derivation

A pure function `computeComplianceScore(planDur, actualDur): number | null` returns `null` when either input is undefined, when `planDur === 0` (division-by-zero guard), or when either is NaN. Otherwise returns `clamp(1 - |planDur - actualDur| / planDur, 0, 1)`. The score SHALL NOT be persisted on `SessionMatch` — it is a derived projection.

#### Scenario: Hit-target compliance

- **WHEN** `computeComplianceScore(2700, 2580)` is called
- **THEN** the result is approximately `0.956`

#### Scenario: Off-target compliance

- **WHEN** `computeComplianceScore(3600, 1800)` is called
- **THEN** the result is `0.5`

#### Scenario: Missing duration on either side

- **WHEN** either input is `undefined`
- **THEN** the result is `null`

#### Scenario: Division-by-zero guard

- **WHEN** `computeComplianceScore(0, 1800)` is called
- **THEN** the result is `null`

#### Scenario: NaN guard

- **WHEN** either input is `NaN`
- **THEN** the result is `null`

### Requirement: Compliance score limitations (v1)

The v1 score SHALL be **symmetric** — overshoot and undershoot of the planned duration produce identical scores. Both `computeComplianceScore(3600, 1800)` and `computeComplianceScore(3600, 5400)` yield `0.5`. This is a known v1 limitation.

#### Scenario: Symmetric compliance for overshoot and undershoot

- **WHEN** `computeComplianceScore(3600, 1800)` and `computeComplianceScore(3600, 5400)` are called
- **THEN** both return `0.5`

#### Scenario: Symmetric high-end compliance

- **WHEN** `computeComplianceScore(2700, 2580)` and `computeComplianceScore(2700, 2820)` are called
- **THEN** both return ≈ `0.956`

### Requirement: useAutoMatchSuggestions view-model hook

The application layer SHALL expose `useAutoMatchSuggestions(profileId, weekStart): MatchSuggestion[]` returning auto-match suggestions filtered by the per-pair dismissal model. The hook composes (1) `autoMatchSessions` and (2) a reactive `useLiveQuery` read of the `autoMatchDismissals` row's `dismissedPairs`. The hook filters the raw suggestion list at render time: each `(activityId, workoutId)` is included if and only if `dismissedPairs` contains no entry matching that pair. There is NO clock-based suppression. The hook re-evaluates when `profileId`, `weekStart`, the `autoMatchDismissals` row, the `sessionMatches` table, or the underlying `coachingActivities`/`workouts` rows change.

#### Scenario: Suggestion filtered out by per-pair dismissal

- **GIVEN** `autoMatchSessions` returns `[(A1, X1), (A2, X2), (A3, X3)]` AND `dismissedPairs` contains `(A2, X2)`
- **WHEN** the hook evaluates
- **THEN** the hook returns `[(A1, X1), (A3, X3)]`

#### Scenario: All suggestions dismissed

- **WHEN** every suggestion matches a `dismissedPairs` entry
- **THEN** the hook returns `[]`

#### Scenario: Re-evaluates after match creation

- **WHEN** the user accepts one suggestion
- **THEN** the accepted pair no longer appears in subsequent results

#### Scenario: Different week unaffected

- **GIVEN** `(A, X)` is dismissed on `weekStart = "2026-05-04"`
- **WHEN** the user navigates to `weekStart = "2026-05-11"` and that week's suggestions involve different ids
- **THEN** the hook returns the new week's suggestions unaffected by the prior week's dismissals

### Requirement: Auto-match suggestion banner

The calendar SHALL render an auto-match suggestion banner above the week grid when `useAutoMatchSuggestions(profileId, weekStart)` returns at least one suggestion. The banner is a thin presentation layer — the hook owns per-pair dismissal filtering. The banner SHALL list each suggestion with planned activity title, workout title, compliance percentage, and per-row Accept/Reject controls. **No "Dismiss-all" control** — the per-pair model has no notion of week-level suppression.

The banner SHALL be visually bounded: at most 2 suggestion rows in collapsed state (`max-h-32`), expandable to all rows in a `max-h-64` container with internal scroll. For accessibility, the banner is `role="region"` with `aria-label="Auto-match suggestions"` and contains a visually-hidden `aria-live="polite"` status element. On banner appearance, the status emits `"Auto-match suggestions: <N> pending"`. Accept emits `"Session matched. <remaining> suggestions remaining."`. Reject emits `"Suggestion dismissed. <remaining> suggestions remaining."`. On auto-hide (last suggestion processed), focus moves to the first focusable element in `CalendarWeekGrid` (fallback: the grid container with `tabindex="-1"`).

Accepting invokes `matchSession` with `source: "auto-suggestion"`. Rejecting invokes `dismissAutoMatchBanner({ profileId, weekStart, activityId, workoutId })` (per-pair persistence). The banner hides automatically once all suggestions are processed.

#### Scenario: Banner appears with suggestions

- **WHEN** the calendar mounts and the hook returns 3 suggestions
- **THEN** the banner shows 3 rows with Accept/Reject controls

#### Scenario: Accept individual suggestion

- **WHEN** the user clicks Accept on one of three rows
- **THEN** `matchSession` runs with `source: "auto-suggestion"`; the row is removed; status emits `"Session matched. 2 suggestions remaining."`

#### Scenario: Reject persists per-pair dismissal

- **WHEN** the user clicks Reject on a row for pair `(A, X)`
- **THEN** `dismissAutoMatchBanner({ profileId, weekStart, activityId: A, workoutId: X })` runs; the row is removed reactively; no `SessionMatch` is written; status emits `"Suggestion dismissed. <remaining> suggestions remaining."`; subsequent re-runs of `autoMatchSessions` continue to produce the pair, but the hook filters it out

#### Scenario: All suggestions processed hides banner

- **WHEN** all suggestions are accepted or rejected
- **THEN** the banner is hidden; focus moves to the first focusable element in `CalendarWeekGrid`

#### Scenario: View-all expands banner

- **WHEN** 5 suggestions exist and the banner shows "Showing 2 of 5 — view all"
- **THEN** clicking "view all" expands inline to all 5 rows in a scrollable `max-h-64` container; toggle becomes "Collapse" with `aria-expanded="true"`

#### Scenario: Banner is announced to assistive tech

- **WHEN** the banner first renders after a sync
- **THEN** the live-region announcement "Auto-match suggestions: 3 pending" is emitted without stealing focus

## MODIFIED Requirements

### Requirement: Cascade hooks on coaching-activity and workout deletion

The Dexie adapters SHALL register cascade hooks so that:

- Deleting a `coachingActivities` row SHALL also delete every `sessionMatches` row whose `coachingActivityId` equals the deleted activity's id, AND SHALL purge every `dismissedPairs` entry whose `activityId` equals the deleted activity's id from any `autoMatchDismissals` row in the same profile.
- Deleting a `workouts` row SHALL also delete every `sessionMatches` row whose `workoutId` equals the deleted workout's id, AND SHALL purge every `dismissedPairs` entry whose `workoutId` equals the deleted workout's id from any `autoMatchDismissals` row across all profiles (workouts are profile-agnostic).

Both cascades SHALL run inside the same Dexie transaction as the parent delete. A crash mid-cascade SHALL leave the database in the pre-delete state.

In particular: deleting a `coachingActivities` row SHALL run inside `db.transaction('rw', [coachingActivities, sessionMatches, autoMatchDismissals], ...)`. Deleting a `workouts` row SHALL run inside `db.transaction('rw', [workouts, sessionMatches, autoMatchDismissals], ...)`. Deleting a `profiles` row SHALL run inside a transaction covering `profiles`, `coachingActivities`, `sessionMatches`, `userPreferences`, and `autoMatchDismissals` — orchestrated by an explicit `deleteProfile(profileId)` use case.

**Cascade-table inventory** — the authoritative list of cascade tables per parent SHALL be co-located with the Dexie adapter (e.g., `CASCADE_TABLES` in `adapters/dexie/cascade-tables.ts`) and unit-tested:

| Parent table         | Cascade tables                                                                   |
| -------------------- | -------------------------------------------------------------------------------- |
| `coachingActivities` | `sessionMatches`, `autoMatchDismissals`                                          |
| `workouts`           | `sessionMatches`, `autoMatchDismissals`                                          |
| `profiles`           | `coachingActivities`, `sessionMatches`, `userPreferences`, `autoMatchDismissals` |

A unit test SHALL assert `CASCADE_TABLES` matches this inventory exactly. Adding a new cascade table anywhere SHALL fail the test until the inventory and the orchestrator transaction's table list are updated together.

#### Scenario: Coaching-activity delete cascades to sessionMatches and dismissedPairs

- **GIVEN** activity `A` is matched to workout `X` AND `(A, X)` is recorded in `dismissedPairs` for `(P, weekStart)`
- **WHEN** activity `A` is deleted via the Dexie adapter
- **THEN** the matching `sessionMatches` row is deleted; the `(A, X)` entry is removed from `dismissedPairs`; both deletions are visible after the transaction commits and remain partial-rollback-safe on transaction abort

#### Scenario: Workout delete cascades to sessionMatches and dismissedPairs

- **GIVEN** workout `X` is matched to activity `A` AND `(A, X)` is recorded in `dismissedPairs` for `(P, weekStart)`
- **WHEN** workout `X` is deleted via the Dexie adapter
- **THEN** the matching `sessionMatches` row is deleted; the `(A, X)` entry is removed from `dismissedPairs`

#### Scenario: Mid-cascade crash leaves no partial state

- **GIVEN** the workout-delete cascade is mid-flight and the `dismissedPairs` purge throws
- **WHEN** the transaction aborts
- **THEN** the `workouts` row is NOT deleted; the `sessionMatches` row is NOT deleted; `dismissedPairs` is unchanged

#### Scenario: Cascade table inventory is enumerated and tested

- **WHEN** a developer adds a new cascade hook without updating `CASCADE_TABLES`
- **THEN** the inventory unit test fails immediately

#### Scenario: Profile delete is atomic across all cascade tables

- **WHEN** profile `P` is deleted while it has rows in all four cascade-targeted tables
- **THEN** all five operations commit atomically; partial failure rolls back to the pre-delete state
