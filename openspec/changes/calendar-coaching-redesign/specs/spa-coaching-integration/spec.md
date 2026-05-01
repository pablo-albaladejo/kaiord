## ADDED Requirements

### Requirement: parseCoachingDuration parses free-text duration

The application layer SHALL expose a pure function `parseCoachingDuration(s: string | undefined): number | undefined` in `application/parse-coaching-duration.ts` that converts the free-text `CoachingActivityRecord.duration` field to seconds, returning `undefined` on parse failure.

The function SHALL handle:

- Plain minutes: `"45 min"`, `"45min"`, `"45 minutes"` → `2700`
- Hours: `"1h"`, `"1 h"`, `"1 hour"` → `3600`
- Hours and minutes: `"1h 30"`, `"1h30"`, `"1h 30m"`, `"1 h 30 min"` → `5400`
- Cycling apostrophe notation: `"45'"` → `2700`; `"1h 30'"` → `5400`
- ISO 8601 durations: `"PT45M"` → `2700`; `"PT1H30M"` → `5400`; `"PT1H"` → `3600`
- Approximate marker (dropped): `"~45 min"` → `2700`
- Ranges (use lower bound): `"45-50 min"` → `2700`; `"1h-1h30"` → `3600`

The function SHALL return `undefined` for:

- `undefined` input
- Empty or whitespace-only string
- Any input not matching one of the supported forms

ISO 8601 duration **range** syntax (e.g., `"PT45M/PT50M"` or `"PT45M--PT50M"`) is NOT supported in v1 — bare ISO 8601 durations only. Range inputs in ISO syntax fall through to "any other input" and return `undefined`.

The function SHALL be unit-tested with each of the canonical forms above plus negative cases (unparseable inputs).

#### Scenario: Plain minutes parse to seconds

- **WHEN** `parseCoachingDuration("45 min")` is called
- **THEN** the result is `2700`

#### Scenario: ISO 8601 duration parses

- **WHEN** `parseCoachingDuration("PT1H30M")` is called
- **THEN** the result is `5400`

#### Scenario: Range uses lower bound

- **WHEN** `parseCoachingDuration("45-50 min")` is called
- **THEN** the result is `2700` (lower bound; documented v1 convention)

#### Scenario: Hour-range uses lower bound

- **WHEN** `parseCoachingDuration("1h-1h30")` is called
- **THEN** the result is `3600` (lower bound; consistent with the minute-range rule)

#### Scenario: Approximate marker is dropped

- **WHEN** `parseCoachingDuration("~45 min")` is called
- **THEN** the result is `2700`

#### Scenario: Unparseable input returns undefined

- **WHEN** `parseCoachingDuration("qsdf")` or `parseCoachingDuration("")` or `parseCoachingDuration(undefined)` is called
- **THEN** the result is `undefined`

#### Scenario: Lossless round-trip on canonical forms

- **WHEN** any value `s` from the supported-forms list is fed through `parseCoachingDuration` and the result is non-undefined
- **THEN** the function is deterministic — the same input always returns the same number

## MODIFIED Requirements

### Requirement: CoachingActivityRecord shape

A `CoachingActivityRecord` SHALL have the shape:

```
{
  id: string,                     // composite: ${profileId}:${source}:${sourceId}
  profileId: string,              // owning profile
  source: string,                 // e.g., "train2go"
  sourceId: string,               // platform's id, captured as string at JSON parse boundary
  date: string,                   // YYYY-MM-DD in user's local timezone, matching the spa-calendar week-id convention (Monday-start ISO weeks)
  sport: string,                  // raw sport key
  title: string,
  duration?: string,              // free-text from platform
  workload?: number,              // raw platform metric — preserved without lossy clamping
  intensity?: 1 | 2 | 3 | 4 | 5,  // mapper-normalized 1-5 for UI
  status: "pending" | "completed" | "skipped",
  completionPercent?: number,     // 0-100, distinct from status
  description?: string,           // populated lazily on expand
  fetchedAt: string               // ISO timestamp of last fetch
}
```

