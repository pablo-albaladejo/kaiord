## MODIFIED Requirements

### Requirement: Workout cards with state indicators

Each workout on the calendar SHALL be displayed as a card showing sport icon, title, duration/distance, and a state indicator. State indicators SHALL follow this visual priority order: STALE (orange) > MODIFIED > RAW (warning) > STRUCTURED > READY (star) > PUSHED (check) > SKIPPED.

`WorkoutCard` and `CoachingActivityCard` and `MatchedSessionCard` SHALL share a common visual language: a `border-l-4` lateral accent (4 pixels — graphical, not incidental, per WCAG 1.4.11) encoding the primary status, a sport icon as the leading element of the title row, a `line-clamp-2` title (never single-line `truncate` — title is the most semantically important field on the card), and the origin (e.g., `T2G`, `TP`, `manual`) rendered as a muted text chip (`text-[10px] text-slate-500`) at the bottom of the card with a leading `· ` separator. Origin SHALL NEVER be rendered as a coloured badge that competes visually with the title.

The lateral border colour tokens SHALL be `amber-600` (pending), `emerald-600` (completed), `slate-500` (skipped) — each ≥ 3:1 contrast against a white card body, satisfying WCAG 1.4.11 (Non-text Contrast). The lateral border is a redundant visual cue; the **status icon** is the WCAG 1.4.1 (Use of Color) conformant signal channel.

Every status icon (lucide `Clock` for pending, `Check` for completed, `Minus` for skipped, plus the workout-state-machine icons for STALE/MODIFIED/RAW/STRUCTURED/READY/PUSHED) SHALL render with an `aria-label` matching its semantic value (e.g., `aria-label="Pending"`, `aria-label="Completed"`, `aria-label="Skipped"`). Icons SHALL render with `role="img"` AND `aria-label` directly on the SVG element (lucide-react supports both via props); the wrapper-span pattern SHALL NOT be used for status icons (the direct-on-SVG pattern is more reliably honoured by screen readers and aligns with the lucide-react idiom).

The sport icon SHALL also carry an `aria-label` reading the sport name (e.g., `aria-label="Swimming"`) so screen readers announce the sport. The sport label SHALL NOT be rendered as visible text adjacent to the icon — the icon's `aria-label` is the screen-reader channel; rendering both would duplicate the announcement.

The metadata row (sport, duration, intensity dots, status) SHALL use `flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0` to guarantee no element ever overflows the card horizontally. Any `ml-auto` alignment SHALL be paired with `min-w-0` shrink behaviour on neighbouring elements, or replaced with explicit ordering.

#### Scenario: RAW workout card

- **WHEN** a workout with state `raw` is displayed on the calendar
- **THEN** the card SHALL show a warning indicator (⚠️) on the lateral border, the workout title in `line-clamp-2`, the sport icon, and the source name as a muted text chip

#### Scenario: PUSHED workout card

- **WHEN** a workout with state `pushed` is displayed on the calendar
- **THEN** the card SHALL show a check indicator (✓) on the lateral border, the workout title, the sport icon, step count, estimated duration, and the source name as a muted text chip

#### Scenario: No element overflows the card

- **WHEN** a workout card renders inside a 140-pixel-wide day column with the longest possible title, source, and metadata combination
- **THEN** every visible element is fully contained within the card border; no text or indicator is painted outside the card; the title clamps to two lines maximum

#### Scenario: Sport label is not duplicated

- **WHEN** a workout card renders with sport "Swimming"
- **THEN** the swim icon (🏊 or equivalent) is shown once; the word "Swimming" SHALL NOT appear adjacent to the icon in the metadata row

#### Scenario: Status icon has accessible label

- **WHEN** any card renders with status `pending`
- **THEN** the `Clock` status icon carries `aria-label="Pending"` reachable by screen readers; equivalents for `completed` ("Completed") and `skipped` ("Skipped") apply

#### Scenario: Sport icon has accessible label

- **WHEN** any card renders with sport `Swimming`
- **THEN** the sport icon element carries `aria-label="Swimming"` so screen readers announce the sport even though no visible label is rendered

