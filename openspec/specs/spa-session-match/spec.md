> Synced: 2026-05-02 (calendar-coaching-redesign-completion)

# spa-session-match Specification

## Purpose

Persists per-pair user verdicts on auto-match suggestions ("don't suggest this activity↔workout pair again for this week") and the cascade hooks that keep those verdicts coherent when the underlying activity / workout / profile is deleted. The broader SessionMatch surface (matchSession, unmatchSession, autoMatchSessions, useMatchedSessions, compliance score derivation) ships in production from PRs #410 and #415 of the archived `2026-05-01-calendar-coaching-redesign` change but is not yet promoted into this spec — see follow-up issue #460 (`/opsx-sync` lift of the archived requirements).

## Requirements

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

A complementary `isAutoMatchBannerDismissed(input: IsDismissedInput, deps: IsDismissedDeps): Promise<boolean>` SHALL return `true` when the row for `(profileId, weekStart)` contains a `dismissedPairs` entry matching `(activityId, workoutId)`, and `false` otherwise. Both use cases share the same repository port; neither use case SHALL invoke `useLiveQuery` directly — reactivity is the responsibility of the view-model hook in `spa-calendar`.

`dismissAutoMatchBanner` SHALL reject with `InvalidInputError` when any of `profileId`, `weekStart`, `activityId`, or `workoutId` is the empty string or `undefined` — defensive against accidental empty-key writes that would otherwise land in a degenerate "global dismissal" row. `isAutoMatchBannerDismissed` is asymmetric: instead of throwing, it SHALL return `false` on any empty/`undefined` input. Throwing on the read path would propagate a defensive guard into the render call site (where `false` ≡ "not dismissed" is the safe-default UX).

When the dialog or its callers surface a write failure to the user, the toast first argument MUST be a static string literal per the project's R-PIIInterpolation guard (no interpolation of activity titles, workout names, or any identifier). Per-suggestion context belongs in the toast description body or in a follow-up details surface, not in the title.

`dismissAutoMatchBanner` SHALL refuse to grow `dismissedPairs` beyond **256** entries per `(profileId, weekStart)` row. If the row already holds 256 distinct pairs, a further dismiss of a **new** pair SHALL be a no-op (the call resolves successfully without modifying the row); a re-dismiss of an **already-recorded** pair SHALL still update the existing entry's `dismissedAt` in place (no growth, so the cap is not violated — see scenario "Re-dismiss at the cap updates the existing entry"). The use case MAY emit a warning via the injected logger but MUST NOT throw. The warning message MUST be a static string literal (e.g., `"dismissAutoMatchBanner: cap reached"`) — it MUST NOT include the rejected `activityId`, `workoutId`, `profileId`, or any other identifier; the project's R-PIIInterpolation guard forbids dynamic identifier interpolation in logger / toast first-arguments. This 256-entry bound is two orders of magnitude beyond any plausible weekly coaching density and exists as a runaway-growth guard.

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
- **THEN** the row remains a single entry whose `dismissedAt` is updated to `T2`; no duplicate entry is appended; no error is thrown

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
- **THEN** the use case re-throws the underlying error; no partial row is left half-written; the caller is responsible for surfacing a toast and never silently swallows the failure

#### Scenario: Empty-string input is rejected by the write path

- **WHEN** `dismissAutoMatchBanner` is invoked with `profileId: ""` (or any other required field empty/undefined)
- **THEN** the use case rejects with `InvalidInputError` before any repository read or write; no row is mutated

#### Scenario: Empty-string input on the read path returns false

- **WHEN** `isAutoMatchBannerDismissed` is invoked with `profileId: ""` (or any other required field empty/undefined)
- **THEN** the use case resolves with `false`; no repository read occurs; no error is thrown — the banner safe-defaults to "not dismissed" rather than crashing the render

#### Scenario: 257th distinct pair within one row is a no-op

- **GIVEN** the row for `(P, W)` already holds 256 distinct `dismissedPairs` entries
- **WHEN** `dismissAutoMatchBanner` is invoked with a 257th distinct pair `(A_new, X_new)`
- **THEN** the call resolves successfully; the row is unchanged; a warning MAY be logged; no error is thrown to the caller

#### Scenario: Re-dismiss at the cap updates the existing entry

- **GIVEN** the row for `(P, W)` holds exactly 256 distinct `dismissedPairs` entries, one of which is `(A, X)` with `dismissedAt: T1`
- **WHEN** `dismissAutoMatchBanner` is invoked again for the SAME `(A, X)` with `clock() = T2`
- **THEN** the call resolves successfully; the existing entry's `dismissedAt` is updated to `T2`; `dismissedPairs.length` remains 256; the cap is not violated (no growth occurred — only an in-place update)

### Requirement: AutoMatchDismissalRepository port

The infrastructure layer SHALL implement `AutoMatchDismissalRepository` exposing the per-pair-aware row shape. The port SHALL define:

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

The Dexie adapter SHALL register a cascade hook so deleting a `profiles` row deletes the corresponding `autoMatchDismissals` rows. The composite primary key `(profileId, weekStart)` was provisioned in Dexie schema v5; the new `dismissedPairs` field is non-indexed.

The shape **REPLACES** the prior archived `{ profileId, weekStart, dismissedAt }` form (single top-level timestamp) via a forward-only Dexie schema bump (v7) whose upgrade hook clears the `autoMatchDismissals` table. The table is UX-state cache, not user data — losing dismissals once on upgrade is acceptable and far simpler than a row-by-row reshape. The adapter is single-shape: it never reads or writes the prior form, and no legacy code path lives in the call graph.

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
- **THEN** the call resolves successfully; no error is thrown; subsequent `getByProfileAndWeek(P, W)` continues to return `undefined`