`workload`, `intensity`, `status`, and `completionPercent` are independent and orthogonal — `status: "completed"` with `completionPercent: 85` is valid (a coach can mark something done even when partially completed). Each platform-specific record mapper SHALL provide and unit-test a deterministic `workload → intensity` mapping that produces a value in `{1,2,3,4,5}` (or `undefined`). The canonical Train2Go mapping is `clamp(workload, 1, 5)`; the future TrainingPeaks mapping (TSS → 1-5) SHALL be specified and tested in its own change. A platform without a workload signal MAY emit `intensity: undefined`.

The composite `id` format SHALL guarantee that re-fetching the same activity from the same coach for the same profile produces the same `id` (deterministic upsert key).

`CoachingActivityRecord` SHALL NOT carry a persisted match link. The plan↔execution match is owned by the `spa-session-match` capability via the `SessionMatch` aggregate, which references `CoachingActivityRecord.id` from the outside. The view-model `CoachingActivity` exposed to the UI MAY include a derived, view-model-only `matchedWorkoutId?: string` populated by the read-side join in `useCoachingActivities`; this field SHALL NOT be persisted on the record.

#### Scenario: Workload preserved without lossy clamping

- **WHEN** Train2Go returns `workload: 7` (above the 1-5 UI scale)
- **THEN** the persisted record has `workload: 7` and `intensity: 5` — both stored, neither overwriting the other

#### Scenario: Status and completion are orthogonal

- **WHEN** Train2Go returns an activity with `status: 1` (completed) and `completion: 85`
- **THEN** the persisted record has `status: "completed"` AND `completionPercent: 85`

#### Scenario: Lossless sourceId

- **WHEN** the platform returns a `sourceId` that exceeds `Number.MAX_SAFE_INTEGER`
- **THEN** the persisted record's `sourceId` matches the platform's value byte-identically (the mapper consumed a string from the JSON parse boundary, never a parsed number)

#### Scenario: Per-platform intensity mapping is unit-tested

- **WHEN** a new coaching adapter is added (e.g., TrainingPeaks)
- **THEN** the adapter package SHALL export a deterministic `workload → intensity` mapping function that returns a value in `{1,2,3,4,5} | undefined`, accompanied by a unit test that exercises the boundary conditions (below-min clamp, above-max clamp, mid-range, missing input)

#### Scenario: Activity without intensity renders without dots

- **WHEN** a `CoachingActivityRecord` has `intensity: undefined`
- **THEN** the `CoachingActivityCard` and `CoachingActivityDialog` render no intensity-dots indicator (instead of rendering empty/zero dots which could be confused with "lowest intensity")

#### Scenario: Match link is derived, not persisted

- **WHEN** a `CoachingActivityRecord` is read directly from the `coachingActivities` Dexie table
- **THEN** the row contains no `matchedWorkoutId` field; the persisted shape matches the schema above exactly

#### Scenario: View-model exposes derived match link

- **WHEN** a `CoachingActivity` is read via `useCoachingActivities` and a `SessionMatch` row exists for the activity
- **THEN** the view-model object's `matchedWorkoutId` is populated with the matched `WorkoutRecord.id`; without a match row, `matchedWorkoutId` is `undefined`

### Requirement: SyncWeek orphan cleanup within window

`weekStart` SHALL be the Monday (ISO week-start) of the target week, formatted `YYYY-MM-DD` in the user's local date interpretation. The week range is `[weekStart, weekStart + 6 days]` inclusive. This matches the existing `spa-calendar` week-id convention (`YYYY-Wnn`) and ensures the orphan-cleanup window is unambiguous regardless of platform locale.

`syncWeek(profileId, weekStart)` SHALL NOT be a pure upsert. After upserting the freshly-fetched activities for `(profileId, source, weekStart..weekEnd)`, the use case SHALL delete any locally-persisted `coachingActivities` rows whose key matches `(profileId, source, dateInWeek)` but whose `id` does not appear in the fetch payload (coach-removed activities).

`CoachingRepository.delete(id)` SHALL be a no-op when the row does not exist (e.g., concurrently deleted by another `syncWeek` call). The orphan-cleanup loop tolerates absent rows without raising.

