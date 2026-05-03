> Synced: 2026-05-03 (sync-session-match-user-preferences-specs)

# spa-session-match Specification

## Purpose

Models the linkage between a planned coaching activity and the executed workout that fulfills it (`SessionMatch`), the application use cases that create / remove / suggest those links (`matchSession`, `unmatchSession`, `autoMatchSessions`), the per-pair dismissal model that suppresses rejected auto-match suggestions, and the cascade hooks that keep links + dismissals coherent when underlying activities / workouts / profiles are deleted. The compliance-score projection (`computeComplianceScore`) is included because both the banner UI and analytics consume it.

## Requirements

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

### Requirement: matchSession use case

The application SHALL expose `matchSession(input: MatchSessionInput, deps: MatchSessionDeps): Promise<SessionMatch>`:

```
type MatchSessionInput = {
  profileId: string,
  coachingActivityId: string,
  workoutId: string,
  source?: "manual" | "auto-suggestion" | "auto-conversion"   // default "manual"; production call sites MUST pass source explicitly
}

type MatchSessionDeps = {
  clock: () => string,                          // ISO timestamp source — MUST be injected for determinism
  idGenerator: () => string,                    // SessionMatch.id source (e.g., nanoid()) — MUST be injected
  repository: SessionMatchRepository,
  coachingRepository: CoachingRepository,
  workoutRepository: WorkoutRepository
}
```

The use case:

1. Reads the `CoachingActivityRecord` by id; throws `CoachingActivityNotFoundError` when missing, `CrossProfileMatchError` when the row exists but belongs to a different profile.
2. Reads the `WorkoutRecord` by id; throws `WorkoutNotFoundError` when missing. (Workouts are profile-agnostic; cross-profile is enforced via the activity side only.)
3. Checks uniqueness invariants via `repository.getByActivityId` and `repository.getByWorkoutId`; throws `SessionAlreadyMatchedError` on violation.
4. Persists a new `SessionMatch` via `repository.put`, with `id: idGenerator()`, `createdAt: clock()`, and `source: input.source ?? "manual"`.
5. Returns the persisted match.

The `clock` and `idGenerator` injections are normative — implementations MUST NOT call `Date.now()`, `new Date().toISOString()`, or `nanoid()` directly inside the use case.

#### Scenario: Successful manual match

- **WHEN** the user accepts an auto-match suggestion or invokes "Match to…" from the dialog
- **THEN** `matchSession` runs, a `SessionMatch` row is written with `source` matching the call site (`"auto-suggestion"` or `"manual"`) and `createdAt` from the injected clock, `id` from the injected idGenerator

#### Scenario: id and createdAt come from injected deps

- **WHEN** the test injects `idGenerator: () => "M1"` and `clock: () => "2026-05-01T12:00:00Z"` and invokes `matchSession`
- **THEN** the persisted row has `id: "M1"` and `createdAt: "2026-05-01T12:00:00Z"` exactly

#### Scenario: Activity not found

- **WHEN** `matchSession` is called with a `coachingActivityId` that does not exist
- **THEN** `CoachingActivityNotFoundError` is thrown; no row is written

#### Scenario: Workout not found

- **WHEN** `matchSession` is called with a `workoutId` that does not exist
- **THEN** `WorkoutNotFoundError` is thrown; no row is written

### Requirement: unmatchSession use case

The application SHALL expose `unmatchSession({ profileId, matchId })` which deletes the `SessionMatch` row identified by `matchId` if and only if its `profileId` matches the caller's profile. The use case SHALL be idempotent — deleting a match that does not exist (already unmatched) SHALL complete silently without error.

`unmatchSession` SHALL NOT delete the underlying `CoachingActivityRecord` or `WorkoutRecord` — only the link is removed.

#### Scenario: Unmatch a previously matched session

- **WHEN** the user clicks "Split" on a `MatchedSessionCard` for match `M`
- **THEN** `SessionMatch` row `M` is deleted; the next render shows the planned activity and the workout as two separate cards; the underlying records are untouched

#### Scenario: Unmatch is idempotent

- **WHEN** `unmatchSession` is called with a `matchId` that no longer exists (deleted concurrently or already unmatched)
- **THEN** the use case completes silently; no error is thrown

#### Scenario: Cross-profile unmatch rejected

- **WHEN** match `M` belongs to profile `P1` and `unmatchSession({ profileId: P2, matchId: M })` is called
- **THEN** the use case throws `CrossProfileMatchError`; the row is NOT deleted

### Requirement: SessionMatchRepository port

The infrastructure layer SHALL implement `SessionMatchRepository` exposing:

- `put(match: SessionMatch): Promise<void>` — upsert by `id`; SHALL reject when the uniqueness invariants on `(profileId, coachingActivityId)` or `(profileId, workoutId)` would be violated.
- `getByActivityId(profileId, coachingActivityId): Promise<SessionMatch | undefined>`
- `getByWorkoutId(profileId, workoutId): Promise<SessionMatch | undefined>`
- `listByProfileAndWeek(profileId, weekStart, weekEnd): Promise<SessionMatch[]>`
- `delete(id: string): Promise<void>` — no-op when the row does not exist (idempotent).
- `deleteByActivityId(coachingActivityId): Promise<void>` — cascade hook, no-op on missing.
- `deleteByWorkoutId(workoutId): Promise<void>` — cascade hook, no-op on missing.