#### Scenario: Card content fits the 140px column

- **WHEN** a workout card renders inside a 140-pixel-wide day column with content `{ title: "Z2/Z3 técnica con drills + 4×100 fuerte", source: "train2go", duration: "45 min", status: "pending" }` in `comfortable` density
- **THEN** every visible element (title clamped to 2 lines, sport icon, duration, status icon, status text label, origin chip) is fully contained within the card border; no horizontal overflow occurs at any zoom level between 100% and 200%

### Requirement: Click interactions on calendar

Clicking a workout card SHALL navigate to the editor. Clicking a coaching activity card SHALL open a `CoachingActivityDialog` modal (see `spa-coaching-integration`). Clicking a `MatchedSessionCard` SHALL open the `CoachingActivityDialog` for the matched activity, which SHALL surface the matched workout and offer a "Split" action (see `spa-coaching-integration`). Clicking an empty day SHALL surface a hover-revealed menu offering "Plan", "Workout", and "From template" actions, with the date pre-filled.

#### Scenario: Click RAW workout

- **WHEN** the user clicks a RAW workout card
- **THEN** the system SHALL navigate to `/workout/:id` showing the coach's description, selectable comments, and action buttons: "Process with AI", "Skip", "Create manually"

#### Scenario: Click coaching activity card

- **WHEN** the user clicks a coaching activity card (T2G or other source)
- **THEN** the system SHALL open the `CoachingActivityDialog` for that activity (no in-place toggle, no editor navigation)

#### Scenario: Click matched session card

- **WHEN** the user clicks a `MatchedSessionCard`
- **THEN** the system SHALL open `CoachingActivityDialog` for the matched activity; the dialog SHALL show the matched workout in a "Linked workout" section with a "Split" action

#### Scenario: Click empty day reveals menu

- **WHEN** the user hovers an empty calendar day, then clicks the revealed menu trigger
- **THEN** the system SHALL render a menu with "Plan", "Workout", and "From template" entries; selecting any entry opens the corresponding flow with the day's date pre-filled

### Requirement: Compliance bucket boundaries for visual encoding

The view-model layer SHALL map the `complianceScore` (per `spa-session-match` "Compliance score derivation") to a visual bucket via a pure utility `complianceBucket(score: number | null): "neutral" | "amber" | "mid" | "emerald"` using these closed/open intervals:

- `null`        → **neutral**  (slate-400 lateral border, no gradient)
- `[0, 0.5)`    → **amber**    (amber-600 lateral border)
- `[0.5, 0.8)` → **mid**      (linear gradient amber-600 → emerald-600 sampled at midpoint, ≈ `yellow-700`)
- `[0.8, 1.0]` → **emerald**  (emerald-600 lateral border)

Boundaries are exact and deterministic — `0.5` is `mid`, `0.8` is `emerald`. The function is owned by `spa-calendar` (it is view-model presentation logic — it converts a domain score into a presentation bucket); it lives in `application/compliance-bucket.ts` (a SPA-internal pure module). The mid-bucket sampled colour (`yellow-700` per the contrast-test task 4.5) MUST achieve ≥ 3:1 contrast against a white card body per WCAG 1.4.11.

**Cross-capability dependency direction**: this requirement is owned by `spa-calendar` (presentation layer) but is also referenced by `spa-session-match` (e.g., the `MatchSuggestion` `null`-score handling rule). `spa-session-match` consumes `complianceBucket` exclusively as a presentation projection — the domain-level `complianceScore` does not depend on the bucket. The dependency direction is **`spa-session-match` → `spa-calendar`** for visual encoding only (presentation cap → presentation cap is acceptable; both are SPA-internal and neither owns persistence). Consumers in `spa-session-match` SHALL cite this requirement by name when referring to the bucket mapping.

Defensive contract: although `computeComplianceScore` is specified to return values within `[0, 1]` (or `null`), `complianceBucket` is a public utility and MUST handle out-of-range inputs gracefully without throwing — `score < 0` SHALL map to `"amber"` (the lowest finite bucket), `score > 1` SHALL map to `"emerald"` (the highest finite bucket), `NaN` SHALL map to `"neutral"` (treated as missing data). This guards against future scoring formulas (zones, TSS) that may produce values outside `[0, 1]` before this requirement is updated.

