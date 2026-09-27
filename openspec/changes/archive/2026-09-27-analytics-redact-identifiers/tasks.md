# Tasks

## 1. Payloads

- [x] 1.1 Remove `profileId` from every `analytics.event` payload in
      `packages/workout-spa-editor/src` (train2go telemetry, auto-sync
      helpers, expand-day callback, import and integration-policy use cases).
- [x] 1.2 Strip `profileId` in the editor Umami adapter before
      `umami.track`.

## 2. Page views

- [x] 2.1 Replace record ids in page-view URLs with the route pattern in the
      editor Umami adapter, keeping the path base-relative.

## 3. Tests

- [x] 3.1 Adapter tests: no `profileId` reaches `umami.track`; a
      `/workout/<uuid>` page view is submitted as `/workout/:id`.
- [x] 3.2 Redaction unit tests, including the paths that must stay unchanged
      (`/workout/new`, `/calendar/<ISO week>`).
- [x] 3.3 Update the telemetry, auto-sync and analytics-port event tests to
      the new payloads.

## 4. Spec

- [x] 4.1 MODIFY `analytics-port` "Umami adapter wraps the tracker API",
      "Editor tracks key product events" and "Editor tracks SPA route changes
      as page views".
