## ADDED Requirements

### Requirement: Auto-match suggestion banner mounted in CalendarPage

`CalendarPage` SHALL render an `AutoMatchBanner` above the week grid whenever `useAutoMatchSuggestions(activeProfileId, weekStart)` returns one or more suggestions for which `isAutoMatchBannerDismissed` returns `false`. The page SHALL filter the raw suggestion list at render time via the per-pair dismissal lookup (see `spa-session-match` "dismissAutoMatchBanner use case"); the heuristic itself is unaware of the dismissal state. When every suggestion in the visible week is either accepted, rejected, or filtered out by a prior dismissal, the banner SHALL NOT render at all.

The banner's per-row Accept SHALL invoke `matchSession({ source: "auto-suggestion", profileId, coachingActivityId, workoutId })`. The banner's per-row Reject SHALL invoke `dismissAutoMatchBanner({ profileId, weekStart, activityId, workoutId })`. Both interactions live in `CalendarPage`; the `AutoMatchBanner` component itself is concerned only with rendering and event emission.

The dismissal lookup SHALL be reactive: when a dismissal row is upserted, the page SHALL re-render with the dismissed suggestion no longer visible, without the user navigating away. This is achieved by reading `autoMatchDismissals` via `useLiveQuery` keyed on `(profileId, weekStart)`.

#### Scenario: Banner appears with at least one undismissed suggestion

- **GIVEN** the active profile has linked Train2Go and the visible week has 3 auto-match suggestions
- **AND** `autoMatchDismissals` has no row for `(profileId, weekStart)`
- **WHEN** the calendar mounts
- **THEN** `AutoMatchBanner` is rendered above the week grid with 3 suggestion rows

#### Scenario: Per-pair dismissal hides only that row

- **GIVEN** the banner is rendering 3 suggestion rows
- **WHEN** the user clicks Reject on the second row
- **THEN** `dismissAutoMatchBanner` is invoked for that pair; the row disappears from the banner reactively (no manual reload); the other two rows remain visible

#### Scenario: Banner unmounts when every suggestion is processed or dismissed

- **WHEN** the banner has rendered N suggestion rows and all N have been either accepted, rejected, or filtered by prior dismissals
- **THEN** `AutoMatchBanner` is no longer in the DOM; subsequent renders skip it until the next suggestion-producing event

#### Scenario: Confirmed suggestion is also removed from the banner

- **GIVEN** the banner shows 2 rows
- **WHEN** the user clicks Accept on one row
- **THEN** `matchSession` is invoked with `source: "auto-suggestion"`; the resulting `SessionMatch` row causes `useAutoMatchSuggestions` to no longer surface that pair (the suggestion engine excludes already-matched pairs by definition); the banner re-renders with the remaining row visible

#### Scenario: Dismissed suggestion does not re-surface across navigations within the same week

- **GIVEN** the user dismisses suggestion `(A, X)` on `weekStart = "2026-05-04"`
- **WHEN** the user navigates to a different week and returns to `2026-05-04`
- **THEN** the banner renders without `(A, X)`; the dismissal persists across navigations within the same week

#### Scenario: Dismissal survives full browser reload

- **GIVEN** the user dismisses suggestion `(A, X)` on `weekStart = W`
- **WHEN** the user reloads the page (e.g., F5; full document reload, not SPA route change)
- **THEN** the calendar re-mounts; `useLiveQuery` reads the dismissal row from IndexedDB; the banner renders without `(A, X)`

#### Scenario: Profile switch isolates dismissal state