#### Scenario: Boundary at 0.5 maps to mid

- **WHEN** `complianceBucket(0.5)` is called
- **THEN** the result is `"mid"`

#### Scenario: Boundary at 0.8 maps to emerald

- **WHEN** `complianceBucket(0.8)` is called
- **THEN** the result is `"emerald"`

#### Scenario: Just below 0.5 maps to amber

- **WHEN** `complianceBucket(0.499)` is called
- **THEN** the result is `"amber"`

#### Scenario: Null maps to neutral

- **WHEN** `complianceBucket(null)` is called
- **THEN** the result is `"neutral"`

#### Scenario: Out-of-range inputs clamp to nearest bucket

- **WHEN** `complianceBucket(-0.5)`, `complianceBucket(1.5)`, and `complianceBucket(NaN)` are called
- **THEN** the results are `"amber"`, `"emerald"`, and `"neutral"` respectively (no exception thrown)

### Requirement: Matched session view-model and rendering

The calendar SHALL expose a hook `useMatchedSessions(profileId, days): MatchedSession[]` where each `MatchedSession` is `{ match: SessionMatch, activity: CoachingActivity, workout: WorkoutRecord, complianceScore: number | null }`. The `complianceScore` SHALL be computed by composing `parseCoachingDuration(activity.duration)` and `workout.raw.duration?.value` through the pure `computeComplianceScore` function (per `spa-session-match` "Compliance score derivation").

The hook SHALL satisfy these observable invariants:
- The hook SHALL NOT issue more than O(1) reads per cross-table dimension per render — concretely, no more than one read on `session_matches`, one read on `coachingActivities`, and one read on `workouts` per re-render of the hook (no per-row enumeration). The exact read mechanism (e.g., `useLiveQuery` + `bulkGet`) is implementation detail (see design D9), but tests SHALL assert the read-count budget by mock-call counting.
- The hook SHALL re-evaluate when any of (a) the `session_matches` query result changes, (b) the active `profileId` changes, or (c) the consuming page re-renders (which itself happens when its own `coachingActivities` / `workouts` queries fire). It SHALL NOT subscribe directly to `coachingActivities` or `workouts` on its own — relying on the parent calendar page is intentional, to keep the read budget bounded.
- **Parent-subscription contract (normative)**: the hook MUST be mounted within a parent that subscribes to `coachingActivities` and `workouts` for the same `profileId` and `days` window. The `CalendarPage` is the canonical caller; any future caller (month view, mobile drawer, etc.) MUST either provide equivalent parent subscriptions OR be implemented as a separate hook that includes the subscriptions internally. The hook SHALL emit a development-mode console warning (`process.env.NODE_ENV !== 'production'`) when no parent subscription is detected within one render cycle of mount, so misuse is caught early. This contract is documented in design D9.
- The result SHALL be deterministic given the same inputs.

`MatchedSessionCard` SHALL render with:
- `aria-label="Matched session: <activity.title>; planned <plannedDur> minutes; actual <actualDur> minutes; <percent>% compliance"` (when both durations are present), or `aria-label="Matched session: <activity.title>; compliance unavailable"` when `complianceScore` is `null`.
- A tooltip on the card root showing the same compliance reading as the `aria-label`. The tooltip SHALL follow the WAI-ARIA Tooltip pattern (focus-revealable, dismissable via Escape, paired with `aria-describedby` on the trigger). Native HTML `title=` MAY be present as a fallback for non-AT mouse hover but SHALL NOT be the only mechanism.
- In `comfortable` density, the compliance percentage SHALL render as visible on-card text (`text-[10px] text-slate-600`) so it does not require hover to read.
- The lateral border SHALL use the bucket-derived colour per "Compliance bucket boundaries for visual encoding" above.
- A leading row label `"Plan · "` (in `text-[10px] text-slate-500`) on the planned-data row and `"Actual · "` on the actual-data row, in `comfortable` density. In `compact` density only the actual row renders, so no labels are needed.

