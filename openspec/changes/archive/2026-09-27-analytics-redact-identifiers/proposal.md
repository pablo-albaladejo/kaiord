> Completed: 2026-09-27

# Proposal: Keep per-person identifiers out of Umami

## Why

The privacy policy now says Umami records "anonymous page views and product
events". Two things the editor sent contradicted that:

- **`profileId` in event payloads.** `coaching.sync.*`, `coaching.link.*`,
  `coaching.expand_day.invoked`, `import_completed` and
  `integration_policy.toggled` carried the active profile id. It is a stable
  local UUID, so every event a person emitted could be joined into one history
  in the analytics store. The canonical `analytics-port` spec mandated it in
  the `integration_policy.toggled` and `import_completed` payload shapes (and
  in the `export_completed` shape, which the code had already dropped).
- **Record ids in page-view URLs.** The editor submits page views manually
  with the wouter path, so `/workout/<uuid>`, `/workout/view/<uuid>` and
  `/chat/<uuid>` reached Umami verbatim. The "Dynamic route segment is
  included in page view path" scenario required the full id.

## What Changes

- Every call site stops passing `profileId` to `analytics.event`; the train2go
  telemetry helpers lose their `profileId` parameter.
- The editor Umami adapter strips a `profileId` key from every event payload
  (defence in depth: a call site that forgets, or builds its payload in a
  variable, still cannot send it) and submits page views with record ids
  replaced by the route pattern (`/workout/:id`, `/workout/view/:id`,
  `/chat/:conversationId`), dropping query and fragment. The path stays
  base-relative, as `spa-routing` requires; week paths such as
  `/calendar/2026-W32` are not record ids and are left alone.
- Unit tests prove no payload sent to Umami contains `profileId` and that
  page-view URLs carry the pattern, not the id.
- `analytics-port`: "Umami adapter wraps the tracker API", "Editor tracks key
  product events" and "Editor tracks SPA route changes as page views" are
  modified. Every existing scenario keeps its name (a MODIFIED block cannot
  drop or rename one); "Dynamic route segment is included in page view path"
  now requires the adapter to submit `/workout/:id`.

## Impact

- Affected specs: `analytics-port` (three MODIFIED requirements).
- `profileId` keeps its legitimate uses: repository lookups and persistence
  keys are untouched.
- Umami dashboards lose per-record page rows (`/workout/<uuid>`), which were
  one row per record and never useful in aggregate; they gain one row per
  route.
