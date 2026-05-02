## MODIFIED Requirements

### Requirement: CoachingActivityDialog

Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal showing:

- Sport icon and label
- Title
- Date
- Duration (if present)
- Intensity (1-5 dot indicator, if present)
- Status (pending / completed / skipped) and `completionPercent` if present
- Description (full text; fetched lazily via `read-day` when `description === undefined` — a persisted `description: ""` is treated as "known empty" and does NOT re-fire, per `spa-train2go-extension` "Fetch training plan on user action")
- A "Convert to workout" action button
- A "Close" action

The dialog SHALL replace the current in-place description toggle on `CoachingActivityCard`. The card click handler SHALL only open the dialog (no toggling).

`CoachingActivityDialog` and its backing `useCoachingDialog` hook MUST NOT consume the coaching-source registry directly (i.e., they MUST NOT call `useCoachingSourceFactories` and MUST NOT invoke any `CoachingSourceFactory`). The lazy-load action SHALL be triggered via an `expandActivity(activity)` callback supplied by the caller. The caller (the calendar page consuming `useCoachingActivities`) is the single site that materializes coaching sources for the render tree, ensuring at most one `useLiveQuery` subscription per source per render. This separation is required to keep the dialog free of the `CoachingSourceFactory` hook composition (factories ARE React hooks; invoking them inside `useEffect` or inside `Array.map` violates the Rules of Hooks).

#### Scenario: Dialog opens with persisted description

- **WHEN** the user clicks a coaching card and `description` is already populated
- **THEN** the dialog opens immediately with the description visible, and no `read-day` call is made

#### Scenario: Dialog opens and lazy-loads description

- **WHEN** the user clicks a coaching card and `description` is empty
- **THEN** the dialog opens with a loading indicator in the description region; the dialog invokes its `expandActivity(activity)` callback (the same callback returned by `useCoachingActivities`, which calls `source.expand(profileId, activity.date)` — the source's `expand` method then fires the `read-day` bridge call per `spa-train2go-extension`); the use case upserts every activity returned by `read-day` (siblings included); the dialog re-renders with the description

#### Scenario: Convert action navigates to editor

- **WHEN** the user clicks "Convert to workout" inside the dialog
- **THEN** the dialog closes, `convertCoachingActivity` runs, and the user is routed to `/workout/:id` for the resulting workout

#### Scenario: Dialog renders without consuming the coaching registry

- **WHEN** `CoachingActivityDialog` is mounted with a `CoachingActivity` whose `source` matches a real registered factory (e.g., the production `useTrain2GoSource`)
- **THEN** rendering the dialog does not invoke any `CoachingSourceFactory` hook (no `useTrain2GoStore`, `useLiveQuery`, etc. fires from inside the dialog tree), and rendering does not throw a Rules-of-Hooks violation