In `compact` density, `MatchedSessionCard` SHALL collapse to a single row showing the actual workout's title and duration, with the lateral border carrying the compliance bucket colour. Because this hides the planned title from sight, the card root SHALL include the planned title in its tooltip and `aria-label` (e.g., `"Matched session — actual: <actualTitle>; planned: <plannedTitle>; <percent>% compliance"`) so the planned context is recoverable without opening the dialog.

#### Scenario: useMatchedSessions has O(1) read budget per table

- **WHEN** the matched-sessions hook re-renders for a week containing 10 matched sessions
- **THEN** mock-call counters report at most one read on `session_matches`, one on `coachingActivities`, and one on `workouts` for the entire hook evaluation (not 10 or 30 reads)

#### Scenario: MatchedSessionCard exposes compliance to screen readers

- **WHEN** a `MatchedSessionCard` renders with `complianceScore: 0.92`, planned 45 min, actual 41 min
- **THEN** the card root carries an `aria-label` containing "92%" and the planned/actual durations; a tooltip is reachable via focus AND mouse hover and shows the same reading; pressing Escape while the tooltip is focused dismisses it

#### Scenario: MatchedSessionCard shows percentage in comfortable density

- **WHEN** the calendar density is `comfortable` and a `MatchedSessionCard` renders with a non-null compliance score
- **THEN** the percentage is rendered as on-card text (e.g., "92%") visible without hovering, AND the row labels `"Plan · "` and `"Actual · "` are visibly rendered on their respective rows

#### Scenario: MatchedSessionCard compact mode preserves planned title via tooltip

- **WHEN** the calendar density is `compact` and a `MatchedSessionCard` renders for a session whose planned title differs from its actual title
- **THEN** only the actual title is visible in the card body; the planned title is reachable via the card's tooltip AND `aria-label`; the tooltip is revealable both on mouse hover AND on keyboard focus on the card; pressing Escape while the tooltip is focused dismisses it (per "Tooltip and popover keyboard accessibility")

#### Scenario: Null compliance renders neutral grey

- **WHEN** a `MatchedSessionCard` renders with `complianceScore: null`
- **THEN** the lateral border uses `slate-400`; no gradient is applied; the `aria-label` reads `"Matched session: <title>; compliance unavailable"`

### Requirement: Coaching activities overlay

The calendar SHALL render coaching activities and workouts inside the same day column according to a three-state model:

1. **SOLO PLAN** — a `CoachingActivity` with no `SessionMatch` row. Renders as `CoachingActivityCard`.
2. **SOLO ACTUAL** — a `WorkoutRecord` with no `SessionMatch` row. Renders as `WorkoutCard`.
3. **MATCHED** — a `CoachingActivity` and a `WorkoutRecord` linked by a `SessionMatch` row. Renders as `MatchedSessionCard` (single fused card showing planned and actual rows).

Coaching activities are read-only and use a generic `CoachingActivity` shape — calendar components SHALL NOT consume platform-specific types directly. Each adapter (e.g., `adapters/train2go/`) maps its raw payload to `CoachingActivity` at the boundary.

The `CoachingActivity` view-model SHALL include: `id` (unique across platforms as `"{source}:{platformId}"`), `source` (platform identifier), `sourceBadge` (short UI label rendered as a muted chip — never a coloured badge), `date` (`YYYY-MM-DD`), `sport` (`{ label, icon }`), `title`, optional `duration`, optional normalised `effort` (1-5), `status` (`pending` | `completed` | `skipped`), optional `description`, and an optional view-model-only `matchedWorkoutId` populated by the read-side join with `session_matches`.

`CoachingActivityCard` and `MatchedSessionCard` SHALL use a `border-l-2` lateral accent driven by status (amber-400 = pending, emerald-500 = completed, slate-400 = skipped). For `MatchedSessionCard` the lateral border SHALL be a CSS gradient encoding the duration-based compliance score (amber → emerald per `spa-session-match`); when `complianceScore` is `null` the lateral border SHALL be neutral grey. The previous rose-dashed-border treatment SHALL NOT be used — it reads as a warning state and is removed.

