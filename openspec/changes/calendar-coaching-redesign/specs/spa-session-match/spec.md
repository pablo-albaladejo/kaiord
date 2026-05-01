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
- `"auto-suggestion"`: the user accepted an auto-match suggestion produced by `autoMatchSessions`. Accepting a suggestion is recorded as `"auto-suggestion"`, NOT `"manual"`, so analytics can distinguish heuristic acceptance from explicit picker selection.
- `"auto-conversion"`: the use case `convertCoachingActivity` produced a workout from a coaching activity and auto-linked them.

The `(profileId, coachingActivityId)` pair MUST be unique — a single planned activity SHALL NOT be matched to more than one workout. The `(profileId, workoutId)` pair MUST be unique within a profile — a single workout SHALL NOT be matched to more than one planned activity in the same profile. Across profiles, the same `WorkoutRecord` MAY be matched to different planned activities (one per profile) because workouts are profile-agnostic per `spa-coaching-integration` "Convert coaching activity to workout"; the `SessionMatch` aggregate is profile-scoped and these matches are independent. Deleting a profile cascades only to that profile's `session_matches` rows; matches in other profiles referencing the same workout are untouched.

These uniqueness invariants are enforced by the `SessionMatchRepository` adapter and surfaced as errors at the application layer; they are not silently overwritten.

`SessionMatch` SHALL NOT be created if either side does not exist or if the coaching activity belongs to a different profile (workouts are profile-agnostic, so the profile check is enforced via the activity side only — see the cross-profile scenarios below).

#### Scenario: Same workout matched in two profiles

- **WHEN** workout `W` is matched to activity `A1` in profile `P1`, and the user (also operating profile `P2` with the same workout visible) calls `matchSession({ profileId: P2, coachingActivityId: A2, workoutId: W })`
- **THEN** a second `SessionMatch` row is persisted in `P2`; the `P1` row is unchanged; the two are independent and do not violate uniqueness (which is scoped per profile)

#### Scenario: Profile delete cascades only to that profile's matches

- **WHEN** profile `P1` is deleted and workout `W` was matched in both `P1` and `P2`
- **THEN** the `P1` `session_matches` row is deleted; the `P2` row is untouched; subsequent reads in `P2` continue to see the matched session

#### Scenario: Cannot double-match a planned activity

- **WHEN** activity `A` is already matched to workout `W1` and the use case is called again with the same `A` and a different workout `W2`
- **THEN** the use case throws `SessionAlreadyMatchedError`; no row is written; the existing `(A, W1)` row is unchanged

#### Scenario: Cannot double-match a workout

- **WHEN** workout `W` is already matched to activity `A1` and the use case is called again with `W` and a different activity `A2`
- **THEN** the use case throws `SessionAlreadyMatchedError`; no row is written; the existing `(A1, W)` row is unchanged

#### Scenario: Cross-profile match rejected

- **WHEN** activity `A` belongs to profile `P1` and workout `W` belongs to profile `P2`, and `matchSession({ profileId: P1, coachingActivityId: A, workoutId: W })` is called
- **THEN** the use case throws `CrossProfileMatchError`; no row is written

### Requirement: matchSession use case

The application SHALL expose `matchSession(input: MatchSessionInput, deps: MatchSessionDeps): Promise<SessionMatch>` with the following signatures:

```
type MatchSessionInput = {
  profileId: string,
  coachingActivityId: string,
  workoutId: string,
  source?: "manual" | "auto-suggestion" | "auto-conversion"   // default "manual"; production call sites MUST pass source explicitly (the default is for legacy/test convenience only)
}

type MatchSessionDeps = {
  clock: () => string,                          // ISO timestamp source — MUST be injected for determinism
  idGenerator: () => string,                    // SessionMatch.id source (e.g., nanoid()) — MUST be injected for determinism
  repository: SessionMatchRepository,
  coachingRepository: CoachingRepository,
  workoutRepository: WorkoutRepository
}
```

The use case:

1. Reads the `CoachingActivityRecord` by id via `coachingRepository`; if missing OR if its `profileId` does not equal `input.profileId`, throws `CoachingActivityNotFoundError` (or `CrossProfileMatchError` when the row exists but belongs to a different profile, to distinguish the two failure modes).
2. Reads the `WorkoutRecord` by id via `workoutRepository`; if missing, throws `WorkoutNotFoundError`. (Workouts are profile-agnostic today, per `spa-coaching-integration`; cross-profile is enforced via the activity side only.)
3. Checks the uniqueness invariants from "SessionMatch aggregate" by calling `repository.getByActivityId` and `repository.getByWorkoutId`; throws `SessionAlreadyMatchedError` on violation.
4. Persists a new `SessionMatch` via `repository.put`, with `id: idGenerator()`, `createdAt: clock()`, and `source: input.source ?? "manual"`.
5. Returns the persisted match.

The `clock` and `idGenerator` injections are normative — implementations MUST NOT call `Date.now()`, `new Date().toISOString()`, or `nanoid()` directly inside the use case. Tests inject deterministic doubles.

#### Scenario: Successful manual match

- **WHEN** the user accepts an auto-match suggestion or invokes "Match to…" from the dialog
- **THEN** `matchSession` runs, a `SessionMatch` row is written with `source` matching the call site (`"auto-suggestion"` or `"manual"`) and `createdAt` from the injected clock, `id` from the injected idGenerator; the calendar's next render fuses the two cards into a `MatchedSessionCard`

#### Scenario: id and createdAt come from injected deps

- **WHEN** the test injects `idGenerator: () => "M1"` and `clock: () => "2026-05-01T12:00:00Z"` and invokes `matchSession`
- **THEN** the persisted row has `id: "M1"` and `createdAt: "2026-05-01T12:00:00Z"` exactly (no real-time leakage, no random id)

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
- **THEN** `SessionMatch` row `M` is deleted; the next render shows the planned activity and the workout as two separate cards in the same day column; the underlying records are untouched

#### Scenario: Unmatch is idempotent

- **WHEN** `unmatchSession` is called with a `matchId` that no longer exists (deleted concurrently or already unmatched)
- **THEN** the use case completes silently; no error is thrown; no toast is surfaced

#### Scenario: Cross-profile unmatch rejected

- **WHEN** match `M` belongs to profile `P1` and `unmatchSession({ profileId: P2, matchId: M })` is called
- **THEN** the use case throws `CrossProfileMatchError`; the row is NOT deleted

### Requirement: autoMatchSessions suggestion engine

The application SHALL expose `autoMatchSessions({ profileId, weekStart })` which returns a `MatchSuggestion[]` WITHOUT writing any `SessionMatch` rows.

The `MatchSuggestion` type SHALL be defined in `application/match-suggestion.ts` (the application layer owns the contract since both the use case producer and the UI banner consumer depend on it; placing it in `types/` would cross hexagonal layers since the type encodes application-layer heuristic provenance, not domain shape). UI components and the banner SHALL import this type from the application layer; redeclaring it elsewhere is forbidden and SHALL be caught by the eslint port/adapter import guardrail (see tasks.md 12.4).

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
   - Neither side is already part of an existing `SessionMatch` row **for `profileId`** (cross-profile matches do not block — a workout matched in profile P2 remains a candidate for profile P1, per the cross-profile semantics in "SessionMatch aggregate")
2. For each candidate, parse `activity.duration` via `parseCoachingDuration` (per `spa-coaching-integration`) to obtain `planDur` (seconds), and read `workout.raw.duration.value` for `actualDur`. Compute `score = computeComplianceScore(planDur, actualDur)` (per "Compliance score derivation" below). Two cases:
   - **Both durations parsed**: `reasons = [{ code: "sport-family-match", family }, { code: "duration-match", deltaSeconds: |planDur - actualDur| }]`. `score` keeps the value returned by `computeComplianceScore`.
   - **Either side missing or unparseable**: `score = null` (semantic "unknown") and `reasons = [{ code: "sport-family-match", family }, { code: "duration-unknown" }]`. NOT the substituted `0.5` from earlier drafts — using `null` avoids collision with the `[0.5, 0.8)` mid bucket in the visual encoding (per `spa-calendar` "Compliance bucket boundaries"), which would otherwise paint an unknown-duration suggestion the same colour as a true 50%-compliance match. The UI SHALL render `null` via the `neutral` bucket (grey lateral border).

   Every accepted suggestion's `reasons[0]` SHALL be `{ code: "sport-family-match", family: <canonicalFamily> }` since same-sport-family is a precondition (step 1) that produced the candidate; it is recorded for UI display and analytics provenance.