The Dexie adapter SHALL register cascade hooks so that deleting a `coachingActivities` row OR a `workouts` row deletes the corresponding `sessionMatches` row(s) atomically (per "Cascade hooks on coaching-activity and workout deletion").

#### Scenario: Cascade on coaching activity delete

- **WHEN** a `coachingActivities` row is deleted (e.g., by `syncWeek` orphan cleanup) and that activity was matched
- **THEN** the corresponding `sessionMatches` row is also deleted; no dangling reference remains

#### Scenario: Cascade on workout delete

- **WHEN** a `workouts` row is deleted and that workout was matched
- **THEN** the corresponding `sessionMatches` row is also deleted

#### Scenario: Repository rejects double-match

- **WHEN** `put` is called with a `SessionMatch` whose `(profileId, coachingActivityId)` already exists for a different `id`
- **THEN** the call rejects with `SessionAlreadyMatchedError`; the existing row is unchanged

### Requirement: autoMatchSessions suggestion engine

The application SHALL expose `autoMatchSessions({ profileId, weekStart })` which returns a `MatchSuggestion[]` WITHOUT writing any `SessionMatch` rows.

The `MatchSuggestion` type SHALL be defined in `application/match-suggestion.ts` (the application layer owns the contract since both the use case producer and the UI banner consumer depend on it). UI components and the banner SHALL import this type from the application layer; redeclaring it elsewhere is forbidden.

Each suggestion SHALL have the shape:

```
type MatchSuggestion = {
  activityId: string,
  workoutId: string,
  score: number | null,                           // [0, 1] for parsed durations; null for "unknown" (duration missing or unparseable on either side)
  reasons: Array<                                 // never empty; reasons[0] is always the sport-family-match precondition
    | { code: "duration-match"; deltaSeconds: number }
    | { code: "duration-unknown" }
    | { code: "sport-family-match"; family: string }
  >
}
```

The heuristic SHALL be:

1. Enumerate `(activity, workout)` candidate pairs within the week `[weekStart, weekStart + 6 days]` for the given `profileId`, restricted to pairs where:
   - `activity.date === workout.date` (same day)
   - `activity.sport` and `workout.sport` map to the same canonical sport family (per "Sport family canonical mapping")
   - Neither side is already part of an existing `SessionMatch` row **for `profileId`** (cross-profile matches do not block)
2. For each candidate, parse `activity.duration` via `parseCoachingDuration` to obtain `planDur` (seconds), and read `workout.raw.duration.value` for `actualDur`. Compute `score = computeComplianceScore(planDur, actualDur)`. Two cases:
   - **Both durations parsed**: `reasons = [{ code: "sport-family-match", family }, { code: "duration-match", deltaSeconds: |planDur - actualDur| }]`. `score` keeps the value returned by `computeComplianceScore`.
   - **Either side missing or unparseable**: `score = null` (semantic "unknown") and `reasons = [{ code: "sport-family-match", family }, { code: "duration-unknown" }]`. NOT the substituted `0.5` from earlier drafts — using `null` avoids collision with the `[0.5, 0.8)` mid bucket in the visual encoding.

   Every accepted suggestion's `reasons[0]` SHALL be `{ code: "sport-family-match", family: <canonicalFamily> }` since same-sport-family is a precondition (step 1).

3. Filter to suggestions whose `score !== null AND score >= 0.6` **OR** whose `score === null` (the duration-unknown case). The `null` bypass keeps semantically-valid same-family candidates in the queue; the user reviews and decides.
4. Apply greedy assignment with a deterministic tiebreaker. Sort suggestions by `(rank, activityId, workoutId)` lexicographically where `rank` is `−score` for parsed-duration suggestions (highest score first) and `+Infinity` for `score === null` (duration-unknown sorts last). On tie, lower `activityId` first; on further tie, lower `workoutId` first. Accept each in order, skipping any whose `activityId` or `workoutId` was already accepted in an earlier suggestion. The result SHALL contain at most one suggestion per `activityId` and at most one per `workoutId`.

The use case SHALL be deterministic — given the same input rows it SHALL return the same suggestions in the same order. The use case SHALL NOT consult `autoMatchDismissals` — filtering against per-pair dismissals is the responsibility of the consuming view-model hook (`useAutoMatchSuggestions`).

#### Scenario: Single obvious pair suggested

- **WHEN** the week has one swim activity (`duration: 45min`) and one swim workout (`duration: 42min`) on the same day
- **THEN** `autoMatchSessions` returns one suggestion with score ≥ 0.9 and no `SessionMatch` row is written

#### Scenario: Two days with multiple sports — greedy assignment