The `MatchedSessionCard` SHALL render a "Plan" row and an "Actual" row within the card body in `comfortable` density. In `compact` density, only the "Actual" row is rendered with the compliance gradient on the lateral border carrying the planned-vs-actual signal.

A day column rendering order SHALL be: matched sessions first, then solo plans, then solo actuals — newest `createdAt` first within each group.

#### Scenario: Day with only solo plans

- **WHEN** the calendar week contains a coaching activity for a given day with no matching workout
- **THEN** the day column SHALL render a `CoachingActivityCard` with the appropriate status-driven lateral border colour

#### Scenario: Day with only solo actuals

- **WHEN** the calendar week contains a workout for a given day with no matching coaching activity
- **THEN** the day column SHALL render a `WorkoutCard` only; no coaching card is shown

#### Scenario: Day with a matched session

- **WHEN** the calendar week contains a coaching activity and a workout for the same day linked by a `SessionMatch` row
- **THEN** the day column SHALL render a single `MatchedSessionCard` (NOT two separate cards); the planned activity and the workout SHALL NOT also appear as solo cards

#### Scenario: Mixed day — one matched plus one solo plan plus one solo actual

- **WHEN** a day has one `MatchedSessionCard`, one unmatched coaching activity, and one unmatched workout
- **THEN** the day column SHALL render three cards in the order: matched, then solo plan, then solo actual

#### Scenario: Coaching activity card click

- **WHEN** the user clicks a coaching activity card
- **THEN** the card SHALL invoke its `onClick(activity)` handler, which opens `CoachingActivityDialog` with the full coaching description (read-only); the card itself does NOT expand inline

#### Scenario: Empty day with only coaching activities

- **WHEN** a day has coaching activities (matched or solo) but no unmatched workouts
- **THEN** the calendar SHALL NOT render the empty-day affordance for that day

#### Scenario: Compliance gradient renders on matched cards

- **WHEN** a `MatchedSessionCard` renders with `complianceScore: 0.95`
- **THEN** the lateral border SHALL be a gradient skewed toward emerald; with `complianceScore: 0.4` it SHALL skew toward amber; with `complianceScore: null` it SHALL be neutral grey

## ADDED Requirements

### Requirement: Calendar header week label is human-readable

The `CalendarHeader` SHALL render the visible week as a human-readable date range followed by the ISO week number. The format SHALL be `"<MMM D> – <MMM D> · W<NN>"` (e.g., `"Apr 27 – May 3 · W18"`). Cross-month and cross-year ranges SHALL be rendered in full (e.g., `"Dec 29 – Jan 4 · W01"` and `"Dec 29, 2025 – Jan 4, 2026 · W01"` when the week spans two years).

The previous `"<YYYY> W<NN>"` rendering SHALL NOT be used — it forces the user to mentally compute which dates the week covers.

#### Scenario: Same-month week

- **WHEN** the calendar shows the week of Monday April 27, 2026 to Sunday May 3, 2026
- **THEN** the header label is `"Apr 27 – May 3 · W18"`

#### Scenario: Same-year cross-month week

- **WHEN** the calendar shows a week spanning Apr 30 to May 6
- **THEN** the header label is `"Apr 30 – May 6 · W18"`

#### Scenario: Cross-year week

- **WHEN** the calendar shows the week spanning Dec 29, 2025 to Jan 4, 2026
- **THEN** the header label is `"Dec 29, 2025 – Jan 4, 2026 · W01"` (year disambiguates)

### Requirement: Calendar density toggle

The `CalendarHeader` SHALL render a density toggle that switches between `compact` and `comfortable` calendar card densities. The current density SHALL be persisted via the `spa-user-preferences` capability (per profile). The toggle SHALL reflect the persisted value and update the persisted value on click via `setCalendarDensity`.

The toggle's icon SHALL reflect the **next** state (the action it will perform), not the current state — `LayoutGrid` (denser) when current density is `comfortable` (clicking compacts), `List` (looser) when current density is `compact` (clicking expands). The toggle SHALL carry an `aria-label` and a `title` of the form `"Switch to <next> view"` (e.g., `"Switch to comfortable view"` when current is compact). The accessible name SHALL update reactively with the persisted value.

