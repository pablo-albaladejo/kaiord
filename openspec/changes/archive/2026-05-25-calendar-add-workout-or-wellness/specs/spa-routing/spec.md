## MODIFIED Requirements

### Requirement: Calendar day cells surface per-day wellness with explicit training/wellness differentiation

Each calendar day cell (`DayColumn`) SHALL render a per-day **wellness band** above its training cards when the active profile has any wellness record for that date. The band SHALL be visually differentiated from training: a muted/neutral palette separated from the brand-coloured training cards by a divider, so training and wellness are explicitly distinguishable at a glance.

The band SHALL show a compact badge only for the metrics **present that day**, among: **sleep** (score or duration), **HRV/recovery** (rMSSD), **weight** (kg), and **steps/daily-activity**. Body composition and stress are NOT inline badges. When a day has no wellness records, the band SHALL be omitted entirely; the cell SHALL still show a `+` add-entry affordance on every day (grid and list), regardless of the training bucket count, and clicking it SHALL open the add-entry chooser (Workout | Wellness) rather than navigating directly.

Each badge SHALL be an independently activatable link/button with an accessible label, navigating to the corresponding per-metric page via a badge-name→route map `WELLNESS_BADGE_ROUTES` co-located with the band component (distinct from the `FileType`-keyed `health-destination.ts` import map): sleep → `/health/sleep`, weight → `/health/weight`, HRV → `/health/recovery`, steps → `/health/activity`.

The visible week's wellness SHALL be read through a single `useLiveQuery` keyed by `(profileId, weekStart..weekEnd)` returning a per-day map, threaded down the calendar component chain. A single query is used for **atomicity** — a day's badges resolve in one loading transition and never appear one at a time — not to satisfy a query-count rule. The map's contract SHALL distinguish three states: `undefined` = the week's wellness is still loading; an absent day key = no wellness that day; a present day key always carries ≥1 metric. The band SHALL NOT intercept the grid's drag-to-reschedule pointer handlers.

#### Scenario: A day with recorded wellness shows a differentiated band

- **GIVEN** the active profile has a sleep score, HRV, weight, and steps for Monday
- **WHEN** the calendar week containing Monday renders
- **THEN** Monday's cell shows a muted wellness band above the training cards with a badge for each of sleep, HRV, weight, and steps, and the training cards below remain brand-coloured and visually distinct

#### Scenario: Partial day shows only present metrics

- **GIVEN** Tuesday has only a weight measurement
- **WHEN** the week renders
- **THEN** Tuesday's band shows only the weight badge with no empty slots for the missing metrics

#### Scenario: Empty day shows no band

- **GIVEN** Wednesday has no wellness records and no training
- **WHEN** the week renders
- **THEN** Wednesday's cell shows no wellness band and still shows the `+` add-entry affordance (which opens the Workout | Wellness chooser)

#### Scenario: Clicking a wellness badge drills down to its page

- **WHEN** the user clicks the sleep badge on a day cell
- **THEN** the SPA navigates to `/health/sleep`; clicking the weight badge instead navigates to `/health/weight`

#### Scenario: The wellness band does not break drag-to-reschedule

- **WHEN** the user drags a workout card to another day on a viewport ≥ 768px
- **THEN** the reschedule completes as before; pointer interactions on the wellness band do not start or capture a drag

#### Scenario: No band flicker while the week's wellness is loading

- **GIVEN** the calendar's training data has hydrated but the week's wellness query has not yet resolved (`wellnessByDay` is undefined)
- **WHEN** the calendar renders
- **THEN** every cell renders training-only with no wellness band and no placeholder, and bands appear in a single transition once wellness resolves — badges SHALL NOT pop in one metric at a time

#### Scenario: A dense day renders four badges without clipping

- **GIVEN** a day has sleep, HRV, weight, and steps recorded
- **WHEN** the cell renders in the narrowest supported column (≈140px on mobile)
- **THEN** all four badges are visible without overflow or clipping (wrapping or scrolling within the band), and the training cards below remain fully visible

## ADDED Requirements

### Requirement: Per-day add-entry chooser

When the user activates the `+` add-entry affordance on any calendar day cell (grid or list view), the SPA SHALL open a two-step add-entry chooser dialog presenting exactly two choices: **Workout** and **Wellness**. Choosing Workout SHALL navigate to `/workout/new?date=<day>` (preserving existing create-workout behavior). Choosing Wellness SHALL open the wellness entry surface for the clicked day. The chooser SHALL be keyboard-navigable, SHALL have an accessible name, and SHALL close via the browser back button without losing the calendar route. The `+` affordance SHALL render on every day regardless of whether the training bucket count is zero.

#### Scenario: Clicking `+` opens the chooser with Workout and Wellness options