- **WHEN** Monday has a planned swim and a planned bike, and Monday also has an executed swim and an executed bike, all with similar durations
- **THEN** the use case returns two suggestions — one swim pair and one bike pair — with no overlap

#### Scenario: Score below threshold filtered out

- **WHEN** a planned 60-minute run pairs with an executed 20-minute run (variance 67%)
- **THEN** no suggestion is returned for that pair (score 0.33 < 0.6 threshold)

#### Scenario: Already-matched activity skipped

- **WHEN** activity `A` already has a `SessionMatch` row, and another candidate workout pairs well with `A` by duration
- **THEN** no suggestion is returned for `A` — the existing match is respected

#### Scenario: Missing duration treated as null score with reason

- **WHEN** the planned activity has `duration: undefined` and a same-day same-sport workout exists
- **THEN** the suggestion is returned (bypasses the score threshold) with `score: null` and `reasons[1] = { code: "duration-unknown" }`; UI rendering paints it via the `neutral` bucket

#### Scenario: Unparseable duration treated as missing

- **WHEN** the planned activity has `duration: "qsdf"` (unparseable free-text) and a same-day same-sport workout exists
- **THEN** the candidate behaves identically to "duration missing" (`score: null`, `reasons` contains `{ code: "duration-unknown" }`)

#### Scenario: Tied scores broken deterministically

- **WHEN** two candidate pairs have identical scores (e.g., both 0.92) — pair `(A1, W1)` and pair `(A2, W2)` where `A1 < A2` lexicographically
- **THEN** the suggestion order places `(A1, W1)` before `(A2, W2)`

#### Scenario: No writes on suggestion enumeration

- **WHEN** `autoMatchSessions` is called
- **THEN** the `sessionMatches` table is unchanged; the use case is read-only until the user explicitly accepts a suggestion via `matchSession`

#### Scenario: Suggestion reasons include sport family

- **WHEN** an accepted suggestion is returned for a swim plan and a swim workout with matching durations
- **THEN** `reasons[0]` is `{ code: "sport-family-match", family: "swimming" }` and `reasons` includes `{ code: "duration-match", deltaSeconds: <small> }`

### Requirement: Sport family canonical mapping

Auto-match candidates require both sides to share a canonical sport family. The application SHALL expose a pure function `canonicalSportFamily(sport: string): string` in `application/canonical-sport-family.ts`. The function MUST return a lowercase ASCII family identifier. Initial families and their member sports:

- `"swimming"` ← `"swim"`, `"open_water_swim"`, `"lap_swimming"`, `"pool_swim"`
- `"cycling"` ← `"bike"`, `"cycling"`, `"road_cycling"`, `"gravel_cycling"`, `"mountain_biking"`, `"indoor_cycling"`, `"virtual_cycle"`
- `"running"` ← `"run"`, `"running"`, `"trail_running"`, `"treadmill_running"`, `"track_running"`
- `"strength"` ← `"gym"`, `"strength"`, `"strength_training"`, `"weightlifting"`, `"core"`
- `"other"` ← any sport not enumerated above (each "other" sport is its own family identified by its raw key, NOT collapsed into a single "other" pool, to avoid cross-sport false positives — e.g., `yoga` and `kayaking` do NOT match each other)

#### Scenario: Swim variants share family

- **WHEN** `canonicalSportFamily("open_water_swim")` and `canonicalSportFamily("lap_swimming")` are called
- **THEN** both return `"swimming"`

#### Scenario: Unmapped sport does not collapse

- **WHEN** `canonicalSportFamily("yoga")` and `canonicalSportFamily("kayaking")` are called
- **THEN** they return distinct values (`"yoga"` and `"kayaking"`)

### Requirement: Compliance score derivation

The application layer SHALL expose a pure function `computeComplianceScore(planDur: number | undefined, actualDur: number | undefined): number | null` returning:

- `null` when `planDur === undefined`, `actualDur === undefined`, or `planDur === 0` (division-by-zero guard).
- Otherwise `clamp(1 - |planDur - actualDur| / planDur, 0, 1)`.

The function SHALL be in `application/compute-compliance-score.ts` and SHALL have unit tests covering: both inputs present and on-target (≥ 0.9), substantial variance (≤ 0.5), missing planDur, missing actualDur, both missing, `planDur = 0`, NaN guard.

`computeComplianceScore` SHALL NOT be persisted on `SessionMatch`. The score is a derived projection so future scoring (zones, TSS) can replace the formula without a schema migration.

#### Scenario: Hit-target compliance

- **WHEN** `computeComplianceScore(2700, 2580)` is called (45 min planned, 43 min actual)
- **THEN** the result is approximately `0.956`

#### Scenario: Off-target compliance

- **WHEN** `computeComplianceScore(3600, 1800)` is called (60 min planned, 30 min actual)
- **THEN** the result is `0.5`

#### Scenario: Missing duration on either side

- **WHEN** `computeComplianceScore(undefined, 2580)` or `computeComplianceScore(2700, undefined)` is called
- **THEN** the result is `null`

#### Scenario: Division-by-zero guard

- **WHEN** `computeComplianceScore(0, 1800)` is called
- **THEN** the result is `null`