The toggle button SHALL use the WAI-ARIA Switch pattern: `role="switch"` with `aria-checked={density === "compact"}` (interpretation: "compact view is the active state" when checked). The action-label `aria-label` provides the verb; `aria-checked` provides the state — together, screen readers announce both. Example VoiceOver readout: "Switch to comfortable view, switch, on" when in compact, "Switch to compact view, switch, off" when in comfortable. The Switch pattern is preferred over `aria-pressed` because density is a binary on/off state selector, not an action toggle (per WAI-ARIA Authoring Practices §3.27).

In `compact` density:
- Cards render the lateral border colour and a small status icon (`Clock` / `Check` / `Minus`) with `aria-label` per "Workout cards with state indicators" — no visible status text.
- `MatchedSessionCard` collapses to a single row showing only the actual duration with the compliance gradient on the lateral border; the compliance percentage remains in the `aria-label` and tooltip.

In `comfortable` density:
- Cards render the lateral border, the status icon, and the status text in small caps adjacent to the icon (e.g., `Pending`, `Completed`, `Skipped`).
- `MatchedSessionCard` renders both "Plan" and "Actual" rows in the body, plus the visible compliance percentage.

The default density SHALL be derived per `spa-user-preferences`: `compact` for viewports ≥ 768px, `comfortable` for viewports < 768px.

#### Scenario: Toggle from compact to comfortable persists

- **WHEN** the user clicks the density toggle while in `compact` mode
- **THEN** `setCalendarDensity` is invoked with `density: "comfortable"`; all cards re-render in comfortable mode; reloading the page renders in comfortable mode

#### Scenario: Mobile default is comfortable

- **WHEN** the user opens the calendar on a viewport of 375px width with no persisted preference
- **THEN** the calendar renders in `comfortable` mode and the toggle reflects the comfortable state

#### Scenario: Desktop default is compact

- **WHEN** the user opens the calendar on a viewport of 1440px width with no persisted preference
- **THEN** the calendar renders in `compact` mode and the toggle reflects the compact state

#### Scenario: Toggle shows next-state accessible name

- **WHEN** the calendar is in `compact` mode
- **THEN** the density toggle has `role="switch"`, `aria-label="Switch to comfortable view"`, `title="Switch to comfortable view"`, and `aria-checked="true"`; after clicking, the same control updates to `aria-label="Switch to compact view"`, `title="Switch to compact view"`, and `aria-checked="false"`

### Requirement: Calendar sync button is icon-only with last-sync tooltip

When the active profile has at least one linked coaching account, the `CalendarHeader` SHALL render the corresponding `CoachingSyncButton`(s) as icon-only buttons (lucide `RefreshCw`, sized 32×32). The tooltip SHALL show `"<Label> · last sync <relative-time>"` (e.g., `"Train2Go · 12m ago"`). During an in-flight sync, the icon SHALL be replaced in-place with a spinner and the tooltip SHALL show `"<Label> · syncing <week-label>"` where `<week-label>` is the human-readable week being synced (per "Calendar header week label is human-readable"); this carries information value beyond the visible spinner.

The button SHALL NOT use the rose colour previously associated with Train2Go. It SHALL use the calendar's neutral chrome (e.g., `border-slate-300`, `text-slate-700`, `hover:bg-slate-100`) so it does not compete visually with the calendar grid.

When the active profile has no linked account for a source, the previous-spec contextual hint behaviour (point to Profile Settings → Linked Accounts) SHALL continue per `spa-coaching-integration` "Calendar Sync button gated on linked account".

#### Scenario: Connected source shows icon button with last-sync tooltip

- **WHEN** the active profile has Train2Go linked and the last sync was 12 minutes ago
- **THEN** the header shows a 32×32 `RefreshCw` icon button; hovering it shows `"Train2Go · 12m ago"`

#### Scenario: In-flight sync shows spinner

- **WHEN** the user clicks the sync button while viewing the week labelled "Apr 27 – May 3 · W18" and the request is in flight
- **THEN** the icon is replaced in-place with a spinner; the tooltip shows `"Train2Go · syncing Apr 27 – May 3 · W18"`; the button is disabled

