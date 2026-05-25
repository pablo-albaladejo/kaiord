## ADDED Requirements

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
