> Synced: 2026-05-29

# Analytics Port & Adapter

**Capability:** `analytics-port`
**Status:** Active
**Packages:** `@kaiord/core`, `@kaiord/landing`, `@kaiord/workout-spa-editor`

## Purpose

Provide a hexagonal-architecture-conformant analytics seam: a single `Analytics` port in `@kaiord/core` consumed by client apps, with concrete adapters (Cloudflare Web Analytics today; alternatives in the future) injected at the application boundary. No adapter-specific imports leak into domain or application layers.

## Overview

A lightweight, injectable analytics abstraction that follows the hexagonal architecture pattern. The `Analytics` port is defined in core (no external dependencies), with a noop default adapter and a Cloudflare Web Analytics adapter in each consumer package.

## Requirements

### Requirement: Analytics port is defined in core

The system SHALL expose an `Analytics` type in `@kaiord/core/ports` with two methods: `pageView(path: string): void` and `event(name: string, props?: Record<string, string | number | boolean>): void`. The port MUST NOT depend on any external library or browser API.

#### Scenario: Port is importable from core

- **WHEN** a consumer imports `Analytics` from `@kaiord/core`
- **THEN** the type is available with `pageView` and `event` signatures

---

### Requirement: Noop adapter is provided as default

The system SHALL provide `createNoopAnalytics(): Analytics` in `@kaiord/core/adapters/analytics`. Calling any method on the noop adapter MUST produce no side effects and MUST NOT throw.

#### Scenario: Noop adapter silently discards all calls

- **WHEN** `pageView` or `event` is called on the noop adapter
- **THEN** no network request is made, no error is thrown, and no output is produced

---

### Requirement: Cloudflare adapter wraps the beacon API

The system SHALL provide `createCloudflareAnalytics(token: string | undefined): Analytics` in both `@kaiord/landing` and `@kaiord/workout-spa-editor`. The adapter MUST return a noop when the token is falsy (empty string or undefined), and MUST guard against `window.cfBeacon` being unavailable (e.g., blocked by an ad blocker) when the token is present.

#### Scenario: pageView is forwarded to beacon when available

- **WHEN** `pageView('/editor/')` is called and `window.cfBeacon` is present
- **THEN** the adapter forwards the path to the beacon API without throwing

#### Scenario: Event is sent when beacon is available

- **WHEN** `event('workout-generated', { sport: 'cycling' })` is called and `window.cfBeacon` is present
- **THEN** the adapter calls `window.cfBeacon.pushEvent` with the event name and properties

#### Scenario: pageView is silently dropped when beacon is blocked

- **WHEN** `pageView` is called and `window.cfBeacon` is undefined
- **THEN** no error is thrown and execution continues normally

#### Scenario: Event is silently dropped when beacon is blocked

- **WHEN** `event` is called and `window.cfBeacon` is undefined
- **THEN** no error is thrown and execution continues normally

#### Scenario: Event called before beacon initializes is silently dropped

- **WHEN** `event` is called synchronously before the async beacon script has loaded (`window.cfBeacon` not yet set)
- **THEN** no error is thrown and execution continues normally

#### Scenario: pushEvent error is silently swallowed

- **WHEN** `event` is called and `window.cfBeacon.pushEvent` throws
- **THEN** the error is caught internally and execution continues normally without propagating to the caller

#### Scenario: Adapter is noop when token is not set

- **WHEN** `createCloudflareAnalytics(undefined)` or `createCloudflareAnalytics('')` is called
- **THEN** the returned adapter is functionally equivalent to `createNoopAnalytics()` — no network requests, no console errors

Note: each consumer package (`@kaiord/landing` and `@kaiord/workout-spa-editor`) has its own independent adapter implementation and test suite verifying these scenarios.

---

### Requirement: Editor injects analytics via React Context

The system SHALL provide `AnalyticsProvider` and `useAnalytics()` in `@kaiord/workout-spa-editor`. Any component that calls `useAnalytics()` outside a provider MUST receive the noop adapter (not throw).

#### Scenario: Components receive the injected adapter

- **WHEN** a component calls `useAnalytics().event(...)` inside an `AnalyticsProvider`
- **THEN** the event is forwarded to the injected `Analytics` implementation

#### Scenario: Components outside provider receive noop

