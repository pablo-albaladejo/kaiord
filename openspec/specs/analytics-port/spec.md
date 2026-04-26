> Synced: 2026-04-25

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