#### Scenario: Never-synced shows "never" relative-time

- **WHEN** the active profile has Train2Go linked but `lastSyncedAt` is `undefined`
- **THEN** the tooltip shows `"Train2Go · never synced"`

### Requirement: DayColumn minimum width and today-as-pill

`DayColumn` SHALL use `min-w-[140px]` (was 120). The previous 120px was insufficient for the new card body (`line-clamp-2` title + metadata row + lateral border).

The "today" indicator SHALL be a pill on the day-name label (`bg-primary-100 text-primary-900 px-1.5 rounded-full`) — not a tinted background on the entire column. A whole-column tint creates a heavy visual block that overpowers the cards inside.

The today column element SHALL also carry `aria-current="date"` (per ARIA 1.2 `aria-current` token list, `"date"` is the appropriate token for a date-bearing landmark) so screen readers can identify it without relying on the visible pill. The day-name label SHALL include a visually-hidden span with " (today)" so screen-reader users hear the day-name annotated.

#### Scenario: Day column minimum width

- **WHEN** the calendar renders any day column
- **THEN** the column has `min-width: 140px`; the longest possible card metadata row fits within this width without overflow

#### Scenario: Today rendered as pill on day label

- **WHEN** the calendar week contains today's date
- **THEN** the corresponding day column's day-name label is rendered with a pill background; the column body itself has no tint

#### Scenario: Today exposed to screen readers

- **WHEN** the calendar week contains today's date
- **THEN** the today day-column element carries `aria-current="date"` AND the day-name label includes a visually-hidden " (today)" suffix; assistive tech announces "Wednesday, 29 (today)" or equivalent

### Requirement: Empty-day affordance is always visible and reveals a menu

When a day has no cards (no matched sessions, no solo plans, no solo actuals), the day column SHALL render a permanently visible minimal trigger as an HTML `<button>` element (or any element with `role="button"`) carrying `aria-label="Add to <day-name>"`. The visible content is the `+` glyph in the collapsed state and `+ Add` in the expanded state; the **accessible name does NOT change between states** (only the visible label expands). The button opens a menu with three actions on click: "Plan" (opens a planning flow), "Workout" (opens the existing add-workout flow), "From template" (opens the template picker). The previous bare `+` glyph SHALL be replaced by this richer affordance, but the baseline visibility SHALL be preserved so first-time and keyboard-first users discover the affordance without prior knowledge.

On viewports where `@media (hover: none)` matches (touch devices), the trigger SHALL render permanently in its expanded "+ Add" form (not the faint baseline) since there is no hover state to reveal richer affordances. The menu opens on tap.

The trigger and menu SHALL be fully keyboard-accessible: Tab focuses the trigger, Enter/Space opens the menu, arrow keys navigate items, Escape closes the menu. The menu SHALL implement the WAI-ARIA Menu pattern per "Tooltip and popover keyboard accessibility" — `role="menu"` on the popover, `role="menuitem"` on each option, focus trapped while open.

To avoid tab-order noise across the 7-day grid, each `DayColumn` SHALL act as a single tab stop (`role="group"` with a roving tabindex pattern). Tab moves between columns; arrow keys (Left/Right between columns, Up/Down within a column) move focus among the column's interactive items including the empty-day trigger. The first interactive item in each column receives focus when the column is reached via Tab; subsequent arrow-key presses traverse the cards and the empty-day trigger in their visual order.

#### Scenario: Empty day always renders a baseline trigger

- **WHEN** the user opens the calendar on a desktop viewport with an empty day
- **THEN** a faint `+` icon with `aria-label="Add to <day-name>"` is visible without any hover or focus interaction

#### Scenario: Hover expands the affordance

- **WHEN** the user hovers the baseline trigger on a desktop viewport
- **THEN** the affordance expands to "+ Add" (with visible text); clicking opens the menu with "Plan", "Workout", "From template" entries

#### Scenario: Touch viewport renders affordance permanently expanded

