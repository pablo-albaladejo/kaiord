## ADDED Requirements

### Requirement: Editor tracks SPA route changes as page views

The system SHALL call `analytics.pageView(path)` every time the wouter location changes inside the editor SPA, so that navigations to `/calendar`, `/library`, `/workout/new`, and `/workout/:id` are recorded as custom `pageView` events in Cloudflare Web Analytics.

#### Scenario: Initial route fires a page view on mount

- **WHEN** the editor SPA mounts for the first time at any route (e.g., `/calendar`)
- **THEN** `analytics.pageView('/calendar')` is called once during the mount effect

#### Scenario: Client-side navigation fires a page view

- **WHEN** the user navigates from `/calendar` to `/library` without a full page reload
- **THEN** `analytics.pageView('/library')` is called

#### Scenario: Dynamic route segment is included in page view path

- **WHEN** the user navigates to `/workout/abc123`
- **THEN** `analytics.pageView('/workout/abc123')` is called with the full path including the ID

---

### Requirement: Editor tracks file imports

The system SHALL call `analytics.event('workout-imported', { format })` when a user successfully imports a workout file in `@kaiord/workout-spa-editor`, where `format` is the detected file format (e.g., `fit`, `tcx`, `zwo`, `krd`, `gcn`).

#### Scenario: Successful FIT import fires workout-imported

- **WHEN** a user uploads a `.fit` file and the import succeeds
- **THEN** `analytics.event('workout-imported', { format: 'fit' })` is called

#### Scenario: Successful TCX import fires workout-imported

- **WHEN** a user uploads a `.tcx` file and the import succeeds
- **THEN** `analytics.event('workout-imported', { format: 'tcx' })` is called

#### Scenario: Failed import does not fire workout-imported

- **WHEN** a user uploads a file and the import fails
- **THEN** `analytics.event('workout-imported', ...)` is NOT called

---

### Requirement: Editor tracks manual workout creation

The system SHALL call `analytics.event('workout-created', { source: 'manual' })` when a user saves a new workout created from scratch (not via AI generation) in `@kaiord/workout-spa-editor`.

#### Scenario: Manual save fires workout-created

- **WHEN** a user fills in the manual workout form and saves successfully
- **THEN** `analytics.event('workout-created', { source: 'manual' })` is called

---

### Requirement: Editor tracks route render errors

The system SHALL call `analytics.event('route-error', { route: string })` when `RouteErrorBoundary.componentDidCatch` is triggered, where `route` is the current window pathname at the time of the error.

#### Scenario: Render error fires route-error event

- **WHEN** a route component throws an unhandled render error caught by `RouteErrorBoundary`
- **THEN** `analytics.event('route-error', { route: window.location.pathname })` is called

#### Scenario: No analytics prop means error is silently untracked

- **WHEN** `RouteErrorBoundary` is rendered without an `analytics` prop
- **THEN** the error boundary renders the fallback UI normally without throwing a secondary error