3. Filter to suggestions whose `score !== null AND score >= 0.6` **OR** whose `score === null` (the duration-unknown case). The `null` bypass keeps semantically-valid same-family candidates in the queue; the user reviews and decides. The heuristic does not silently drop unknown-duration candidates and does not falsely encode them as 50%-compliance.
4. Apply greedy assignment with a deterministic tiebreaker. **Post-filter invariant (from step 3): every parsed-duration suggestion has `score ∈ [0.6, 1.0]`; every duration-unknown suggestion has `score === null`.** Sort suggestions by `(rank, activityId, workoutId)` lexicographically where `rank` is `−score` for parsed-duration suggestions (so `−1.0` sorts before `−0.6`, i.e., highest score first) and `+Infinity` for `score === null` (duration-unknown sorts last). The post-filter invariant guarantees `−score ∈ [−1.0, −0.6]` so the JS `−0`/`+0` equivalence quirk is unreachable. On tie, lower `activityId` first; on further tie, lower `workoutId` first. Accept each in order, skipping any whose `activityId` or `workoutId` was already accepted in an earlier suggestion. The result SHALL contain at most one suggestion per `activityId` and at most one per `workoutId`.

The use case SHALL be deterministic — given the same input rows it SHALL return the same suggestions in the same order.

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
- **THEN** the suggestion is returned (bypasses the score threshold) with `score: null` and `reasons[1] = { code: "duration-unknown" }`; UI rendering paints it via the `neutral` bucket (NOT the `mid` bucket)

#### Scenario: Unparseable duration treated as missing

- **WHEN** the planned activity has `duration: "qsdf"` (unparseable free-text) and a same-day same-sport workout exists
- **THEN** `parseCoachingDuration` returns `undefined`; the candidate behaves identically to "duration missing" (`score: null`, `reasons` contains `{ code: "duration-unknown" }`)

#### Scenario: Tied scores broken deterministically

- **WHEN** two candidate pairs have identical scores (e.g., both 0.92) — pair `(A1, W1)` and pair `(A2, W2)` where `A1 < A2` lexicographically
- **THEN** the suggestion order places `(A1, W1)` before `(A2, W2)`; given a third overlapping candidate `(A1, W2)` with the same score, the greedy pass accepts `(A1, W1)` and `(A2, W2)` and skips `(A1, W2)` deterministically

#### Scenario: No writes on suggestion enumeration

- **WHEN** `autoMatchSessions` is called
- **THEN** the `session_matches` table is unchanged; the use case is read-only until the user explicitly accepts a suggestion via `matchSession`

#### Scenario: Suggestion reasons include sport family

- **WHEN** an accepted suggestion is returned for a swim plan and a swim workout with matching durations
- **THEN** `reasons[0]` is `{ code: "sport-family-match", family: "swimming" }` and `reasons` includes `{ code: "duration-match", deltaSeconds: <small> }`

### Requirement: Sport family canonical mapping

Auto-match candidates require both sides to share a canonical sport family. The mapping SHALL be a pure function `canonicalSportFamily(sport: string): string` in `application/canonical-sport-family.ts` returning a lowercase ASCII family identifier. Initial families and their member sports:

- `"swimming"` ← `"swim"`, `"open_water_swim"`, `"lap_swimming"`, `"pool_swim"`
- `"cycling"` ← `"bike"`, `"cycling"`, `"road_cycling"`, `"gravel_cycling"`, `"mountain_biking"`, `"indoor_cycling"`, `"virtual_cycle"`
- `"running"` ← `"run"`, `"running"`, `"trail_running"`, `"treadmill_running"`, `"track_running"`
- `"strength"` ← `"gym"`, `"strength"`, `"strength_training"`, `"weightlifting"`, `"core"`
- `"other"` ← any sport not enumerated above (each "other" sport is its own family identified by its raw key, NOT collapsed into a single "other" pool, to avoid cross-sport false positives — e.g., `yoga` and `kayaking` do NOT match each other)

The function is unit-tested with each family's members and with at least one unmapped sport.

#### Scenario: Swim variants share family