#### Scenario: NaN guard

- **WHEN** `computeComplianceScore(NaN, 1800)` or `computeComplianceScore(2700, NaN)` is called
- **THEN** the result is `null`

### Requirement: Compliance score limitations (v1)

The v1 score SHALL be **symmetric** — overshoot and undershoot of the planned duration produce identical scores. A 60-min plan executed in 30 min (skipped half) and in 90 min (over-trained) both yield `complianceScore = 0.5`. This is a known v1 limitation; future revisions MAY distinguish the two cases (e.g., a separate `executionRatio` field).

#### Scenario: Symmetric compliance for overshoot and undershoot

- **WHEN** `computeComplianceScore(3600, 1800)` and `computeComplianceScore(3600, 5400)` are both called
- **THEN** both return `0.5` — the v1 score does not differentiate direction

#### Scenario: Symmetric compliance high-end maps to same emerald bucket

- **WHEN** `computeComplianceScore(2700, 2580)` (45min plan, 43min actual) and `computeComplianceScore(2700, 2820)` (45min plan, 47min actual) are both called
- **THEN** both return ≈ `0.956`

### Requirement: useAutoMatchSuggestions view-model hook

The application layer SHALL expose `useAutoMatchSuggestions(profileId, weekStart): MatchSuggestion[]` returning auto-match suggestions for the current week, filtered by the per-pair dismissal model. The hook composes:

1. `autoMatchSessions({ profileId, weekStart })` (the pure suggestion engine).
2. A reactive read of the `autoMatchDismissals` row keyed `(profileId, weekStart)` via `useLiveQuery` exposing the row's `dismissedPairs` array.

The hook SHALL filter the raw suggestion list at render time: each suggestion `(activityId, workoutId)` is included in the returned array if and only if `dismissedPairs` contains no entry matching that pair. There is NO clock-based suppression — per-pair dismissals are TTL-free (per "Per-pair dismissals do not expire on a TTL"). When every suggestion is filtered out by prior dismissals, the hook returns `[]`.

The hook SHALL re-evaluate when `profileId`, `weekStart`, the `autoMatchDismissals` row, the `sessionMatches` table (matches change which candidates are eligible), or the underlying `coachingActivities` / `workouts` rows change.

#### Scenario: Suggestion filtered out by per-pair dismissal

- **GIVEN** `autoMatchSessions` would return suggestions `[(A1, X1), (A2, X2), (A3, X3)]` AND `dismissedPairs` contains `(A2, X2)`
- **WHEN** `useAutoMatchSuggestions(profileId, weekStart)` evaluates
- **THEN** the hook returns `[(A1, X1), (A3, X3)]`; `(A2, X2)` is filtered out

#### Scenario: All suggestions dismissed → empty array

- **WHEN** every suggestion produced by `autoMatchSessions` matches a `dismissedPairs` entry
- **THEN** the hook returns `[]`

#### Scenario: Re-evaluates after match creation

- **WHEN** the user accepts one suggestion (writing a `SessionMatch` row)
- **THEN** the hook re-evaluates and the accepted pair no longer appears in subsequent results (already-matched skip in `autoMatchSessions`)

#### Scenario: Different week is unaffected by another week's dismissals

- **GIVEN** `(A, X)` is dismissed on `weekStart = "2026-05-04"`
- **WHEN** the user navigates to `weekStart = "2026-05-11"` and that week's auto-match returns a `(A', X')` suggestion involving different ids
- **THEN** the hook returns the new week's suggestions unaffected by the prior week's dismissal state

### Requirement: dismissAutoMatchBanner use case

The application SHALL expose `dismissAutoMatchBanner(input: DismissAutoMatchBannerInput, deps: DismissAutoMatchBannerDeps): Promise<void>` for persisting the user's rejection of a single auto-match suggestion. The use case SHALL be idempotent: dismissing the same `(profileId, weekStart, activityId, workoutId)` pair twice MUST leave a single dismissal recorded and MUST NOT throw.

```ts
type DismissAutoMatchBannerInput = {
  profileId: string;
  weekStart: string; // YYYY-MM-DD (ISO Monday)
  activityId: string; // CoachingActivityRecord.id
  workoutId: string; // WorkoutRecord.id
};

type DismissAutoMatchBannerDeps = {
  clock: () => string; // ISO timestamp source — MUST be injected for determinism
  repository: AutoMatchDismissalRepository;
};
```

The use case:

1. Reads the existing `AutoMatchDismissal` row for `(profileId, weekStart)` via `repository.getByProfileAndWeek` (returning `undefined` when no row exists yet).
2. Computes the next row by appending `{ activityId, workoutId, dismissedAt: clock() }` to the row's `dismissedPairs` array, deduped by `(activityId, workoutId)` so a re-dismissal of the same pair updates `dismissedAt` in place rather than appending a duplicate entry.
3. Writes the row via `repository.put`. The write is one upsert; absence-of-row is treated identically to empty-`dismissedPairs`.