- **WHEN** a component calls `useAnalytics()` with no `AnalyticsProvider` ancestor
- **THEN** the noop adapter is returned and no error is thrown

---

### Requirement: Landing tracks key funnel events

The system SHALL call `analytics.event` on the following user interactions in `@kaiord/landing`: clicking the "Try the Editor" CTA (`editor-opened`), clicking the "Star on GitHub" link (`github-opened`), and clicking the "Read the Docs" link (`docs-opened`).

#### Scenario: CTA click triggers editor-opened event

- **WHEN** a user clicks the "Try the Editor" button on the landing page
- **THEN** `analytics.event('editor-opened')` is called before navigation

#### Scenario: GitHub link click triggers github-opened event

- **WHEN** a user clicks the "Star on GitHub" link on the landing page
- **THEN** `analytics.event('github-opened')` is called

#### Scenario: Docs link click triggers docs-opened event

- **WHEN** a user clicks the "Read the Docs" link on the landing page
- **THEN** `analytics.event('docs-opened')` is called

---

### Requirement: Editor tracks key product events

The system SHALL call `analytics.event` at the following moments in `@kaiord/workout-spa-editor`: app mount (`editor-loaded`), successful AI workout generation (`workout-generated` with `provider` and `sport` props), file export (`workout-exported` with `format` prop), and Garmin Connect push completion — both success and failure — (`garmin-synced` with `result` prop). Event properties MUST NOT contain PII.

Three new integration lifecycle events and one gauge are also added. All new events use the existing `analytics.event(name, props)` port. All payload fields MUST comply with the R-PIIInterpolation rule — no biometric values, no user-entered metric values, no record content. Only structural metadata (data type, bridge id, direction, outcome, duration) is permitted.

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
  profileId: string;        // active profile id
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
  profileId: string;
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
  profileId: string;
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
- **THEN** `analytics.event('integration_policy.toggled', { profileId, dataType: 'weight', direction: 'import', bridgeId: 'garmin-bridge', action: 'added' })` is called
- **AND** no biometric payload value appears in any field of the event properties

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
- **AND** the existing R-PIIInterpolation static guard (enforced by `scripts/check-no-pii-leakage.mjs`) SHALL remain green for every call site emitting these events

---

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

The system SHALL call `analytics.event('route-error', payload)` when `RouteErrorBoundary.componentDidCatch` is triggered. The payload SHALL contain four string fields, each first scrubbed through a shared `scrubAnalyticsString` helper, then truncated:

- `route: string` — `window.location.pathname` at the time of the error, scrubbed; not truncated (route paths are bounded by the router).
- `name: string` — `error.name` (defaulting to `"Error"` when `error.name` is `undefined`, `null`, or empty), scrubbed; not truncated (error class names are bounded).
- `message: string` — `error.message` scrubbed and then truncated to ≤ 500 characters (defaulting to the empty string when `error.message` is `undefined`, `null`, or empty).
- `componentStack: string` — `info.componentStack` scrubbed and then truncated to ≤ 1000 characters (defaulting to the empty string when missing).

`scrubAnalyticsString(input: string, maxLen?: number): string` SHALL replace, in this order, all substring matches with the corresponding placeholder, then (when `maxLen` is provided) truncate the result to at most `maxLen` characters:

1. UUID v4 / v5 (`/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi`) → `<uuid>`.
2. Bearer tokens (`/Bearer\s+[A-Za-z0-9._\-+/=]+/g`) → `Bearer <token>`. The character class is restricted to token-safe chars so trailing punctuation (e.g., `);` or `,`) is preserved verbatim — `Bearer\s+\S+` would greedily consume the punctuation and corrupt downstream message content.
3. Email-shaped substrings, including internationalized local parts and TLDs (`/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu`) → `<email>`. The Unicode-aware regex catches Train2Go-shaped (`usuario@correo.es`) and CJK-shaped (`用户@example.cn`) addresses that the ASCII-only `[A-Za-z0-9]` form would miss.
4. Runs of 32 or more hexadecimal characters (`/[0-9a-f]{32,}/gi`) → `<hex>`.
5. Long base64url-shaped runs of 40 or more characters (`/[A-Za-z0-9_-]{40,}/g`) → `<token>`. This catches raw JWTs (`eyJ...`), OAuth refresh tokens, and other base64url-encoded secrets that appear in error messages without a `Bearer` prefix. Note: hex runs ≥ 32 are also a subset of base64url; rule 4 runs FIRST, so a 60-character hex run produces `<hex>`, not `<token>`. Both placeholders mean "opaque secret" from a triage standpoint — the ambiguity is intentional.