The deletion window MUST be scoped to the current week being synced — never to the whole profile. Activities in other weeks remain untouched.

`coachingSyncState[(source, profileId)].lastSyncedAt` SHALL be updated UNCONDITIONALLY on a successful fetch (via `coachingSyncState.put`), including a zero-activity response. This prevents the staleness gate from re-firing every render on an empty week.

When orphan cleanup deletes a `coachingActivities` row, the cascade hook on `session_matches` (per `spa-session-match`) SHALL also delete any `SessionMatch` row referencing that activity. The orphan loop itself does NOT need to enumerate matches — the cascade is registered at the Dexie adapter layer and runs atomically with the activity deletion. The next render after sync SHALL show no dangling references and SHALL render any previously-matched workout as a SOLO ACTUAL card if the planned side was orphaned.

#### Scenario: Coach-removed activity is cleaned up

- **WHEN** week W has 3 persisted activities and `read-week` returns only 2 (coach removed one)
- **THEN** the missing activity is deleted from `coachingActivities`; the 2 returned activities are upserted

#### Scenario: Other weeks are not affected by sync

- **WHEN** week W is synced and `read-week` returns 0 activities for W
- **THEN** activities in week W-1 and W+1 remain untouched

#### Scenario: Empty fetch updates lastSyncedAt

- **WHEN** `read-week` returns 0 activities for the requested week
- **THEN** `coachingSyncState[(source, profileId)].lastSyncedAt` is updated to `now`; subsequent renders within the staleness window do not re-fire the sync

#### Scenario: Orphan cleanup cascades to session matches

- **WHEN** activity `A` is matched to workout `W` via a `SessionMatch` row, and the next `syncWeek` orphans `A` (coach removed it)
- **THEN** the `coachingActivities` row for `A` is deleted, the `session_matches` row referencing `A` is also deleted via cascade, and the next calendar render shows `W` as a SOLO ACTUAL card

### Requirement: Convert coaching activity to workout

The system SHALL provide a use case `convertCoachingActivity(activityId)` that:

1. Reads the `CoachingActivityRecord` by id.
2. Computes `namespacedSourceId = ${activity.profileId}:${activity.sourceId}`.
3. Calls `WorkoutRepository.getBySourceId(activity.source, namespacedSourceId)`. If a `WorkoutRecord` already exists, returns its id (idempotent — no duplicate created).
4. Otherwise, creates a new `WorkoutRecord` with `state: "raw"`, `source: activity.source`, `sourceId: namespacedSourceId`, `date`, `sport`, `title`, and `description` carried over from the activity. `id` is a fresh `nanoid()`. No `steps` are populated. Persists via `WorkoutRepository.put`.
5. Auto-links the produced (or existing) workout to the activity by invoking `matchSession({ profileId: activity.profileId, coachingActivityId: activity.id, workoutId: <step 3 or 4 result>, source: "auto-conversion" })`. The auto-link step SHALL be a **no-op** if EITHER side is already part of an existing `SessionMatch` row in this profile (the existing match is preserved, no overwrite, no error). This preserves convert idempotency: repeated invocations on the same activity neither create duplicate workouts nor disrupt prior matches. The use case detects the no-op condition by calling `SessionMatchRepository.getByActivityId(profileId, activity.id)` AND `getByWorkoutId(profileId, workoutId)` BEFORE invoking `matchSession`; if either returns a row, the auto-link step is skipped silently.

   Concurrency: between the pre-check and the `matchSession` write, a concurrent matcher (e.g., another tab accepting an auto-match suggestion targeting the same workout) MAY win the race. If `matchSession` then throws `SessionAlreadyMatchedError` after the pre-check passed, the use case SHALL treat it as a no-op (the concurrent match is preserved; the convert flow does not overwrite or surface an error). Any other error from `matchSession` (e.g., `WorkoutNotFoundError` after a concurrent delete, `CrossProfileMatchError`, infrastructure failure) SHALL propagate to the caller — the workout produced in step 4 is already persisted (workouts have independent value), so partial commit is acceptable.

6. Returns the workout id so the UI can navigate to `/workout/:id`.