A complementary `isAutoMatchBannerDismissed(input: IsDismissedInput, deps: IsDismissedDeps): Promise<boolean>` SHALL return `true` when the row for `(profileId, weekStart)` contains a `dismissedPairs` entry matching `(activityId, workoutId)`, and `false` otherwise. Both use cases share the same repository port; neither use case SHALL invoke `useLiveQuery` directly — reactivity is the responsibility of the view-model hook.

`dismissAutoMatchBanner` SHALL reject with `InvalidInputError` when any of `profileId`, `weekStart`, `activityId`, or `workoutId` is the empty string or `undefined` — defensive against accidental empty-key writes that would otherwise land in a degenerate "global dismissal" row. `isAutoMatchBannerDismissed` is asymmetric: instead of throwing, it SHALL return `false` on any empty/`undefined` input. Throwing on the read path would propagate a defensive guard into the render call site (where `false` ≡ "not dismissed" is the safe-default UX).

When the dialog or its callers surface a write failure to the user, the toast first argument MUST be a static string literal per the project's R-PIIInterpolation guard (no interpolation of activity titles, workout names, or any identifier).

`dismissAutoMatchBanner` SHALL refuse to grow `dismissedPairs` beyond **256** entries per `(profileId, weekStart)` row. If the row already holds 256 distinct pairs, a further dismiss of a **new** pair SHALL be a no-op (the call resolves successfully without modifying the row); a re-dismiss of an **already-recorded** pair SHALL still update the existing entry's `dismissedAt` in place. The use case MAY emit a warning via the injected logger but MUST NOT throw. The warning message MUST be a static string literal — no identifier interpolation. This 256-entry bound is two orders of magnitude beyond any plausible weekly coaching density.

#### Scenario: First dismissal on a clean week

- **GIVEN** no `AutoMatchDismissal` row exists for `(P, W)`
- **WHEN** `dismissAutoMatchBanner({ profileId: P, weekStart: W, activityId: A, workoutId: X })` is invoked with `clock() = T`
- **THEN** a new row is written with `{ profileId: P, weekStart: W, dismissedPairs: [{ activityId: A, workoutId: X, dismissedAt: T }] }`

#### Scenario: Second dismissal on the same week appends to the existing row

- **GIVEN** a row exists with `dismissedPairs: [{ activityId: A1, workoutId: X1, dismissedAt: T1 }]`
- **WHEN** `dismissAutoMatchBanner` is invoked for `(P, W, A2, X2)` with `clock() = T2`
- **THEN** the row is upserted with `dismissedPairs` now containing both entries; the original `T1` value is preserved on the first entry

#### Scenario: Re-dismissing the same pair is idempotent

- **GIVEN** a row exists with `dismissedPairs: [{ activityId: A, workoutId: X, dismissedAt: T1 }]`
- **WHEN** `dismissAutoMatchBanner` is invoked for `(P, W, A, X)` with `clock() = T2 > T1`
- **THEN** the row remains a single entry whose `dismissedAt` is updated to `T2`; no duplicate entry is appended

#### Scenario: isAutoMatchBannerDismissed returns true for a recorded pair

- **GIVEN** a dismissal row carries `dismissedPairs` containing `(A, X)`
- **WHEN** `isAutoMatchBannerDismissed({ profileId: P, weekStart: W, activityId: A, workoutId: X })` is invoked
- **THEN** the use case resolves with `true`

#### Scenario: isAutoMatchBannerDismissed returns false for an unrecorded pair

- **GIVEN** no dismissal row exists for `(P, W)`, OR a row exists but `dismissedPairs` does not contain `(A, X)`
- **WHEN** `isAutoMatchBannerDismissed({ profileId: P, weekStart: W, activityId: A, workoutId: X })` is invoked
- **THEN** the use case resolves with `false`

#### Scenario: Repository write failure surfaces to the caller

- **GIVEN** `repository.put` rejects (e.g., `QuotaExceededError` from IndexedDB)
- **WHEN** `dismissAutoMatchBanner` is invoked
- **THEN** the use case re-throws the underlying error; no partial row is left half-written

#### Scenario: Empty-string input is rejected by the write path

- **WHEN** `dismissAutoMatchBanner` is invoked with `profileId: ""` (or any other required field empty/undefined)
- **THEN** the use case rejects with `InvalidInputError` before any repository read or write; no row is mutated

#### Scenario: Empty-string input on the read path returns false

- **WHEN** `isAutoMatchBannerDismissed` is invoked with `profileId: ""` (or any other required field empty/undefined)
- **THEN** the use case resolves with `false`; no repository read occurs; no error is thrown

#### Scenario: 257th distinct pair within one row is a no-op

- **GIVEN** the row for `(P, W)` already holds 256 distinct `dismissedPairs` entries
- **WHEN** `dismissAutoMatchBanner` is invoked with a 257th distinct pair `(A_new, X_new)`
- **THEN** the call resolves successfully; the row is unchanged; a warning MAY be logged; no error is thrown to the caller

#### Scenario: Re-dismiss at the cap updates the existing entry