Truncation MUST occur AFTER scrubbing, so placeholders are never chopped mid-token.

The scrubber explicitly does NOT cover IPv4 / IPv6 addresses, phone numbers, or filesystem pathnames. These are documented out-of-scope: the Cloudflare beacon adapter is not yet wired in production, and this gap is revisited when it is.

The analytics call SHALL remain wrapped in `try/catch` so a failure in the scrubber, the truncator, or the analytics adapter cannot trigger a secondary failure inside the error boundary.

The default `noop` adapter MUST continue to accept this richer payload without behavior change.

#### Scenario: Render error fires route-error event with scrubbed-and-truncated payload

- **GIVEN** `RouteErrorBoundary` is mounted with a real (non-noop) `analytics` prop
- **WHEN** a route component throws an `Error("not found: 6e3ad6f0-1234-4cdf-9abc-1234567890ab")` and React invokes `componentDidCatch(error, info)`
- **THEN** `analytics.event` is called with event name `'route-error'` and a payload whose `message` is `"not found: <uuid>"`, whose `name` is `"Error"`, whose `route` equals `window.location.pathname` (with any UUID/email/Bearer/hex run replaced by its placeholder), and whose `componentStack` equals `info.componentStack` scrubbed and truncated to ≤ 1000 chars

#### Scenario: Bearer tokens, emails, and long hex runs are scrubbed

- **WHEN** an `Error` thrown during render carries the message `"auth failed for user@example.com (Bearer abc.def.ghi); key=abcdef0123456789abcdef0123456789abcdef01"`
- **THEN** the `message` field of the analytics payload equals `"auth failed for <email> (Bearer <token>); key=<hex>"`

#### Scenario: Long base64url runs (e.g., JWT signature) are scrubbed

- **WHEN** an `Error` thrown during render carries the message `"401 Unauthorized: token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c expired"`
- **THEN** the `message` field of the analytics payload contains `<token>` substituted for the 43-character signature portion (`SflKx...w5c`). The header (36 chars) and payload (27 chars) are BELOW the 40-character threshold of rule 5 and remain in plain text — by design: rule 5 targets opaque high-entropy secrets above 40 chars, not all JWT fragments. Callers that need full JWT scrubbing rely on rule 2 (`Bearer <jwt>` is matched as a single Bearer-token unit and replaced wholesale) or construct error messages without leaking the header/payload fragments

#### Scenario: UUID positioned to span the truncation boundary is fully replaced

- **GIVEN** an error message of 600 characters where a UUID-shaped substring straddles input positions 498-533 (i.e., would be split if truncation ran first)
- **WHEN** `scrubAnalyticsString(message, 500)` runs
- **THEN** the output contains the literal placeholder `<uuid>` intact (never split mid-token) and the output length is at most 500 characters

#### Scenario: Empty / missing fields fall back to safe defaults

- **WHEN** `componentDidCatch` is invoked with an error object whose `name` is `undefined` and `message` is `undefined`, and an `info.componentStack` that is `undefined`
- **THEN** the payload sent to analytics is `{ route: <scrubbed pathname>, name: "Error", message: "", componentStack: "" }`

#### Scenario: Truncation applies after scrubbing at exact bounds

- **WHEN** an error's `message` is 600 characters long with no scrub-matching substrings
- **THEN** the analytics payload's `message` is exactly 500 characters long

- **WHEN** an `info.componentStack` is 1100 characters long with no scrub-matching substrings
- **THEN** the analytics payload's `componentStack` is exactly 1000 characters long

#### Scenario: No analytics prop means error is silently untracked

- **WHEN** `RouteErrorBoundary` is rendered without an `analytics` prop
- **THEN** the error boundary renders the fallback UI normally without throwing a secondary error and without calling any analytics code path

#### Scenario: Analytics adapter throwing does not crash the error boundary

- **WHEN** the supplied `analytics.event` implementation throws synchronously while reporting `route-error`
- **THEN** the error boundary still renders the fallback UI and does not surface a secondary error
