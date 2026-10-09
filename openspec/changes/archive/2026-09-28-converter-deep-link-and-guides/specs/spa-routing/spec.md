## ADDED Requirements

### Requirement: Converter deep link route

The SPA SHALL serve a `/convert` route whose parameters come from the URL fragment query (`#/convert?from=<source>&to=<target>`, read with wouter `useSearch()`). Valid sources SHALL be `fit`, `tcx`, `zwo` and `gcn` (with `garmin` accepted as an alias of `gcn`); valid targets SHALL be the same plus `krd`; a pair whose source equals its target SHALL be invalid. The route SHALL be wrapped by the same route error boundary (`guard` in `AppRoutes`, a `RouteErrorBoundary`) as the other routes and SHALL work on a cold visit. The page SHALL convert one file held in local component state and offer it as a download: it MUST NOT write the editor's workout store and MUST NOT persist anything (workouts, templates or calendar entries). The page SHALL be lazily loaded so it stays out of the initial JS.

#### Scenario: Cold visit converts a file

- **WHEN** a visitor with no stored data opens `/app/#/convert?from=fit&to=tcx` and chooses a FIT workout
- **THEN** a `.tcx` file is downloaded and the `workout-imported {format: "fit"}` and `workout-exported {format: "tcx"}` events are sent

#### Scenario: Converting leaves the open workout and storage unchanged

- **WHEN** a workout is open in the editor and the user converts a file at `#/convert?from=zwo&to=fit`, then navigates back
- **THEN** the open workout's content, the stored workouts and templates are exactly as before

#### Scenario: Invalid parameters show a format picker

- **WHEN** a visitor opens `#/convert?from=bogus`
- **THEN** a picker to choose the source and target formats is shown, with no redirect