- **GIVEN** the row for `(P, W)` holds exactly 256 distinct `dismissedPairs` entries, one of which is `(A, X)` with `dismissedAt: T1`
- **WHEN** `dismissAutoMatchBanner` is invoked again for the SAME `(A, X)` with `clock() = T2`
- **THEN** the call resolves successfully; the existing entry's `dismissedAt` is updated to `T2`; `dismissedPairs.length` remains 256; the cap is not violated

### Requirement: AutoMatchDismissalRepository port

The infrastructure layer SHALL implement `AutoMatchDismissalRepository` exposing the per-pair-aware row shape:

- `getByProfileAndWeek(profileId, weekStart): Promise<AutoMatchDismissal | undefined>`
- `put(dismissal: AutoMatchDismissal): Promise<void>` — upsert keyed by `(profileId, weekStart)` composite primary key.
- `delete(profileId, weekStart): Promise<void>` — idempotent.
- `deleteByProfile(profileId): Promise<void>` — invoked by the profile-delete cascade.

The persisted row shape:

```ts
{
  profileId: string,
  weekStart: string,                         // YYYY-MM-DD (ISO Monday)
  dismissedPairs: Array<{
    activityId: string,
    workoutId: string,
    dismissedAt: string                      // ISO timestamp
  }>
}
```

The Dexie adapter SHALL register a cascade hook so deleting a `profiles` row deletes the corresponding `autoMatchDismissals` rows.

#### Scenario: getByProfileAndWeek returns undefined for an unwritten pair

- **WHEN** `getByProfileAndWeek("P1", "2026-05-04")` is called and no row exists
- **THEN** the call resolves with `undefined`

#### Scenario: put upserts by composite key

- **GIVEN** a row exists for `(P, W)` with `dismissedPairs: [...A]`
- **WHEN** `put` is called with the same `(P, W)` and `dismissedPairs: [...B]`
- **THEN** the existing row is overwritten; subsequent `getByProfileAndWeek(P, W)` returns the new `[...B]` content; no duplicate row is created

#### Scenario: deleteByProfile removes every dismissal row for that profile

- **GIVEN** rows exist for `(P, W1)`, `(P, W2)`, and `(Q, W1)`
- **WHEN** `deleteByProfile(P)` is called
- **THEN** rows `(P, W1)` and `(P, W2)` are deleted; row `(Q, W1)` is untouched

#### Scenario: delete is idempotent on a missing row

- **GIVEN** no row exists for `(P, W)`
- **WHEN** `delete(P, W)` is called
- **THEN** the call resolves successfully; no error is thrown

#### Scenario: Profile delete cascade

- **WHEN** profile `P` is deleted via `deleteProfile(P)` and `autoMatchDismissals` had rows for `P`
- **THEN** those rows are deleted as part of the same Dexie transaction that deletes the profile

### Requirement: Per-pair dismissals do not expire on a TTL

The dismissal model SHALL be **per-pair, weekStart-scoped, and TTL-free** within a given week. Once a `(profileId, weekStart, activityId, workoutId)` pair is recorded in `dismissedPairs`, the auto-match banner SHALL NOT re-surface that pair on the same device for that week, regardless of how many times `autoMatchSessions` re-runs. The dismissal stops applying — at distinct layers — when:

- **Consumer-layer scope change**: the user navigates to a different `weekStart`. The data row for the original week is unchanged; the consumer's filter simply does not consult it for the new week.
- **Data-layer deletion (indirect)**: the underlying `coachingActivities` row OR `workouts` row is deleted (e.g., during sync orphan cleanup). Cascade hooks SHALL remove the corresponding `dismissedPairs` entry so a re-arriving id under the same primary key cannot inherit a prior verdict.
- **Data-layer match (indirect)**: the user explicitly accepts the suggestion via a separate code path (Accept invokes `matchSession` and the resulting `SessionMatch` row excludes the pair from `autoMatchSessions` enumeration entirely; the dismissal entry, while still present, becomes dead data and is not consulted).

This is a deliberate departure from any prior TTL-based model: the user's "this is not a match" verdict is per-pair information that does not stale on the clock.

#### Scenario: Re-running the heuristic does not re-surface a dismissed pair

- **GIVEN** the user dismissed `(A, X)` on week `W`
- **WHEN** a subsequent sync re-runs `autoMatchSessions` and produces the same `(A, X)` suggestion plus a fresh `(A2, X2)` suggestion
- **THEN** the banner renders only `(A2, X2)`; the dismissed `(A, X)` is filtered out at the consumer layer

#### Scenario: Coaching activity deletion lifts the dismissal indirectly

- **GIVEN** `(A, X)` is in `dismissedPairs` for `(P, W)`
- **WHEN** activity `A` is deleted (e.g., during `syncWeek` orphan cleanup)
- **THEN** the deletion cascades to remove `A` from any `dismissedPairs` entries; the user is not stuck with a permanent dismissal of a deleted activity

#### Scenario: Resync replaces activity id but produces a new pair