#### Scenario: Profile delete cascade

- **WHEN** profile `P` is deleted via `deleteProfile(P)` and `auto_match_dismissals` had rows for `P`
- **THEN** those rows are deleted as part of the same Dexie transaction that deletes the profile; partial rollback on transaction failure leaves all rows intact (per `Cascade hooks run inside a single Dexie transaction`)

### Requirement: Per-pair dismissals do not expire on a TTL

The dismissal model SHALL be **per-pair, weekStart-scoped, and TTL-free** within a given week. Once a `(profileId, weekStart, activityId, workoutId)` pair is recorded in `dismissedPairs`, the auto-match banner SHALL NOT re-surface that pair on the same device for that week, regardless of how many times `autoMatchSessions` re-runs. The dismissal stops applying — at distinct layers — when:

- **Consumer-layer scope change**: the user navigates to a different `weekStart`. The data row for the original week is unchanged; the consumer's filter simply does not consult it for the new week.
- **Data-layer deletion (indirect)**: the underlying `coachingActivities` row OR `workouts` row is deleted (e.g., during sync orphan cleanup). Cascade hooks SHALL remove or invalidate the corresponding `dismissedPairs` entry so a re-arriving id under the same primary key cannot inherit a prior verdict.
- **Data-layer match (indirect)**: the user explicitly accepts the suggestion via a separate code path (Accept invokes `matchSession` and the resulting `SessionMatch` row excludes the pair from `autoMatchSessions` enumeration entirely; the dismissal entry, while still present, becomes dead data and is not consulted).

This is a deliberate departure from any prior TTL-based model: the user's "this is not a match" verdict is per-pair information that does not stale on the clock.

#### Scenario: Re-running the heuristic does not re-surface a dismissed pair

- **GIVEN** the user dismissed `(A, X)` on week `W`
- **WHEN** a subsequent sync re-runs `autoMatchSessions` and produces the same `(A, X)` suggestion plus a fresh `(A2, X2)` suggestion
- **THEN** the banner renders only `(A2, X2)`; the dismissed `(A, X)` is filtered out at the consumer layer

#### Scenario: Different week is unaffected by another week's dismissals

- **GIVEN** `(A, X)` is dismissed on `weekStart = "2026-05-04"`
- **WHEN** the user navigates to `weekStart = "2026-05-11"` and that week's auto-match returns a `(A', X')` suggestion involving different ids
- **THEN** the banner renders for the new week unaffected by the prior week's dismissal state

#### Scenario: Coaching activity deletion lifts the dismissal indirectly

- **GIVEN** `(A, X)` is in `dismissedPairs` for `(P, W)`
- **WHEN** activity `A` is deleted (e.g., during `syncWeek` orphan cleanup)
- **THEN** the deletion cascades to remove `A` from any `dismissedPairs` entries (or, equivalently, the consumer-layer filter no longer matches because activity `A` is gone from the suggestion stream); the user is not stuck with a permanent dismissal of a deleted activity

#### Scenario: Resync replaces activity id but produces a new pair

- **GIVEN** `(A, X)` is dismissed for `(P, W)`; a subsequent Train2Go sync deletes activity `A` and inserts a fresh activity `A'` covering the same date and sport (Train2Go's composite-id contract guarantees `A' ≠ A`)
- **WHEN** `autoMatchSessions` re-runs and produces a suggestion `(A', X)`
- **THEN** the banner renders `(A', X)` because the new id is not in `dismissedPairs`; the orphan-cleanup of `A` cascades to remove its `dismissedPairs` entry, leaving the row clean

### Requirement: Cascade hooks on coaching-activity and workout deletion

The Dexie adapters SHALL register cascade hooks so that:

- Deleting a `coachingActivities` row (e.g., during `syncWeek` orphan cleanup, or via direct API call) SHALL also delete every `sessionMatches` row whose `coachingActivityId` equals the deleted activity's id, AND SHALL purge every `dismissedPairs` entry whose `activityId` equals the deleted activity's id from any `autoMatchDismissals` row **in the same profile** (coaching activities are profile-scoped, so the purge is naturally bounded to the activity's owning profile).
- Deleting a `workouts` row SHALL also delete every `sessionMatches` row whose `workoutId` equals the deleted workout's id, AND SHALL purge every `dismissedPairs` entry whose `workoutId` equals the deleted workout's id from any `autoMatchDismissals` row **across all profiles** (workouts are profile-agnostic, so the purge crosses profile boundaries; without this, a different profile's dismissal could outlive the workout it referenced).

Both cascades SHALL run inside the same Dexie transaction as the parent delete (per `Cascade hooks run inside a single Dexie transaction` from the archived design D1, which this change inherits). A crash mid-cascade SHALL leave the database in the pre-delete state.

Naming note: table identifiers in this requirement use **camelCase** (`coachingActivities`, `sessionMatches`, `workouts`, `autoMatchDismissals`) per the project's adapter-schema convention (see CLAUDE.md "Schema conventions"). Where snake_case names appear elsewhere in this change set (`auto_match_dismissals`, `coaching_activities`), they refer to the same underlying physical tables; the casing reflects the legacy schema-bump history rather than a different store.

These hooks are the data-layer mechanism behind the spec scenarios "Coaching activity deletion lifts the dismissal indirectly" and "Matched workout deleted while dialog is open" — without them, those scenarios cannot hold.

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