- **WHEN** the user clicks the `+` affordance on any calendar day cell
- **THEN** the add-entry chooser dialog opens with exactly two choices — Workout and Wellness — and does not navigate away from the calendar

#### Scenario: Choosing Workout navigates to the create-workout flow

- **WHEN** the user opens the chooser and selects Workout
- **THEN** the SPA navigates to `/workout/new?date=<day>` where `<day>` is the ISO date of the clicked cell

#### Scenario: Choosing Wellness opens the wellness entry surface

- **WHEN** the user opens the chooser and selects Wellness
- **THEN** the wellness entry surface opens for the clicked day and the chooser closes

#### Scenario: Chooser is keyboard-navigable with an accessible name

- **WHEN** the chooser opens
- **THEN** focus is trapped within the dialog, the dialog has an accessible name, both tiles are reachable and activatable via keyboard, and Tab cycles between them without escaping the dialog

#### Scenario: Browser back button closes the chooser without losing the calendar route

- **WHEN** the chooser is open and the user presses the browser back button
- **THEN** the chooser closes and the SPA remains on the calendar route without a full navigation

#### Scenario: `+` renders on a day that already has a workout

- **GIVEN** a calendar day cell already contains one or more training cards
- **WHEN** the week renders in the grid view
- **THEN** the `+` add-entry affordance is still visible in that cell

#### Scenario: `+` renders on every day in the list view

- **WHEN** the calendar is displayed in list view for a week containing a mix of days with and without workouts
- **THEN** every day row shows the `+` add-entry affordance

### Requirement: Manual wellness entry

The wellness entry surface SHALL offer a manual entry form with labeled fields for **weight**, **sleep score**, **HRV**, and **steps**, and an **"Import a file"** action for FIT health files. The form SHALL have a single Save button that persists every filled field in one submission; empty fields SHALL write nothing. When a metric value is saved, the SPA SHALL persist a schema-valid KRD record for the active profile and the clicked day; the live wellness query SHALL cause the corresponding badge to appear on that calendar day after it refreshes. No user-entered metric value SHALL appear in any toast message.

When the user saves a metric for a day that already has a record for that metric, the prior record SHALL be replaced — exactly one record remains for that date and metric. For **steps specifically**, only the `steps` value is replaced; any prior `activeCalories`, `restingCalories`, and `intensityMinutes` fields in the existing daily-wellness record are preserved (merge-preserve, not clobber).

When the user uses "Import a file", the imported health record SHALL be dated by the FIT file's own date — NOT the clicked day — and the user SHALL land on the corresponding Health Hub page. Empty fields write nothing to persistence.

#### Scenario: Wellness surface offers a manual form and an import action

- **WHEN** the wellness entry surface opens for a given day
- **THEN** it shows labeled input fields for weight, sleep score, HRV, and steps, a single Save button, and an "Import a file" action

#### Scenario: Saving a metric value persists a KRD record and shows a badge

- **WHEN** the user enters a weight value and saves
- **THEN** a schema-valid KRD weight record for the active profile and clicked day is persisted, and the weight badge appears in that day's wellness band after the live query refreshes

#### Scenario: Saving a metric for a day that already has it replaces the prior record

- **GIVEN** a weight record already exists for a given day
- **WHEN** the user enters a new weight value and saves
- **THEN** exactly one weight record remains for that date and the displayed value reflects the new entry

#### Scenario: Saving steps preserves prior calories and intensity

- **GIVEN** a daily-wellness record exists for a day with `activeCalories: 300` and `intensityMinutes.moderate: 20` (from a prior import or save)
- **WHEN** the user enters a new steps value and saves
- **THEN** the persisted record has the new steps value AND retains `activeCalories: 300` and `intensityMinutes.moderate: 20`

#### Scenario: Empty fields write nothing

- **GIVEN** the user opens the wellness entry surface and leaves all fields empty
- **WHEN** the user clicks Save
- **THEN** no KRD records are written and no badge appears

#### Scenario: Partial entry saves only filled fields

- **GIVEN** the user enters a weight value and leaves HRV, sleep, and steps empty
- **WHEN** the user clicks Save
- **THEN** exactly one KRD record (weight) is persisted and no records for HRV, sleep, or steps are written

#### Scenario: No user-entered metric value appears in a toast

- **WHEN** the user saves a wellness metric
- **THEN** any success toast contains only a static message with no interpolated metric value

#### Scenario: Import a file uses the FIT file's date, not the clicked day

- **WHEN** the user chooses "Import a file" from the wellness entry surface and imports a FIT health file whose internal date is different from the clicked calendar day
- **THEN** the persisted record is dated by the FIT file's own date, the user lands on the corresponding Health Hub page, and no record is written for the clicked day's date