The `coachingActivities` row is NOT deleted on conversion — both records coexist (the activity is the source-of-truth from the coach; the workout is Kaiord's editable copy).

The namespacing of `sourceId` ensures that two profiles linking the same Train2Go account each get their own editable workout from the same source activity.

#### Scenario: First-time conversion auto-creates a match with source "auto-conversion"

- **WHEN** the user clicks "Convert to workout" on a coaching activity that has not been converted before in the active profile and is not part of an existing `SessionMatch`
- **THEN** a new `WorkoutRecord` with `state: "raw"` and `sourceId: ${profileId}:${rawSourceId}` is created, persisted, AND a `SessionMatch` row is also persisted with `source` exactly equal to `"auto-conversion"` (NOT `"manual"` or `"auto-suggestion"`), linking activity → new workout; the user is navigated to the editor

#### Scenario: Idempotent re-conversion with existing match preserved

- **WHEN** the user clicks "Convert to workout" on an activity already converted under the same profile (an existing `WorkoutRecord` AND an existing `SessionMatch` row exist)
- **THEN** no new `WorkoutRecord` is created; no new `SessionMatch` is created (no-op on the auto-link step); the user is navigated to the existing workout's editor

#### Scenario: Re-conversion after manual unmatch is a no-op on auto-link

- **WHEN** the user previously converted activity `A` to workout `W` (creating a `SessionMatch`), then manually unmatched, then calls convert again
- **THEN** no new `WorkoutRecord` is created (per step 3 idempotency); the auto-link step does NOT recreate the match (the user's explicit unmatch is respected — matching is the user's intent to surface, not to be re-asserted by side effect)

#### Scenario: Re-conversion when workout was matched to a different activity is a no-op on auto-link

- **WHEN** workout `W` (the convert target by source id) was previously matched to activity `A2` (a different activity), and the user calls convert on activity `A1`
- **THEN** no new `WorkoutRecord` is created; the auto-link step does NOT overwrite the existing `(A2, W)` match; no error is thrown; the user is navigated to `W`

#### Scenario: Conversion is profile-scoped

- **WHEN** Profile A has converted activity 12345 to a workout, and the user switches to Profile B (which has the same Train2Go account linked) and clicks "Convert to workout" on the same source activity 12345
- **THEN** Profile B gets its own new `WorkoutRecord` (different `sourceId` namespace), separate from A's, and a `SessionMatch` row in Profile B linking the new pair

#### Scenario: Coaching activity preserved after conversion

- **WHEN** an activity has been converted to a workout
- **THEN** the activity row remains in `coachingActivities` and continues to render on the calendar (alongside the workout, fused into a `MatchedSessionCard` due to the auto-created match)

#### Scenario: Convert write failure does not navigate

- **WHEN** the user clicks "Convert to workout" and `WorkoutRepository.put` rejects (e.g., IndexedDB quota error)
- **THEN** the use case re-throws; no `SessionMatch` is created; the dialog stays open; an error toast surfaces; the user is NOT navigated to a non-existent `/workout/:id`

#### Scenario: Profile delete preserves converted workouts

- **WHEN** the user deletes a profile that had converted activities
- **THEN** the profile's `coachingActivities` rows are cascade-deleted, the profile's `session_matches` rows are cascade-deleted, but its converted `WorkoutRecord` rows remain (workouts are profile-agnostic today)

#### Scenario: Auto-link error propagates after partial commit

- **WHEN** the user clicks "Convert to workout" and `WorkoutRepository.put` succeeds (step 4) but the auto-link step throws a non-uniqueness error (e.g., `WorkoutNotFoundError` after a concurrent delete, infrastructure failure)
- **THEN** the use case re-throws the error; the workout row remains persisted (it has independent value); the UI surfaces an error toast; the user is NOT navigated to `/workout/:id` (the navigation happens only on successful return)

#### Scenario: Concurrent match between pre-check and matchSession is a no-op

- **WHEN** the convert pre-check finds no existing `SessionMatch` for `(activity, workout)`, but a concurrent matcher (e.g., another tab) writes a match between the pre-check and the convert use case's `matchSession` call, causing `matchSession` to throw `SessionAlreadyMatchedError`
- **THEN** the convert use case SHALL swallow the `SessionAlreadyMatchedError` and complete successfully; the concurrent match is preserved; the user is navigated to the workout editor; no error toast is surfaced

### Requirement: CoachingActivityDialog

Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal showing:

- Sport icon and label
- Title
- Date
- Duration (if present)
- Intensity (1-5 dot indicator, if present)
- Status (pending / completed / skipped) and `completionPercent` if present
- Description (full text; fetched lazily via `read-day` when `description === undefined` — a persisted `description: ""` is treated as "known empty" and does NOT re-fire, per `spa-train2go-extension` "Fetch training plan on user action")
- A **"Linked workout" section** when a `SessionMatch` row exists for this activity, showing the matched workout's title, sport, duration, and a "Split" action (invokes `unmatchSession` per `spa-session-match`).
- A **"Match to…" action** when no `SessionMatch` row exists, opening a sub-picker listing same-day same-sport workouts that are not already matched. Selecting one invokes `matchSession`.
- A "Convert to workout" action button (only when no match exists; matched activities already have a corresponding workout on the actual side).
- A "Close" action

The dialog SHALL replace the current in-place description toggle on `CoachingActivityCard`. The card click handler SHALL only open the dialog (no toggling). When the dialog is opened from a `MatchedSessionCard`, the dialog SHALL render with the "Linked workout" section visible by default; the planned-side data is shown above and the matched-workout data below, matching the card's compact summary.

#### Scenario: Dialog opens with persisted description

- **WHEN** the user clicks a coaching card and `description` is already populated
- **THEN** the dialog opens immediately with the description visible, and no `read-day` call is made

#### Scenario: Dialog opens and lazy-loads description

- **WHEN** the user clicks a coaching card and `description` is empty
- **THEN** the dialog opens with a loading indicator in the description region, fires `read-day`, upserts every activity returned by `read-day` (siblings included), and re-renders with the description

#### Scenario: Convert action navigates to editor

- **WHEN** the user clicks "Convert to workout" inside the dialog and no `SessionMatch` exists for the activity
- **THEN** the dialog closes; `convertCoachingActivity` runs (which auto-creates a `SessionMatch` with `source: "auto-conversion"` per "Convert coaching activity to workout"); the user is routed to `/workout/:id` for the resulting workout

#### Scenario: Linked-workout section shown for matched activity

- **WHEN** the user opens the dialog for a coaching activity that has a `SessionMatch` row
- **THEN** the dialog shows a "Linked workout" section with the matched workout's title, sport, duration, and a "Split" button; the "Convert to workout" action is hidden

#### Scenario: Split action unmatches and reopens as solo

- **WHEN** the user clicks "Split" in the linked-workout section
- **THEN** `unmatchSession` runs; the dialog updates to hide the linked-workout section; the next calendar render shows the planned activity and the workout as two separate cards in the same day column

#### Scenario: Match-to action opens picker

- **WHEN** the user opens the dialog for a coaching activity with no `SessionMatch` row and clicks "Match to…"
- **THEN** a sub-picker lists same-day workouts whose `canonicalSportFamily` (per `spa-session-match` "Sport family canonical mapping") matches the activity's family, filtered to those not already matched in the current profile; selecting one invokes `matchSession({source:"manual"})`; the dialog updates to show the new linked-workout section. The use of `canonicalSportFamily` (not raw `sport`) ensures parity with auto-match candidate enumeration — a swim plan can be paired with a pool-swim workout, etc.

#### Scenario: Match-to picker with zero candidates shows empty state

- **WHEN** the user opens the picker on a date with no unmatched same-family workouts (common: athlete has not uploaded yet)
- **THEN** the picker renders an empty-state message `"No unmatched workouts on <Weekday, MMM D>. Upload a workout to match this plan."` (e.g., `"No unmatched workouts on Wed, Apr 29. ..."`) — the date format SHALL be human-readable to match the `CalendarHeader` week-label tone, NEVER the raw `YYYY-MM-DD` ISO form; the picker remains keyboard-dismissable via Escape; no list rows render
