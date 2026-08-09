## MODIFIED Requirements

### Requirement: Editor tracks route render errors

The system SHALL call `analytics.event('route-error', payload)` when `RouteErrorBoundary.componentDidCatch` is triggered. The payload SHALL contain four string fields, each first scrubbed through a shared `scrubAnalyticsString` helper, then truncated:

- `route: string` — **the SPA route that was rendering**, scrubbed; not truncated (route paths are bounded by the router). The route is read from the router's own location, not from `window.location.pathname`. Once the route lives in the URL fragment, every path reads as the deploy prefix, so a payload built from `pathname` would report the same value for every error and the field would stop answering the only question it exists to answer.
- `name: string` — `error.name` (defaulting to `"Error"` when `error.name` is `undefined`, `null`, or empty), scrubbed; not truncated (error class names are bounded).
- `message: string` — `error.message` scrubbed and then truncated to ≤ 500 characters (defaulting to the empty string when `error.message` is `undefined`, `null`, or empty).
- `componentStack: string` — `info.componentStack` scrubbed and then truncated to ≤ 1000 characters (defaulting to the empty string when missing).

#### Scenario: Route error payload names the failing route

- **WHEN** a render error is caught while the SPA is on a deep route
- **THEN** `analytics.event` is called with event name `'route-error'` and a payload whose `route` is the SPA route being rendered (with any UUID/email/Bearer/hex run replaced by its placeholder), NOT the deploy prefix shared by every route

#### Scenario: Two errors on different routes report different routes

- **WHEN** a render error is caught on one route and then on another
- **THEN** the two payloads SHALL carry different `route` values, which is the property a `pathname`-derived field silently loses once the route moves into the fragment