- **WHEN** the user opens the calendar on a touch viewport (`@media (hover: none)` matches)
- **THEN** the empty-day affordance renders as "+ Add" without requiring hover; tapping it opens the menu

#### Scenario: Empty day affordance is keyboard-operable

- **WHEN** the user tabs to the empty-day trigger and presses Enter
- **THEN** the menu opens; arrow keys navigate "Plan" / "Workout" / "From template"; Escape closes the menu without selection

#### Scenario: Day with cards renders no empty affordance

- **WHEN** a day column has at least one card (matched, solo plan, or solo actual)
- **THEN** no empty-day affordance is rendered

#### Scenario: Tab order moves between columns, not between every trigger

- **WHEN** the user opens the calendar with 7 empty days and presses Tab from the calendar header
- **THEN** focus lands on the first day column's interactive item (a single tab stop per column); subsequent Tab presses move to the next column, NOT to the next item within the same column; arrow keys traverse items within the focused column

### Requirement: Tooltip and popover keyboard accessibility

Every tooltip introduced by this change (sync button last-sync, density toggle action label, `MatchedSessionCard` compliance reading, day-name today annotation) SHALL follow the WAI-ARIA Tooltip pattern: tooltips MUST appear on both mouse hover AND keyboard focus on the trigger, MUST be dismissable via Escape (focus returns to trigger), and MUST be associated with the trigger via `aria-describedby` referencing the tooltip's `id`. Native HTML `title=` MAY be present as a non-AT mouse-hover fallback but SHALL NOT be the only mechanism (`title` is not keyboard-accessible and is inconsistently announced by screen readers).

Popovers (the empty-day "+ Add" menu, the "Match to…" sub-picker) SHALL follow the WAI-ARIA Menu pattern with `role="menu"`/`role="menuitem"`, focus trapped while open, Escape closing the popover and returning focus to the trigger.

#### Scenario: Sync button tooltip is keyboard-revealable

- **WHEN** the user tabs to the sync button
- **THEN** the tooltip appears with the last-sync content; pressing Escape dismisses it and focus remains on the button

#### Scenario: Match-to picker traps focus

- **WHEN** the "Match to…" sub-picker is open
- **THEN** Tab cycles within the picker's options; Escape closes the picker and returns focus to the "Match to…" trigger in the dialog

#### Scenario: Density toggle tooltip is keyboard-revealable

- **WHEN** the user tabs to the density toggle
- **THEN** the tooltip "Switch to <next> view" appears (not just on mouse hover); pressing Escape dismisses it; focus remains on the toggle

#### Scenario: MatchedSessionCard compliance tooltip is keyboard-revealable and Escape-dismissable

- **WHEN** the user tabs to a `MatchedSessionCard` in any density mode
- **THEN** the tooltip showing "<percent>% (<actualDur>/<plannedDur>)" (or "compliance unavailable") appears via keyboard focus; pressing Escape dismisses it without unfocusing the card; mouse hover also reveals the tooltip

### Requirement: Mobile calendar uses snap-x scroll with assistive-tech-friendly proximity

On viewports below the `sm` breakpoint (640px), the week grid SHALL use horizontal scroll with `snap-x snap-proximity` (NOT `snap-mandatory`). Each `DayColumn` SHALL be a snap target so swipes settle cleanly on a day rather than mid-column. `snap-proximity` was chosen over `snap-mandatory` to avoid the assistive-tech focus-trap behaviour where a card in a partially-off-screen snap target traps VoiceOver / TalkBack focus and the snap forces the scroll back.

When `@media (prefers-reduced-motion: reduce)` matches, the snap behaviour SHALL be disabled entirely (`snap-none`), per design D13.

#### Scenario: Mobile swipe settles on a day

- **WHEN** the user swipes the calendar horizontally on a 375px viewport
- **THEN** the scroll settles on the next/previous day column edge in most cases, never trapping focus on a partially-off-screen card

#### Scenario: Reduced-motion disables snap

- **WHEN** the user has `prefers-reduced-motion: reduce` set in their OS
- **THEN** the calendar grid uses `snap-none` on mobile; horizontal scroll behaves as a free scroll with no snap bias