- **GIVEN** the user dismisses suggestion `(A, X)` on profile `P1` for week `W`, where activity `A` belongs to `P1` and workout `X` is profile-agnostic
- **WHEN** the active profile switches to `P2` and `P2`'s calendar renders for the same `W`. `P2` has its own coaching activity `A'` for the same date and sport (different id from `A`, since coaching activities are per-profile per `spa-coaching-integration`'s linked-account model), and `autoMatchSessions` produces a suggestion `(A', X)` pairing `A'` with the same profile-agnostic workout `X`
- **THEN** the banner renders `(A', X)` because dismissal state is keyed on `(profileId, weekStart, activityId, workoutId)` — `P1`'s dismissal for `(A, X)` cannot match `(A', X)` since `A' ≠ A` AND the row's composite PK includes `profileId`. The user's `P1` verdict does not leak into `P2`'s view, even when the same workout is involved on both sides

### Requirement: CoachingSyncButton connected-state chrome

When the active profile has at least one linked coaching account, the `CoachingSyncButton` rendered in `CalendarHeader` SHALL adopt an icon-only chrome with the following invariants:

- A 32×32 button containing a `RefreshCw` lucide icon, no text label.
- An accessible name of the form `"Sync <Label>"` (e.g., `aria-label="Sync Train2Go"`).
- A native `title` attribute (and matching tooltip) of the form `"<Label> · last sync <relative-time>"` rendered via the new `formatRelativeTime` helper. The relative-time fragment MUST resolve to one of: `"never synced"`, `"just now"`, `"<n>m ago"`, `"<n>h ago"`, `"yesterday"`, `"<n>d ago"`, or an ISO date `YYYY-MM-DD` for older values.
- During an active sync, the icon SHALL be replaced **in place** by a spinner; the button SHALL be disabled while syncing; the tooltip SHALL read `"<Label> · syncing…"`.
- Under `prefers-reduced-motion: reduce`, the spinner SHALL NOT animate; the visual cue SHALL be a static "syncing" icon (e.g., a non-spinning loader glyph) and the tooltip text remains the canonical signal.
- Color tokens MUST be slate-based (`border-slate-300`, `text-slate-700`, `hover:bg-slate-100`) — not the prior rose treatment that competed with the status palette.

The not-connected state ("hint pointing to Profile Settings → Linked Accounts" per `spa-coaching-integration` "Calendar Sync button gated on linked account") is unchanged by this requirement.

#### Scenario: Connected button renders icon-only with relative-time tooltip

- **GIVEN** the active profile has Train2Go linked and `lastSyncedAt = T - 5min`
- **WHEN** the calendar header renders
- **THEN** the button has `aria-label="Sync Train2Go"`, no visible text label, and a tooltip reading `"Train2Go · 5m ago"`

#### Scenario: Never-synced account renders the never-synced tooltip

- **GIVEN** Train2Go is linked but `lastSyncedAt` is undefined (account just linked)
- **WHEN** the calendar header renders
- **THEN** the button tooltip reads `"Train2Go · never synced"`

#### Scenario: Sync in progress swaps the icon for the spinner in place

- **WHEN** the user clicks the button and `syncWeek` is awaiting
- **THEN** the icon is replaced in place by a spinner; the button is disabled; the tooltip reads `"Train2Go · syncing…"`

#### Scenario: Reduced motion disables spinner animation

- **GIVEN** the user has `prefers-reduced-motion: reduce`
- **WHEN** the button enters the syncing state
- **THEN** the loader glyph is static (no rotation animation); the tooltip still updates to `"Train2Go · syncing…"`; sync completion still re-enables the button

### Requirement: CalendarPage performance budget

`CalendarPage` SHALL render under two complementary budgets:

- **FCP envelope** — the calendar's first contentful paint SHALL stay within a CI-calibrated regression-detection envelope (default ≤ **1500 ms** on the ubuntu-latest runner with CDP CPU throttle 4×) when the visible week contains 30 cards distributed as 10 matched sessions, 10 solo plans, and 10 solo actuals. Archived design D11 named 200 ms as the aspirational figure for a Moto G Power 2022 reference device; CI hardware is a different baseline so the assertion uses the regression envelope rather than the reference-device target.
- **`useMatchedSessions` slice** — the hook SHALL contribute no more than **30 milliseconds** per invocation, measured via `performance.measure` markers placed inside the hook body. This is the architecturally meaningful guardrail: a regression in the matched-session join is the predictable cause of a slow calendar render, and the slice budget catches it directly.

Both budgets are enforced by a Playwright spec at `packages/workout-spa-editor/e2e/calendar-performance.spec.ts` that runs in the existing `e2e-frontend` CI matrix. The spec SHALL document its seed-data shape, the CPU throttling configuration, and the rationale for the FCP envelope in the file header. Persistent failures across Playwright's default retries SHALL fail the build.

#### Scenario: Synthetic 30-card week stays within the FCP envelope

- **GIVEN** the test seeds 10 matched / 10 solo plan / 10 solo actual rows for the visible week
- **AND** CDP CPU throttling is set to factor 4×
- **WHEN** the page navigates to `/calendar/:weekId`
- **THEN** `performance.getEntriesByName('first-contentful-paint')[0].startTime` is within the configured envelope (default ≤ 1500 ms on ubuntu-latest)

#### Scenario: useMatchedSessions stays under its slice of the budget

- **GIVEN** the same 30-card seed and throttling
- **WHEN** the page measures the `useMatchedSessions` hook via `performance.mark` / `performance.measure`
- **THEN** the worst single measured duration is ≤ 30 ms

#### Scenario: Build fails on regression

- **WHEN** a code change pushes either FCP > the configured envelope OR `useMatchedSessions` > 30 ms across all retries
- **THEN** the `e2e-frontend` job fails and the change is blocked from merging

#### Scenario: Production build emits no perf marks

- **GIVEN** the `useMatchedSessions` hook is built under `import.meta.env.PROD === true` (production bundle)
- **WHEN** the hook executes
- **THEN** no `performance.mark` or `performance.measure` calls are emitted; the production bundle has zero observable perf-instrumentation overhead; the marks ship only under DEV / test modes
