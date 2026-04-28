## Context

The `analytics-port-adapter` change established the Analytics port/adapter infrastructure but only wired events at coarse-grain touch-points. The editor uses React (with wouter for routing) and class-based error boundaries. Four gaps remain:

1. **SPA navigation** — wouter performs client-side route changes; the Cloudflare beacon only fires on initial HTML load, so `/calendar`, `/library`, `/workout/new`, and `/workout/:id` are invisible.
2. **File imports** — `useFileUpload` is called in multiple pages; no analytics at the success callback.
3. **Manual workout creation** — `ManualCreateSection` saves workouts without firing any event.
4. **Render errors** — `RouteErrorBoundary` logs to the console but does not forward to analytics.

## Goals / Non-Goals

**Goals:**

- Track SPA route changes as `pageView` custom events in Cloudflare
- Fire `workout-imported`, `workout-created`, and `route-error` events at the correct call sites
- Keep all changes inside `@kaiord/workout-spa-editor`; no changes to the port or core

**Non-Goals:**

- Changing the `Analytics` port signature or adding new methods
- Tracking non-user-triggered navigation (programmatic redirects)
- Adding analytics to `@kaiord/landing` (already adequate coverage)
- Session or funnel reconstruction (Cloudflare Web Analytics is not a session tool)

## Decisions

### SPA route tracking via wouter `useLocation`

wouter exposes a `useLocation()` hook that returns `[path, navigate]`. A `useEffect` on `path` in `App.tsx` (which already calls `useAnalytics()`) fires `analytics.pageView(path)` on every client-side navigation. No extra component, no extra dependency.

Alternative considered: a dedicated `<RouteTracker />` component. Rejected — unnecessary indirection when `App.tsx` already has access to both `useAnalytics` and `useLocation`.

### `workout-imported` at the `useFileUpload` call site

`useFileUpload` accepts an `onFileLoad` callback. The call sites (pages that embed `<FileUpload />`) already have access to `useAnalytics()`. Wrapping `onFileLoad` to fire the event before delegating to the original handler is the cleanest approach — no changes to `useFileUpload` itself.

Alternative considered: modifying `useFileUpload` to accept an `analytics` dependency. Rejected — that would couple a generic UI hook to the analytics port, violating separation of concerns.

### `workout-created` in `ManualCreateSection`

`ManualCreateSection` will call `useAnalytics()` and fire `analytics.event("workout-created", { source: "manual" })` at the point where the workout save succeeds.

### `route-error` via analytics prop on `RouteErrorBoundary`

`RouteErrorBoundary` is a class component and cannot use hooks. The cleanest injection is an optional `analytics?: Analytics` prop. `App.tsx` passes the result of `useAnalytics()` into each boundary instance. When undefined, the boundary remains silent (no regression on existing behavior).

Alternative considered: converting `RouteErrorBoundary` to a functional component using `react-error-boundary`. Rejected — introduces a new dependency for a minor change; class component approach works fine.

## Risks / Trade-offs

- **Double page view on initial load** — The Cloudflare beacon fires automatically on HTML load AND our `useEffect` fires on mount. The initial `/` or `/calendar` will be double-counted in custom events. Mitigation: this is inherent to SPA + external beacon architecture; both events carry different context (beacon = native PV, our event = application-layer PV). Acceptable.
- **`RouteErrorBoundary` prop is optional** — If a future developer wraps a route without passing `analytics`, errors silently go untracked. Mitigation: document in the component's JSDoc and catch in code review.

## Migration Plan

No deployment migration needed. All changes are purely additive event firings with no behavioral side effects. The feature is live as soon as the PR is deployed to production.
