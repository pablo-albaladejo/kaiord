## MODIFIED Requirements

<!-- MODIFIED FROM archived 2026-05-01-calendar-coaching-redesign / spa-coaching-integration / Requirement: CoachingActivityDialog. The full prior block is reproduced below; the dialog body and primary-action set are restructured to surface match/split actions (issue #432). The archived "Convert action navigates to editor" scenario is preserved verbatim under its solo-plan-only renaming. -->

### Requirement: CoachingActivityDialog

Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal showing:

- Sport icon and label
- Title
- Date
- Duration (if present)
- Intensity (1-5 dot indicator, if present)
- Status (pending / completed / skipped) and `completionPercent` if present
- Description (full text; fetched lazily via `read-day` when `description === undefined` — a persisted `description: ""` is treated as "known empty" and does NOT re-fire, per `spa-train2go-extension` "Fetch training plan on user action")
- A "Close" action

The dialog's primary actions SHALL be driven by whether the activity is currently part of a `SessionMatch`:

- **Solo-plan state** (the activity is NOT matched to any workout): the dialog SHALL render a "Convert to workout" action AND a "Match to…" action. The "Match to…" action SHALL open a sub-picker listing `WorkoutRecord`s for the active profile that satisfy ALL of: (a) same `date` as the activity, (b) same canonical `sport` family per `autoMatchSessions`'s `same date AND same sport` rule, and (c) NOT already part of a `SessionMatch` row **for the active profile**. Workouts matched in another profile remain candidates here because `SessionMatch` uniqueness is profile-scoped (this property is currently asserted in the archived `spa-session-match` spec under the `SessionMatch aggregate` requirement, scenario "Same workout matched in two profiles" — to be promoted into the active `openspec/specs/spa-session-match/` capability by the follow-up `/opsx-sync` operation; this change relies on it as a documented invariant, not on its current physical location). Selecting one SHALL invoke `matchSession({ source: "manual", profileId, coachingActivityId, workoutId })`. After a successful match, the dialog SHALL re-render in matched state without closing.
- **Matched state** (a `SessionMatch` row exists for this activity): the dialog SHALL render a "Linked workout" section showing the matched workout's title, sport, and duration, plus a "Split" action that invokes `unmatchSession({ profileId, coachingActivityId, workoutId })`. After a successful split, the dialog SHALL re-render in solo-plan state without closing. The "Convert to workout" action SHALL be hidden while the activity is matched (the actual workout already exists, so conversion would produce a duplicate).

Interactions with the match/split actions SHALL disable their button during the in-flight write, so a user cannot trigger the same action twice while the first request is pending. The dialog SHALL replace the current in-place description toggle on `CoachingActivityCard`. The card click handler SHALL only open the dialog (no toggling).

The dialog SHALL capture the active `profileId` at open time and pass it explicitly into `matchSession`, `unmatchSession`, and any related write call. Use cases SHALL NOT resolve the active profile via `getActiveId()` at submit time. This mirrors the `linkAccount` profile-switch-safe pattern (see "Profile switch mid-link preserves user intent") so a profile switch performed while the dialog is open does not silently rebind a write to the new profile.

The Match-to picker SHALL be keyboard operable: `Tab` focuses the first list item; `ArrowDown` / `ArrowUp` move focus within the list; `Enter` selects the focused item; `Escape` closes the picker without closing the parent dialog (Escape on the parent dialog continues to close the dialog itself).

#### Scenario: Dialog opens with persisted description

- **WHEN** the user clicks a coaching card and `description` is already populated
- **THEN** the dialog opens immediately with the description visible, and no `read-day` call is made

#### Scenario: Dialog opens and lazy-loads description

- **WHEN** the user clicks a coaching card and `description` is `undefined` (never fetched), and a persisted empty string `""` is treated as "known empty" and does NOT re-fire per `spa-train2go-extension` "Fetch training plan on user action"
- **THEN** the dialog opens with a loading indicator in the description region, fires `read-day`, upserts every activity returned by `read-day` (siblings included), and re-renders with the description

#### Scenario: Convert action navigates to editor (solo plan only)

- **GIVEN** the activity is NOT matched to any workout
- **WHEN** the user clicks "Convert to workout" inside the dialog
- **THEN** the dialog closes, `convertCoachingActivity` runs, and the user is routed to `/workout/:id` for the resulting workout

#### Scenario: Match-to picker lists same-day same-sport unmatched workouts

- **GIVEN** the active profile has a coaching activity `A` (sport=cycling, date=2026-05-04) in solo-plan state
- **AND** workouts `W1` (cycling, 2026-05-04, unmatched), `W2` (running, 2026-05-04, unmatched), `W3` (cycling, 2026-05-04, already matched), and `W4` (cycling, 2026-05-05, unmatched) all exist for that profile
- **WHEN** the user clicks "Match to…" inside the dialog
- **THEN** the picker shows only `W1` (same day, same sport, unmatched); `W2` is excluded by sport, `W3` by match state, `W4` by date

#### Scenario: Selecting a workout in the picker matches it to the activity

- **GIVEN** the picker is open and lists `W1` as the single candidate
- **WHEN** the user selects `W1`
- **THEN** `matchSession({ source: "manual", profileId, coachingActivityId: A, workoutId: W1 })` is invoked; on success the dialog re-renders in matched state showing the "Linked workout" section for `W1`; the "Convert to workout" action is no longer visible

#### Scenario: Split action removes the match and restores solo-plan state

- **GIVEN** the activity is matched to workout `W` and the dialog is rendering the "Linked workout" section
- **WHEN** the user clicks "Split"
- **THEN** `unmatchSession` is invoked; on success the dialog re-renders in solo-plan state with the "Match to…" and "Convert to workout" actions visible again; the workout is no longer linked

#### Scenario: Split on a stale match is a no-op

- **GIVEN** the dialog is open in matched state in tab A; the user already split the same match in tab B (so the `sessionMatches` row no longer exists), but the live-query update has not yet propagated to tab A
- **WHEN** the user clicks "Split" in tab A
- **THEN** `unmatchSession` resolves successfully without throwing (the use case is idempotent — deleting an already-deleted match is a no-op); on the next live-query tick the dialog re-renders in solo-plan state; no error is surfaced to the user

#### Scenario: Match action button is disabled during the in-flight write

- **GIVEN** the dialog is in solo-plan state and the user clicks "Match to…", selects a workout, and the matchSession promise is pending
- **WHEN** the user clicks the same selection button again before the first call resolves
- **THEN** the button is disabled; only one matchSession call is dispatched; on resolution the dialog re-renders in matched state exactly once

#### Scenario: Convert is hidden when matched

- **GIVEN** the activity is in matched state
- **WHEN** the dialog renders
- **THEN** the "Convert to workout" action is not present in the DOM; the only writeable action is "Split"

#### Scenario: Matched workout deleted while dialog is open

- **GIVEN** the dialog is open in matched state for activity `A` linked to workout `W`
- **WHEN** workout `W` is deleted in another tab (cascade fires removing the `SessionMatch` row)
- **THEN** the dialog re-renders in solo-plan state on the next live-query tick (via `useMatchedSessions`); the "Linked workout" section disappears; the "Convert to workout" and "Match to…" actions reappear; no error is thrown; the dialog does NOT close

#### Scenario: Picker filter respects profile-scoped match state

- **GIVEN** the active profile is `P1` and the coaching activity has date=2026-05-04, sport=cycling
- **AND** every `WorkoutRecord` is profile-agnostic (per `spa-coaching-integration` "Convert coaching activity to workout"); workouts `W1` (cycling, 2026-05-04, matched in `P1`), `W2` (cycling, 2026-05-04, matched in `P2` only — unmatched in `P1`), `W3` (cycling, 2026-05-04, unmatched in any profile), `W5` (running, 2026-05-04, unmatched), and `W6` (cycling, 2026-05-05, unmatched) all exist
- **WHEN** the user clicks "Match to…"
- **THEN** the picker lists `W2` and `W3` (both not part of any `SessionMatch` row scoped to `P1`); `W1` is excluded because a `SessionMatch` row already exists for `(P1, W1)`; `W5` is excluded by sport; `W6` is excluded by date

#### Scenario: Profile switch mid-dialog preserves the original profile

- **GIVEN** the dialog opened on profile `P1` and the user has not yet clicked "Match to…"
- **WHEN** the user switches the active profile to `P2` (e.g., via a profile switcher in another tab) and then completes the match in the still-open dialog
- **THEN** `matchSession` is invoked with `profileId: P1` (captured at dialog-open time); the `P2` data is unaffected; the dialog reflects the original `P1` activity throughout

#### Scenario: Match-to picker keyboard navigation

- **GIVEN** the picker lists 3 candidate workouts and is open
- **WHEN** the user presses `Tab` to focus the picker, then `ArrowDown` twice, then `Enter`
- **THEN** the third candidate workout is selected; `matchSession` is invoked with that workout's id; the picker closes; the dialog re-renders in matched state

#### Scenario: Picker Escape closes only the picker

- **GIVEN** the picker is open inside the dialog
- **WHEN** the user presses `Escape`
- **THEN** the picker closes; the parent dialog remains open in solo-plan state; pressing `Escape` again closes the dialog
