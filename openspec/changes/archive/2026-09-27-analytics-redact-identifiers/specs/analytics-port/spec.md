## MODIFIED Requirements

### Requirement: Umami adapter wraps the tracker API

The system SHALL provide `createUmamiAnalytics(websiteId: string | undefined): Analytics` in both `@kaiord/landing` and `@kaiord/workout-spa-editor`. The adapter MUST return a noop when the website id is falsy (empty string or undefined), and MUST guard against `window.umami` being unavailable (e.g., blocked by an ad blocker, or the async tracker script not yet loaded) when the website id is present.

The two consumer packages differ in how they submit page views:

- `@kaiord/landing` loads the Umami tracker with automatic tracking ON (a static multi-page site), so `pageView` is a no-op — submitting one would double-count the auto-tracked view.
- `@kaiord/workout-spa-editor` loads the tracker with `data-auto-track="false"` (client-side wouter routes), so `pageView(path)` forwards to `window.umami.track` using the payload-modifier form to set the base-relative `url`, with record ids replaced by their route pattern (see "Editor tracks SPA route changes as page views").

Both packages forward `event(name, props)` to `window.umami.track(name, props)`. The editor adapter first removes a `profileId` key from `props`, so no per-person identifier reaches Umami whatever the call site passes.

#### Scenario: Event is sent when the tracker is available

- **WHEN** `event('workout-generated', { sport: 'cycling' })` is called and `window.umami` is present
- **THEN** the adapter calls `window.umami.track` with the event name and properties
- **AND** on the editor adapter, a `profileId` property passed by the caller is not forwarded

#### Scenario: Editor pageView is forwarded via the payload modifier

- **WHEN** `pageView('/calendar')` is called on the editor adapter and `window.umami` is present
- **THEN** the adapter calls `window.umami.track` with a payload-modifier function that sets `url` to `/calendar`

#### Scenario: Landing pageView does not double-count auto-tracked views

- **WHEN** `pageView('/')` is called on the landing adapter and `window.umami` is present
- **THEN** the adapter does not call `window.umami.track` (automatic tracking already recorded the view)

#### Scenario: Event is silently dropped when the tracker is blocked

- **WHEN** `event` is called and `window.umami` is undefined
- **THEN** no error is thrown and execution continues normally

#### Scenario: track error is silently swallowed

- **WHEN** `event` is called and `window.umami.track` throws
- **THEN** the error is caught internally and execution continues normally without propagating to the caller

#### Scenario: Adapter is noop when website id is not set

- **WHEN** `createUmamiAnalytics(undefined)` or `createUmamiAnalytics('')` is called
- **THEN** the returned adapter is functionally equivalent to `createNoopAnalytics()` — no network requests, no console errors

Note: each consumer package (`@kaiord/landing` and `@kaiord/workout-spa-editor`) has its own independent adapter implementation and test suite verifying these scenarios.

### Requirement: Editor tracks key product events

The system SHALL call `analytics.event` at the following moments in `@kaiord/workout-spa-editor`: app mount (`editor-loaded`), successful AI workout generation (`workout-generated` with `provider` and `sport` props), file export (`workout-exported` with `format` prop), and Garmin Connect push completion — both success and failure — (`garmin-synced` with `result` prop). Event properties MUST NOT contain PII.

Three new integration lifecycle events and one gauge are also added. All new events use the existing `analytics.event(name, props)` port. All payload fields MUST comply with the R-PIIInterpolation rule — no biometric values, no user-entered metric values, no record content. Only structural metadata (data type, bridge id, direction, outcome, duration) is permitted.

No event payload SHALL carry `profileId` or any other per-person identifier: a stable local id sent with every event links a person's whole event history in the analytics store. Call sites SHALL NOT pass it, and the Umami adapter SHALL strip a `profileId` key before calling `umami.track`, so a call site that forgets cannot send it.

#### Scenario: App mount triggers editor-loaded event

- **WHEN** the editor SPA mounts for the first time
- **THEN** `analytics.event('editor-loaded')` is called exactly once

#### Scenario: AI generation fires workout-generated with dimensions

- **WHEN** an AI workout generation completes successfully
- **THEN** `analytics.event('workout-generated', { provider: '<name>', sport: '<name>' })` is called

#### Scenario: File export fires workout-exported with format

- **WHEN** a workout export completes (FIT, TCX, ZWO, or GCN)
- **THEN** `analytics.event('workout-exported', { format: '<format>' })` is called with the target format as the prop value

#### Scenario: Garmin sync fires on both success and failure

- **WHEN** a Garmin Connect push completes (regardless of outcome)
- **THEN** `analytics.event('garmin-synced', { result: 'success' })` or `analytics.event('garmin-synced', { result: 'failure' })` is called accordingly

#### New event: `integration_policy.toggled`

Emitted when a user adds, removes, enables, disables, or changes the mode of an `IntegrationPolicy` row via the Data Flows section.

Payload shape:

```ts
{
  dataType: ManagedDataType;
  direction: 'import' | 'export';
  bridgeId: string;         // BridgeId of the affected row
  action: 'added' | 'removed' | 'enabled' | 'disabled' | 'mode_changed';
  newMode?: 'manual' | 'auto';  // only when action === 'mode_changed'
}
```