- **GIVEN** `(A, X)` is dismissed for `(P, W)`; a subsequent Train2Go sync deletes activity `A` and inserts a fresh activity `A'` covering the same date and sport (Train2Go's composite-id contract guarantees `A' ≠ A`)
- **WHEN** `autoMatchSessions` re-runs and produces a suggestion `(A', X)`
- **THEN** the banner renders `(A', X)` because the new id is not in `dismissedPairs`; the orphan-cleanup of `A` cascades to remove its `dismissedPairs` entry, leaving the row clean

### Requirement: Auto-match suggestion banner

The calendar SHALL render an auto-match suggestion banner above the week grid when `useAutoMatchSuggestions(profileId, weekStart)` returns at least one suggestion. The banner is a thin presentation layer over the hook's filtered list — the hook owns the per-pair dismissal filtering; the banner does not consult `autoMatchDismissals` directly.

The banner SHALL list each suggestion as a row showing the planned activity title, the workout title, the compliance percentage (rendered via the bucketing rule from `spa-calendar`), and per-row Accept / Reject controls. There is **no "Dismiss all" control** — the per-pair model has no notion of week-level suppression. Suggestions are dismissed one at a time via per-row Reject.

The banner SHALL be visually bounded so it does not push the calendar grid below the fold on standard viewports: at most 2 suggestion rows are rendered in the collapsed state; if more suggestions exist, the banner SHALL show "Showing 2 of N — view all" with the remainder accessible via in-place expansion. Clicking "view all" SHALL expand the banner in-place to show all suggestion rows; the expanded banner SHALL retain a `max-h-64` ceiling with internal vertical scroll if needed. The collapsed banner height SHALL NOT exceed `max-h-32` so the calendar grid remains visible on a 768px-tall viewport without scrolling.

For accessibility (per WCAG 4.1.2 and 4.1.3), the banner SHALL:

- Be a `role="region"` landmark with `aria-label="Auto-match suggestions"`.
- Contain a dedicated visually-hidden `<div role="status" aria-live="polite" class="sr-only">` element. The status element SHALL receive textual updates on banner appearance and on each row action.
- On banner appearance, the status element SHALL emit `"Auto-match suggestions: <N> pending"`.
- On Accept of a row, the status element SHALL emit `"Session matched. <remaining> suggestions remaining."` (or the zero-variant).
- On Reject of a row, the status element SHALL emit `"Suggestion dismissed. <remaining> suggestions remaining."` (or the zero-variant).
- On auto-hide (last suggestion accepted or rejected), focus SHALL move to the first focusable interactive element in `CalendarWeekGrid`. If no interactive element exists in the grid, focus falls back to the `CalendarWeekGrid` container which SHALL carry `tabindex="-1"`.

Accepting a suggestion SHALL invoke `matchSession` with `source: "auto-suggestion"` and remove that row from the banner. Rejecting SHALL invoke `dismissAutoMatchBanner({ profileId, weekStart, activityId, workoutId })` (persisting a per-pair dismissal) and remove the row from the banner. The banner SHALL hide automatically once all suggestions are processed (accepted or rejected).

#### Scenario: Banner appears with suggestions

- **WHEN** the calendar mounts and `useAutoMatchSuggestions` returns 3 suggestions (none dismissed)
- **THEN** the banner shows 3 rows with Accept/Reject controls per row

#### Scenario: Accept individual suggestion

- **WHEN** the user clicks Accept on one of three suggestion rows
- **THEN** `matchSession` is invoked with `source: "auto-suggestion"`; the row is removed from the banner; the status element emits `"Session matched. 2 suggestions remaining."`

#### Scenario: Reject persists per-pair dismissal

- **WHEN** the user clicks Reject on one of three suggestion rows for pair `(A, X)`
- **THEN** `dismissAutoMatchBanner({ profileId, weekStart, activityId: A, workoutId: X })` is invoked; the row is removed from the banner reactively (no manual reload); no `SessionMatch` is written; the status element emits `"Suggestion dismissed. 2 suggestions remaining."`; subsequent re-runs of `autoMatchSessions` continue to produce the pair, but `useAutoMatchSuggestions` filters it out

#### Scenario: All suggestions processed hides banner with focus move

- **WHEN** the banner shows 2 suggestions and the user accepts one and rejects the other
- **THEN** the banner is hidden after the second action; focus moves to the first focusable interactive element in `CalendarWeekGrid`; the status element emits the appropriate "No suggestions remaining." variant

#### Scenario: View-all expands banner in place with internal scroll

- **WHEN** the auto-match enumeration returns 5 suggestions and the banner renders in collapsed state showing "Showing 2 of 5 — view all"
- **THEN** clicking "view all" expands the banner in place; all 5 rows become visible inside a `max-h-64` container with internal vertical scroll if needed; the toggle now reads "Collapse" with `aria-expanded="true"`

#### Scenario: Banner is announced to assistive tech

- **WHEN** the banner first renders after a sync that produced suggestions
- **THEN** the live-region announcement "Auto-match suggestions: 3 pending" (or equivalent) is emitted to assistive tech without stealing focus

### Requirement: Cascade hooks on coaching-activity and workout deletion

The Dexie adapters SHALL register cascade hooks so that:

- Deleting a `coachingActivities` row (e.g., during `syncWeek` orphan cleanup, or via direct API call) SHALL also delete every `sessionMatches` row whose `coachingActivityId` equals the deleted activity's id, AND SHALL purge every `dismissedPairs` entry whose `activityId` equals the deleted activity's id from any `autoMatchDismissals` row **in the same profile** (coaching activities are profile-scoped).
- Deleting a `workouts` row SHALL also delete every `sessionMatches` row whose `workoutId` equals the deleted workout's id, AND SHALL purge every `dismissedPairs` entry whose `workoutId` equals the deleted workout's id from any `autoMatchDismissals` row **across all profiles** (workouts are profile-agnostic; without this, a different profile's dismissal could outlive the workout it referenced).

Both cascades SHALL run inside the same Dexie transaction as the parent delete. A crash mid-cascade SHALL leave the database in the pre-delete state (Dexie's transactional guarantee).

In particular: deleting a `coachingActivities` row SHALL run inside a `db.transaction('rw', [coachingActivities, sessionMatches, autoMatchDismissals], ...)`. Deleting a `workouts` row SHALL run inside `db.transaction('rw', [workouts, sessionMatches, autoMatchDismissals], ...)`. Deleting a `profiles` row SHALL run inside a transaction covering `profiles`, `coachingActivities`, `sessionMatches`, `userPreferences`, and `autoMatchDismissals` — orchestrated by an explicit `deleteProfile(profileId)` use case that opens the transaction; cascade hooks alone are insufficient because `db.profiles.delete(id)` outside a wrapping transaction would let the chained hooks fire in independent auto-transactions, leaving partial state on a mid-fan-out crash.

**Cascade-table inventory** — the authoritative list of cascade tables per parent SHALL be co-located with the Dexie adapter (e.g., a `CASCADE_TABLES` constant in `adapters/dexie/cascade-tables.ts`) and each entry SHALL be unit-tested:

| Parent table         | Cascade tables                                                                   |
| -------------------- | -------------------------------------------------------------------------------- |
| `coachingActivities` | `sessionMatches`, `autoMatchDismissals`                                          |
| `workouts`           | `sessionMatches`, `autoMatchDismissals`                                          |
| `profiles`           | `coachingActivities`, `sessionMatches`, `userPreferences`, `autoMatchDismissals` |

A unit test SHALL assert `CASCADE_TABLES` matches this inventory exactly — adding a new cascade table anywhere SHALL fail the test until the inventory is updated, preventing silent drift between the Dexie hooks and the transaction-table list. (The `profiles` cascade table list does NOT include `workouts` because workouts are profile-agnostic.)

Naming note: table identifiers in this requirement use **camelCase** (`coachingActivities`, `sessionMatches`, `workouts`, `autoMatchDismissals`) per the project's adapter-schema convention. Where snake_case names appear elsewhere (`auto_match_dismissals`, `coaching_activities`), they refer to the same underlying physical tables; the casing reflects the legacy schema-bump history rather than a different store.

#### Scenario: Coaching-activity delete cascades to sessionMatches and dismissedPairs

- **GIVEN** activity `A` is matched to workout `X` (a `sessionMatches` row exists) AND `(A, X)` is recorded in `dismissedPairs` for `(P, weekStart)` (a separate row)
- **WHEN** activity `A` is deleted via the Dexie adapter
- **THEN** the matching `sessionMatches` row is deleted in the same transaction; the `(A, X)` entry is removed from `dismissedPairs`; both deletions are visible after the transaction commits and remain partial-rollback-safe on transaction abort

#### Scenario: Workout delete cascades to sessionMatches and dismissedPairs

- **GIVEN** workout `X` is matched to activity `A` AND `(A, X)` is recorded in `dismissedPairs` for `(P, weekStart)`
- **WHEN** workout `X` is deleted via the Dexie adapter
- **THEN** the matching `sessionMatches` row is deleted in the same transaction; the `(A, X)` entry is removed from `dismissedPairs`

#### Scenario: Mid-cascade crash leaves no partial state

- **GIVEN** the workout-delete cascade is mid-flight and the `dismissedPairs` purge throws
- **WHEN** the transaction aborts
- **THEN** the `workouts` row is NOT deleted; the `sessionMatches` row is NOT deleted; `dismissedPairs` is unchanged; the database returns to the pre-delete state

#### Scenario: Cascade table inventory is enumerated and tested

- **WHEN** a developer adds a new cascade hook (e.g., a future `notifications` table cascading on profile delete) without updating `CASCADE_TABLES`
- **THEN** the inventory unit test fails immediately, blocking the change until the inventory and the orchestrator transaction's table list are updated together

#### Scenario: Profile delete is atomic across all cascade tables

- **WHEN** profile `P` is deleted while it has rows in all four cascade-targeted tables
- **THEN** all five operations (profile delete + four cascade deletes) commit atomically; a partial failure rolls back to the pre-delete state
