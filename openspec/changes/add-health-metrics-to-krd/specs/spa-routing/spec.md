## ADDED Requirements

### Requirement: Primary navigation surface groups routes into Training, Health, and Settings

The SPA shell (`packages/workout-spa-editor/src/components/templates/MainLayout/`) SHALL render a primary navigation surface — a tab bar on desktop, equivalent affordance on mobile — directly below the existing header and above the route outlet. The surface SHALL expose exactly three top-level destinations:

- **Training** — groups the existing five workout routes: `/calendar`, `/library`, `/workout/new`, `/workout/:id`. The currently-active route within Training SHALL be visually indicated.
- **Health** — groups the five new Health Hub routes introduced by this change: `/health`, `/health/sleep`, `/health/weight`, `/health/recovery`, `/health/activity`.
- **Settings** — opens the existing Settings meta modal (no URL change), preserving its classification as a meta modal per the existing SPA surface classification requirement.

The primary navigation surface SHALL NOT change the base path or pathnames of any existing route — existing bookmarks and deep links to `/calendar`, `/library`, `/workout/new`, and `/workout/:id` SHALL continue to resolve to the same surfaces. The Training and Health tabs are visual groupers; they do not introduce a `/training/*` or `/health/training/*` URL prefix.

A test SHALL verify that activating each tab navigates to the canonical "home" route of that area: Training tab → `/calendar`, Health tab → `/health`. Re-clicking the currently-active tab SHALL be a no-op (no history push, no analytics duplicate).

#### Scenario: Tab bar mounts in the shell

- **WHEN** the SPA renders any routed page
- **THEN** the primary navigation surface SHALL be present in the layout tree, bracketed below the header and above the route outlet, exposing the three top-level tabs in order: Training, Health, Settings

#### Scenario: Training tab navigates to canonical home

- **WHEN** the user is on `/health/sleep` and clicks the Training tab
- **THEN** the SPA navigates to `/calendar` — the canonical Training home — using base-relative routing per the existing router-base requirement

#### Scenario: Health tab navigates to canonical home

- **WHEN** the user is on `/calendar` and clicks the Health tab
- **THEN** the SPA navigates to `/health` — the canonical Health Hub home

#### Scenario: Settings tab opens the meta modal without URL change

- **WHEN** the user clicks the Settings tab while on any route
- **THEN** the existing Settings meta modal opens over the current route, the URL does not change, and on close focus returns to the Settings tab control per the existing meta-modal scenario

#### Scenario: Existing deep links continue to resolve

- **WHEN** a user navigates directly to a previously-bookmarked URL such as `/library` or `/workout/abc-123`
- **THEN** the SPA resolves the URL to its existing routed page without modification, and the primary navigation surface displays the Training tab as active

### Requirement: Health Hub routes are routed pages with primary heading focus and live-announcement

The five new Health Hub routes SHALL each be classified as routed pages per the existing SPA surface classification requirement, owning a base-relative URL, supporting browser history, supporting deep-linking and bookmarking, and rendering a primary heading marked with `[data-route-heading]` focused on mount.

The routes SHALL be:

- `/health` — aggregated dashboard: most-recent sleep score, current weight, latest HRV reading, 7-day recovery summary, today's activity ring. Read-only summary view.
- `/health/sleep` — sleep history list and per-record detail. Reads via a live hook over `healthSleep`.
- `/health/weight` — weight history with optional body-composition overlay. Reads via live hooks over `healthWeight` and `healthBodyComposition`.
- `/health/recovery` — HRV + stress combined view. Reads via live hooks over `healthHrv` and `healthStress`.
- `/health/activity` — daily wellness view (steps, calories, intensity minutes, floors climbed). Reads via a live hook over `healthDaily`.

Each route SHALL emit exactly one live-announcer label change on navigation per the existing announcement scenario; the labels SHALL be human-readable (e.g., `"Health"`, `"Sleep"`, `"Weight"`, `"Recovery"`, `"Activity"`).

Each route SHALL render a single `[data-route-heading]` element on mount and focus SHALL move to it. The focus ring SHALL NOT be visually rendered when the navigation was triggered by a non-keyboard activation per the existing focus-management scenario.