- **WHEN** `canonicalSportFamily("open_water_swim")` and `canonicalSportFamily("lap_swimming")` are called
- **THEN** both return `"swimming"`

#### Scenario: Unmapped sport does not collapse

- **WHEN** `canonicalSportFamily("yoga")` and `canonicalSportFamily("kayaking")` are called
- **THEN** they return distinct values (`"yoga"` and `"kayaking"`); the auto-match candidate enumeration does NOT pair a yoga plan with a kayaking workout

### Requirement: useAutoMatchSuggestions view-model hook

The application layer SHALL expose `useAutoMatchSuggestions(profileId, weekStart): MatchSuggestion[]` returning auto-match suggestions for the current week, gated by the dismissal state. The hook composes:

1. `autoMatchSessions({ profileId, weekStart })` (the pure suggestion engine).
2. `isAutoMatchBannerDismissed({ profileId, weekStart, now: clock() })` (the 24h-expiry check).

If the dismissal check returns `true`, the hook returns `[]` regardless of suggestion count. Otherwise it returns the suggestion array.

The hook SHALL re-evaluate when `profileId`, `weekStart`, the `auto_match_dismissals` row, the `session_matches` table (matches change which candidates are eligible), or the underlying `coachingActivities` / `workouts` rows change.

#### Scenario: Dismissed week returns empty array

- **WHEN** the user dismissed the banner less than 24h ago and reopens the calendar on the same week
- **THEN** `useAutoMatchSuggestions` returns `[]` even when `autoMatchSessions` enumeration would yield suggestions

#### Scenario: Re-evaluates after match creation

- **WHEN** the user accepts one suggestion (writing a `SessionMatch` row)
- **THEN** the hook re-evaluates and the accepted pair no longer appears in subsequent results (already-matched skip)

### Requirement: Rejected suggestions are session-scoped (not persisted)