#### New event: `import_completed`

Emitted when an `upsert-imported-record` use case call resolves, regardless of whether the record was new or a deduped no-op.

Payload shape:

```ts
{
  dataType: ManagedDataType;
  sourceBridgeId: string;
  durationMs: number;
  outcome: "inserted" | "deduplicated";
}
```

#### New event: `export_completed`

Emitted when a `record-export` use case call resolves.

Payload shape:

```ts
{
  dataType: ManagedDataType;
  destinationBridgeId: string;
  durationMs: number;
  outcome: "posted" | "patched" | "skipped" | "error";
}
```

#### New gauge: `kaiord.export.ledger.size`

Emitted on every export operation via `analytics.event('kaiord.export.ledger.size', { dataType, count })` where `count` is the current number of `exportLedger` rows for that `dataType`. Alert threshold: ledger size > 10× current source-row count in the same `dataType` indicates leakage.

Payload shape:

```ts
{
  dataType: ManagedDataType;
  count: number;
}
```

#### Scenario: integration_policy.toggled fires on add

- **WHEN** the user adds a source row for `(dataType: 'weight', bridgeId: 'garmin-bridge', direction: 'import')` in the Data Flows section
- **THEN** `analytics.event('integration_policy.toggled', { dataType: 'weight', direction: 'import', bridgeId: 'garmin-bridge', action: 'added' })` is called
- **AND** no biometric payload value appears in any field of the event properties
- **AND** the event properties contain no `profileId`

#### Scenario: integration_policy.toggled fires on disable

- **WHEN** the user disables an existing `IntegrationPolicy` row via the enabled checkbox in the Data Flows section
- **THEN** `analytics.event('integration_policy.toggled', { ..., action: 'disabled' })` is called

#### Scenario: import_completed fires with deduplicated outcome on second import

- **WHEN** the same `(sourceBridgeId, externalId)` record is imported a second time
- **THEN** `analytics.event('import_completed', { ..., outcome: 'deduplicated' })` is called
- **AND** the `durationMs` field is a non-negative number

#### Scenario: export_completed fires with skipped outcome on unchanged re-export

- **WHEN** a record is exported and re-exported without edits (content hash unchanged)
- **THEN** `analytics.event('export_completed', { ..., outcome: 'skipped' })` is called

#### Scenario: export_completed fires with posted outcome on first export

- **WHEN** a record is exported for the first time (no ledger entry exists)
- **THEN** `analytics.event('export_completed', { ..., outcome: 'posted', durationMs: <non-negative> })` is called

#### Scenario: kaiord.export.ledger.size gauge emitted on export

- **WHEN** a `record-export` use case call completes for `dataType: 'workout'`
- **THEN** `analytics.event('kaiord.export.ledger.size', { dataType: 'workout', count: <current ledger row count for 'workout'> })` is called
- **AND** the `count` field is a non-negative integer

#### Scenario: No PII in any integration event payload

- **WHEN** any of the four new events is emitted
- **THEN** no field in the event properties SHALL contain a biometric value, a user-entered metric value, or any content from the health/workout records being imported or exported
- **AND** no event properties SHALL contain `profileId`, even when the call site passes it to `analytics.event`
- **AND** the existing R-PIIInterpolation static guard (enforced by `scripts/check-no-pii-leakage.mjs`) SHALL remain green for every call site emitting these events

### Requirement: Editor tracks SPA route changes as page views

The system SHALL call `analytics.pageView(path)` every time the wouter location changes inside the editor SPA, so that navigations to `/calendar`, `/library`, `/workout/new`, and `/workout/:id` are recorded as page views in Umami. Because the editor disables Umami auto-tracking (`data-auto-track="false"`), these page views are submitted manually by the adapter with the base-relative path as the `url`.

A path segment that names one of the user's own records SHALL be replaced by its route pattern before the Umami adapter submits the `url`: `/workout/<id>` becomes `/workout/:id`, `/workout/view/<id>` becomes `/workout/view/:id` and `/chat/<id>` becomes `/chat/:conversationId`; the query string and fragment are dropped. `analytics.pageView` still receives the concrete path; the redaction happens in the adapter, and the submitted `url` stays base-relative. Static segments such as `/workout/new` and `/calendar/<ISO week>` are not record ids and are submitted unchanged.

#### Scenario: Initial route fires a page view on mount

- **WHEN** the editor SPA mounts for the first time at any route (e.g., `/calendar`)
- **THEN** `analytics.pageView('/calendar')` is called once during the mount effect

#### Scenario: Client-side navigation fires a page view

- **WHEN** the user navigates from `/calendar` to `/library` without a full page reload
- **THEN** `analytics.pageView('/library')` is called

#### Scenario: Dynamic route segment is included in page view path

- **WHEN** the user navigates to `/workout/abc123`
- **THEN** `analytics.pageView('/workout/abc123')` is called with the concrete path
- **AND** the Umami adapter submits `/workout/:id` as the page-view `url`, so the record id never reaches Umami