#### Scenario: Health home is a routed page

- **WHEN** the user clicks the Health tab in the primary navigation surface
- **THEN** the SPA navigates to the base-relative URL `/health`, the dashboard surface renders, focus lands on the page's `[data-route-heading]` element, and no modal dialog mounts as a result of the click

#### Scenario: Health sub-route deep-links survive refresh

- **WHEN** the user navigates directly to `/health/sleep` via a bookmark and the static host returns 404 with the rafgraph fallback per the existing deep-link scenario
- **THEN** the rafgraph fallback restores the URL pre-mount, the SPA's router strips the configured base, the Health Hub sleep page re-renders, and the announcer emits the `"Sleep"` label exactly once

#### Scenario: Five health routes do not dual-mount their content components

- **WHEN** a contributor attempts to mount any Health Hub content component (e.g., `HealthSleepPanel`) from a non-route surface (header dropdown, modal, sidebar widget)
- **THEN** the existing CI guard script SHALL extend its allowlist to cover only the five `/health/*` page surfaces, and any import of a Health content component from outside the allowlist SHALL fail the build per the existing R-LibraryNoDualMount-style enforcement pattern

#### Scenario: Pure query-string changes within a Health route do not re-announce

- **WHEN** the user changes a filter on `/health/sleep?range=30d` to `/health/sleep?range=90d`
- **THEN** the announcer label SHALL NOT change and focus SHALL NOT move, per the existing query-string scenario

### Requirement: FIT import flow routes health files to the health pipeline

The existing SPA FIT import flow (today scoped to workout `.fit` files) SHALL inspect the FIT `file_type` header of each imported file and route the file to the appropriate downstream pipeline:

- `file_type ∈ { 5 (activity), 6 (workout), 7 (course) }` → existing workout pipeline; the resulting KRD targets the `workouts`, `templates`, or course store as today
- `file_type ∈ { 9 (weight), 15 (monitoringA), 28 (monitoringDaily), 32 (monitoringB) }` plus FIT files containing the messages `sleep_level`, `hrv`, `stress_level`, `body_composition` → new health pipeline; the resulting KRD targets one of the six `health*` stores via the corresponding repository's `upsertMany`
- Any other `file_type` → existing behaviour (reject with a user-visible error)

If the FIT parser raises an `UnsupportedKrdTypeError` from a workout-only writer (e.g., the user attempted to push a health KRD to a workout-only adapter), the import flow SHALL catch the error and surface a clear user-visible toast naming the unsupported metric and the recommended path (Health Hub import). This wires the typed error from the `adapter-contracts` capability into a discoverable UX path.

#### Scenario: Importing a Garmin sleep FIT file populates healthSleep

- **GIVEN** the user opens the Settings → Import surface and selects a `.fit` file whose `file_type` is `monitoringDaily (28)` and which contains `sleep_level` messages
- **WHEN** the import flow processes the file
- **THEN** the FIT reader produces a KRD with `type: "sleep_record"` and `extensions.health.sleep` populated, the import use case calls `persistence.healthSleep.upsertMany`, the Health Hub `/health/sleep` page reflects the new record via its live hook on the next render, and a success toast names the metric ("Sleep imported")

#### Scenario: Importing an unsupported FIT file surfaces a clear error

- **GIVEN** the user imports a FIT file whose `file_type` is `4` (segment) — not in scope for this proposal
- **WHEN** the import flow processes the file
- **THEN** the flow surfaces a user-visible toast that names the unsupported file type and does not silently discard the file; no Dexie write occurs

#### Scenario: UnsupportedKrdTypeError from a workout-only writer is surfaced

- **GIVEN** the user attempts a path that would call a workout-only writer (TCX/ZWO/GCN) with a KRD whose `type` is a health variant (test-only path, not user-reachable in the normal UI flow)
- **WHEN** the writer throws `UnsupportedKrdTypeError`
- **THEN** the caller catches the error via `instanceof UnsupportedKrdTypeError`, surfaces a toast naming the metric and the unsupported adapter, and routes the user to the Health Hub import surface