Rejecting a single suggestion (per "Auto-match suggestion banner" Reject scenario) SHALL NOT persist a rejection record. The rejection is tracked only in the in-memory banner state for the current page session. On a calendar refresh or week navigation that re-evaluates `useAutoMatchSuggestions`, previously rejected suggestions MAY reappear if the underlying conditions still hold (same heuristic still produces them, dismissal hasn't fired).

This is a deliberate v1 trade-off: persisting per-pair rejection would require an additional `(profileId, weekStart, activityId, workoutId)` table and complicate the dismissal model. v1 expects rejection volume to be low; if rejected suggestions become noisy in practice, the user can `Dismiss all` to suppress the banner for 24 hours.

#### Scenario: Rejected suggestion may reappear after refresh

- **WHEN** the user rejects suggestion `(A, W)` and refreshes the calendar within the same browser session
- **THEN** the banner may re-render `(A, W)` if it is still produced by `autoMatchSessions` and no `auto_match_dismissals` row exists; this is the documented v1 behaviour

### Requirement: SessionMatchRepository port

The infrastructure layer SHALL implement `SessionMatchRepository` exposing:

- `put(match: SessionMatch): Promise<void>` — upsert by `id`; SHALL reject (throw) when the uniqueness invariants on `(profileId, coachingActivityId)` or `(profileId, workoutId)` would be violated.
- `getByActivityId(profileId, coachingActivityId): Promise<SessionMatch | undefined>`
- `getByWorkoutId(profileId, workoutId): Promise<SessionMatch | undefined>`
- `listByProfileAndWeek(profileId, weekStart, weekEnd): Promise<SessionMatch[]>`
- `delete(id: string): Promise<void>` — no-op when the row does not exist (idempotent).
- `deleteByActivityId(coachingActivityId): Promise<void>` — cascade hook, no-op on missing.
- `deleteByWorkoutId(workoutId): Promise<void>` — cascade hook, no-op on missing.

The Dexie adapter SHALL register cascade hooks so that deleting a `coachingActivities` row OR a `workouts` row deletes the corresponding `session_matches` row(s) atomically.

#### Scenario: Cascade on coaching activity delete

- **WHEN** a `coachingActivities` row is deleted (e.g., by `syncWeek` orphan cleanup) and that activity was matched
- **THEN** the corresponding `session_matches` row is also deleted; no dangling reference remains

#### Scenario: Cascade on workout delete

- **WHEN** a `workouts` row is deleted and that workout was matched
- **THEN** the corresponding `session_matches` row is also deleted

#### Scenario: Repository rejects double-match

- **WHEN** `put` is called with a `SessionMatch` whose `(profileId, coachingActivityId)` already exists for a different `id`
- **THEN** the call rejects with `SessionAlreadyMatchedError`; the existing row is unchanged

### Requirement: Compliance score derivation

The application layer SHALL expose a pure function `computeComplianceScore(planDur: number | undefined, actualDur: number | undefined): number | null` returning:

- `null` when `planDur === undefined`, `actualDur === undefined`, or `planDur === 0` (division-by-zero guard).
- Otherwise `clamp(1 - |planDur - actualDur| / planDur, 0, 1)`.

The function SHALL be in `application/compute-compliance-score.ts` and SHALL have unit tests covering: both inputs present and on-target (≥ 0.9), substantial variance (≤ 0.5), missing planDur, missing actualDur, both missing, `planDur = 0`, NaN guard (`computeComplianceScore(NaN, 100) → null`).

`computeComplianceScore` SHALL NOT be persisted on `SessionMatch`. The score is a derived projection so future scoring (zones, TSS) can replace the formula without a schema migration.

#### Scenario: Hit-target compliance

- **WHEN** `computeComplianceScore(2700, 2580)` is called (45 min planned, 43 min actual)
- **THEN** the result is approximately `0.956` (within `[0.9, 1.0]`)

#### Scenario: Off-target compliance

- **WHEN** `computeComplianceScore(3600, 1800)` is called (60 min planned, 30 min actual)
- **THEN** the result is `0.5`

#### Scenario: Missing duration on either side

- **WHEN** `computeComplianceScore(undefined, 2580)` or `computeComplianceScore(2700, undefined)` is called
- **THEN** the result is `null`

#### Scenario: Division-by-zero guard

- **WHEN** `computeComplianceScore(0, 1800)` is called
- **THEN** the result is `null` (no infinite or NaN propagation)

#### Scenario: NaN guard

- **WHEN** `computeComplianceScore(NaN, 1800)` or `computeComplianceScore(2700, NaN)` is called
- **THEN** the result is `null`

### Requirement: Compliance score limitations (v1)

The v1 score SHALL be **symmetric** — overshoot and undershoot of the planned duration produce identical scores. A 60-min plan executed in 30 min (skipped half) and in 90 min (over-trained) both yield `complianceScore = 0.5`. This is a known v1 limitation; future revisions MAY distinguish the two cases (e.g., a separate `executionRatio` field). The visual encoding (per `spa-calendar` "Compliance bucket boundaries for visual encoding") SHALL inherit the symmetry — both the half-skipped and the over-trained sessions render in the same `mid` bucket. Documentation describing the score MUST surface this caveat to coaches and athletes consuming it (release notes, dialog tooltip).

#### Scenario: Symmetric compliance for overshoot and undershoot

- **WHEN** `computeComplianceScore(3600, 1800)` and `computeComplianceScore(3600, 5400)` are both called
- **THEN** both return `0.5` — the v1 score does not differentiate direction

#### Scenario: Symmetric compliance high-end maps to same emerald bucket

- **WHEN** `computeComplianceScore(2700, 2580)` (45min plan, 43min actual) and `computeComplianceScore(2700, 2820)` (45min plan, 47min actual) are both called
- **THEN** both return ≈ `0.956` — the symmetry holds across the full score range; both render in the `emerald` bucket per `spa-calendar` "Compliance bucket boundaries"

### Requirement: Auto-match suggestion banner

The calendar SHALL render an auto-match suggestion banner above the week grid when `autoMatchSessions` returns at least one suggestion AND no row exists in the `auto_match_dismissals` table (see "AutoMatchDismissalRepository port" below) for the `(profileId, weekStart)` pair with `dismissedAt` within the last 24 hours.

The banner SHALL list each suggestion as a row showing the planned activity title, the workout title, the compliance percentage, and per-row Accept/Reject controls. A "Dismiss all" control SHALL hide the banner and persist a dismissal row keyed by `(profileId, weekStart)` with `dismissedAt` from the injected clock.

The banner SHALL be visually bounded so it does not push the calendar grid below the fold on standard viewports: at most 2 suggestion rows are rendered in the collapsed state; if more suggestions exist, the banner SHALL show "Showing 2 of N — view all" with the remainder accessible via in-place expansion. Clicking "view all" SHALL expand the banner in-place to show all suggestion rows; the expanded banner SHALL retain a `max-h-64` (~256px) ceiling with internal vertical scroll if N > the capped row count. The collapsed banner height SHALL NOT exceed `max-h-32` (~128px) so the calendar grid remains visible on a 768px-tall viewport without scrolling. The banner SHALL be accompanied by a "Collapse" control when expanded.

For accessibility (per WCAG 4.1.2 and 4.1.3), the banner SHALL:

- Be a `role="region"` landmark with `aria-label="Auto-match suggestions"` so screen-reader users can locate and skip it.
- Contain a dedicated visually-hidden `<div role="status" aria-live="polite" class="sr-only">` element (NOT applying `aria-live` to the region itself, which causes NVDA to re-announce the entire region on any DOM change). The status element SHALL receive textual updates on banner appearance and on each row action — see the action announcements below.
- On banner appearance (first render after a sync that produced suggestions), the status element SHALL emit `"Auto-match suggestions: <N> pending"`.
- On Accept of a row, the status element SHALL emit `"Session matched. <remaining> suggestions remaining."` (or `"Session matched. No suggestions remaining."` when zero).
- On Reject of a row, the status element SHALL emit `"Suggestion dismissed. <remaining> suggestions remaining."` (or the zero-variant).
- On "Dismiss all", focus SHALL move to the **first focusable interactive element** in `CalendarWeekGrid` — i.e., the first card button, the today column's empty-day trigger, or any other native focusable. Focus SHALL NOT be moved to the today day-name pill (it is a `<span>` label and is not focusable by default; sending focus there would silently fail). If no interactive element exists in the grid (theoretical: every day empty AND empty-day affordances disabled), focus falls back to the `CalendarWeekGrid` container which SHALL carry `tabindex="-1"` to receive programmatic focus. No status announcement is required for "Dismiss all" (the focus move + visible removal are sufficient).
- On auto-hide (last suggestion accepted or rejected — distinct from explicit "Dismiss all"), focus SHALL move using the same rule above; the corresponding "Session matched" / "Suggestion dismissed" announcement carries the "No suggestions remaining" suffix.
- The expand / collapse / dismiss controls SHALL be reachable via keyboard, with `aria-expanded` reflecting the current state on the "view all" / "Collapse" toggle.

V1 limitation — silenced new suggestions during dismissal window: when the user dismisses the banner via "Dismiss all", any new suggestions arriving during the 24-hour suppression window (e.g., from a subsequent sync that adds a new activity / workout) SHALL NOT re-render the banner. They surface on the first view after the dismissal expires, or immediately when the user navigates to a different week (which has its own dismissal state). This is a deliberate v1 trade-off: per-suggestion-since-dismissal accounting would require a join between the dismissal row and the suggestion enumeration, which is heavier than the user value justifies for v1. The user-facing consequence is that on banner re-appearance the user cannot tell which suggestions are "the same ones I dismissed" vs "newly arrived" — documented as a known limitation in design D2 and in release notes.

Accepting a suggestion SHALL invoke `matchSession` with `source: "auto-suggestion"` and remove that row from the banner. Rejecting SHALL remove the row without writing. The banner SHALL hide automatically once all suggestions are processed (accepted or rejected).

#### Scenario: Banner appears with suggestions

- **WHEN** the calendar mounts and `autoMatchSessions` returns 3 suggestions with no dismissal recorded for this week
- **THEN** the banner shows 3 rows with Accept/Reject controls per row

#### Scenario: Accept individual suggestion

- **WHEN** the user clicks Accept on one of three suggestion rows
- **THEN** `matchSession` is invoked with `source: "auto-suggestion"`; the row is removed from the banner; the next render fuses the two cards; the visually-hidden status element emits `"Session matched. 2 suggestions remaining."`

#### Scenario: Reject individual suggestion

- **WHEN** the user clicks Reject on one of three suggestion rows
- **THEN** the row is removed from the banner; no `SessionMatch` is written; no other suggestions are affected; the status element emits `"Suggestion dismissed. 2 suggestions remaining."`

#### Scenario: All suggestions processed hides banner with focus move

- **WHEN** the banner shows 2 suggestions and the user accepts one and rejects the other
- **THEN** the banner is hidden after the second action; the status element emits `"Suggestion dismissed. No suggestions remaining."` (or `"Session matched. No suggestions remaining."` if Accept was last); focus moves to the first focusable interactive element in `CalendarWeekGrid` (NOT to the today day-name span — that is non-focusable); no `auto_match_dismissals` row is written; the next auto-match enumeration may surface fresh suggestions on subsequent week navigations

#### Scenario: Dismiss all with empty grid falls back to container

- **WHEN** the user clicks "Dismiss all" and `CalendarWeekGrid` contains no focusable interactive elements (every day empty AND empty-day affordances disabled by some hypothetical preference)
- **THEN** focus moves to the `CalendarWeekGrid` container element which carries `tabindex="-1"`; no element traps focus; no error

#### Scenario: Dismiss all suppresses banner for 24 hours

- **WHEN** the user clicks "Dismiss all"
- **THEN** an `auto_match_dismissals` row is upserted with `dismissedAt: now` (from the injected clock); the banner hides; focus moves to the calendar grid; subsequent renders within 24 hours for the same `(profileId, weekStart)` do NOT re-render the banner even if `autoMatchSessions` still returns suggestions

#### Scenario: New suggestions during dismissal window remain suppressed

- **WHEN** the user has dismissed the banner at time T and a subsequent sync at T+1h imports new activities/workouts that produce additional suggestions for the same week
- **THEN** the banner remains hidden until either the dismissal row's 24h expires (T+24h) or the user navigates to a different week (which has its own independent dismissal state); this is the documented v1 trade-off

#### Scenario: View-all expands banner in place with internal scroll

- **WHEN** the auto-match enumeration returns 5 suggestions and the banner renders in collapsed state showing "Showing 2 of 5 — view all"
- **THEN** clicking "view all" expands the banner in place; all 5 rows become visible inside a `max-h-64` container with internal vertical scroll if needed; the toggle now reads "Collapse" with `aria-expanded="true"`; clicking "Collapse" returns to the 2-row collapsed view

#### Scenario: Banner is announced to assistive tech

- **WHEN** the banner first renders after a sync that produced suggestions
- **THEN** the live-region announcement "Auto-match suggestions: 3 pending" (or equivalent) is emitted to assistive tech without stealing focus; the `role="region"` landmark and `aria-label="Auto-match suggestions"` are reachable via screen-reader region navigation

### Requirement: Auto-match dismissal TTL is a named constant

The 24-hour dismissal expiry referenced by the banner suppression rule and the `isAutoMatchBannerDismissed` use case SHALL be a single named constant `DISMISSAL_TTL_MS` defined in `application/auto-match-dismissal-ttl.ts`, with value `24 * 60 * 60 * 1000`. All call sites SHALL import the constant by name; literal `24 * 60 * 60 * 1000` or `86400000` literals SHALL NOT appear elsewhere. Future tuning (e.g., to 12 hours or 48 hours) SHALL change only the constant.

#### Scenario: Single source of truth

- **WHEN** the banner suppression check runs and the dismissal TTL is later updated to 12 hours
- **THEN** updating only `DISMISSAL_TTL_MS` SHALL change the suppression window across the entire SPA; no other call site requires changes; tests verify the constant is the only source consulted

### Requirement: AutoMatchDismissalRepository port

The infrastructure layer SHALL implement `AutoMatchDismissalRepository` exposing:

- `getByProfileAndWeek(profileId, weekStart): Promise<AutoMatchDismissal | undefined>`
- `put(dismissal: AutoMatchDismissal): Promise<void>` — upsert by `(profileId, weekStart)` composite key.
- `delete(profileId, weekStart): Promise<void>` — idempotent.
- `deleteByProfile(profileId): Promise<void>` — cascade hook on profile delete.

The persisted shape:

```
{
  profileId: string,
  weekStart: string,        // YYYY-MM-DD (ISO Monday)
  dismissedAt: string       // ISO timestamp from injected clock
}
```

The Dexie adapter SHALL register a cascade hook so deleting a `profiles` row deletes the corresponding `auto_match_dismissals` rows.

#### Scenario: Dismissal suppresses banner for 24 hours

- **WHEN** the user clicks "Dismiss all" at time `T` and re-opens the calendar at `T + 1h`
- **THEN** no banner is rendered for the same `(profileId, weekStart)` even if `autoMatchSessions` returns suggestions

#### Scenario: Dismissal expires after 24 hours

- **WHEN** the user dismissed at `T` and re-opens the calendar at `T + 25h` with suggestions still pending
- **THEN** the banner is rendered again (the dismissal is treated as expired)

#### Scenario: Cascade on profile delete

- **WHEN** profile `P` is deleted and `auto_match_dismissals` had rows for `P`
- **THEN** those rows are deleted; subsequent `getByProfileAndWeek(P, ...)` returns `undefined`

### Requirement: Cascade hooks run inside a single Dexie transaction

The Dexie adapters for `coachingActivities`, `workouts`, `session_matches`, `user_preferences`, and `auto_match_dismissals` SHALL ensure that any delete operation which triggers a cascade hook is wrapped in a `db.transaction('rw', ...)` that includes BOTH the parent table AND every child table the cascade may write. A crash mid-transaction SHALL leave the database in the pre-transaction state (Dexie's transactional guarantee).

In particular: deleting a `coachingActivities` row (e.g., during `syncWeek` orphan cleanup per `spa-coaching-integration`) SHALL run inside a transaction covering `coachingActivities` and `session_matches`. Deleting a `workouts` row SHALL run inside a transaction covering `workouts` and `session_matches`. Deleting a `profiles` row SHALL run inside a transaction covering `profiles`, `coachingActivities`, `session_matches`, `user_preferences`, and `auto_match_dismissals` — orchestrated by an explicit `deleteProfile(profileId)` use case (or equivalent) that opens the transaction; cascade hooks alone are insufficient because `db.profiles.delete(id)` outside a wrapping transaction would let the chained hooks fire in independent auto-transactions, leaving partial state on a mid-fan-out crash.

**Cascade-table inventory** — the authoritative list of cascade tables per parent SHALL be co-located with the Dexie adapter (e.g., a `CASCADE_TABLES` constant in `adapters/dexie/cascade-tables.ts`) and each entry SHALL be unit-tested:

| Parent table         | Cascade tables                                                                       |
| -------------------- | ------------------------------------------------------------------------------------ |
| `coachingActivities` | `session_matches`                                                                    |
| `workouts`           | `session_matches`                                                                    |
| `profiles`           | `coachingActivities`, `session_matches`, `user_preferences`, `auto_match_dismissals` |

A unit test SHALL assert `CASCADE_TABLES` matches this inventory exactly — adding a new cascade table anywhere SHALL fail the test until the inventory is updated, preventing silent drift between the Dexie hooks and the transaction-table list. (The `profiles` cascade table list does NOT include `workouts` because workouts are profile-agnostic per `spa-coaching-integration` "Convert coaching activity to workout".)

#### Scenario: Cascade table inventory is enumerated and tested

- **WHEN** a developer adds a new cascade hook (e.g., a future `notifications` table cascading on profile delete) without updating `CASCADE_TABLES`
- **THEN** the inventory unit test fails immediately, blocking the change until the inventory and the orchestrator transaction's table list are updated together

#### Scenario: Mid-sync transaction abort leaves no dangling references

- **WHEN** `syncWeek` deletes a `coachingActivities` row inside a `db.transaction('rw', [coachingActivities, session_matches], ...)` and the transaction callback throws (or invokes `transaction.abort()`) between the activity delete and the cascade hook — simulating a crash, an unexpected error, or an explicit abort
- **THEN** Dexie rolls back the transaction; the activity row is restored; the `session_matches` row is unchanged; no dangling reference exists. (The test uses `transaction.abort()` as the deterministic equivalent of an engine crash.)

#### Scenario: Profile delete is atomic across all cascade tables

- **WHEN** profile `P` is deleted while it has rows in all four cascade-targeted tables
- **THEN** all five operations (profile delete + four cascade deletes) commit atomically; a partial failure rolls back to the pre-delete state
