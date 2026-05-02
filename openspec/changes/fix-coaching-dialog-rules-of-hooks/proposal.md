## Why

Clicking a Train2Go-loaded workout in the calendar crashes the route with React error #321 ("Invalid hook call") and renders the `RouteErrorBoundary` fallback ("Something went wrong"). The crash has been live since PR #372 (the introduction of `train2go-profile-link`) and went undetected by every layer of the existing test/lint/telemetry stack:

- ESLint `react-hooks` plugin is installed but never registered in `eslint.config.js`.
- Both unit tests for the dialog mock `useCoachingSourceFactories` (one with `[]`, one with a hookless function), so the real `useTrain2GoSource` is never executed in tests.
- No integration test mounts the dialog with the production registry bootstrap.
- No Playwright spec covers the "click a coaching activity" path.
- `RouteErrorBoundary` reports `route-error` with only `{ route: pathname }` — too coarse to surface a Rules-of-Hooks crash even with a real analytics adapter wired.

This change fixes the immediate crash AND closes the **class** of detection gap that allowed it to ship — the latter is the more important outcome.

## What Changes

**Bug fix (Coaching dialog)**

- `useCoachingDialog` SHALL no longer invoke the coaching-source registry directly. The expand-on-open behavior MUST be driven by an `expandActivity` callback supplied by the caller (which already materializes sources via `useCoachingActivities`).
- `CoachingActivityDialog` SHALL accept and forward the `expandActivity` callback.
- The dialog stops depending on `coaching-registry-context`; sources are materialized exactly once per render tree (in `useCoachingActivities`).

**Mechanical guards (preventing the class of defect)**

- `eslint-plugin-react-hooks` SHALL be registered in `eslint.config.js` with `rules-of-hooks: error` and `exhaustive-deps: error`. Any pre-existing violations destapped by activation MUST be fixed (zero-tolerance policy). The plugin is loaded by the SPA-files block; the SPA-pages block inherits via the flat-config cascade.
- Any `factories.map(...)` (or analogous map over a hook collection) MUST name its callback parameter with a `use*` prefix (canonical: `useFactory`) so the linter recognizes the call as a hook invocation. A new mechanical guard `scripts/check-hook-collection-map-naming.mjs` SHALL enforce this in CI (deterministic, mechanical — favored over documented convention per the user's `mechanical_over_ai` feedback).
- A "smoke-render" test SHALL exist for `CoachingActivityDialog` that mounts it through the real `coaching-registry-bootstrap` (not a mocked registry). The test asserts the render does not throw. This pattern becomes the canonical safety net for any dialog/page that consumes the coaching registry.
- `RouteErrorBoundary.componentDidCatch` SHALL forward to analytics a payload of `{ route, name, message, componentStack }` where `route`, `message`, and `componentStack` are first **scrubbed** through a regex allow-list (UUIDs → `<uuid>`, Bearer tokens → `<token>`, emails → `<email>`) and then truncated (`message` ≤ 500 chars; `componentStack` ≤ 1000 chars). Scrubbing closes a real PII surface — domain code throws errors that include user-typed `title`s, profile UUIDs, externalUserIds, and Zod-formatted validation messages quoting parsed input. The same `scrubAnalyticsString` helper SHALL be reused for the `route` field. `scripts/check-no-pii-leakage.mjs` is extended to cover `analytics.event` first-argument shape, closing the parallel hole to the existing `toast.*` / `console.*` rules.

**Out of scope**

- Playwright E2E coverage for the T2G-click path (depends on fixturing the Train2Go bridge — separate change).
- Wiring a real analytics adapter in production (product decision).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `spa-coaching-integration`: MODIFIED `CoachingActivityDialog` requirement. The "Dialog opens with persisted description" and "Convert action navigates to editor" scenarios are preserved verbatim; the "Dialog opens and lazy-loads description" scenario is rewritten to describe the callback-driven flow; a new "Dialog renders without consuming the coaching registry" scenario is ADDED. New invariant: the dialog and its backing hook MUST NOT consume the coaching-source registry directly; expand-on-open is driven by a caller-supplied callback (Rules-of-Hooks compliance + single source materialization).
- `spa-quality-gates`: ADDED requirements for (a) the React Rules-of-Hooks lint gate (enforced by `pnpm lint`, distinct from the existing `pnpm test:scripts`-based gates), (b) the registry-bootstrap smoke-render test pattern, (c) a mechanical guard that forbids `factories.map(callback)` whose callback parameter does not start with `use*`, (d) extending `scripts/check-no-pii-leakage.mjs` to cover `analytics.event` first-argument shape — closing the parallel hole to `toast.*` / `console.*`.
- `analytics-port`: MODIFIED `Editor tracks route render errors` requirement. The original 2-scenario requirement is replaced with a multi-scenario version covering: scrubbed-and-truncated diagnostic payload, multi-class scrub (Bearer + email + hex), raw-JWT scrub, UUID-at-truncation-boundary, empty/missing-field defaults, exact 500/1000 truncation bounds, no-analytics-prop fallback, and analytics-throwing fallback. All string fields (`route`, `name`, `message`, `componentStack`) are scrubbed via a shared `scrubAnalyticsString` helper before payload emission.

## Impact

**Affected packages**

- `@kaiord/workout-spa-editor` (private SPA): dialog hook + component, registry bootstrap call sites, `RouteErrorBoundary`, vitest test files.
- Repo-root `eslint.config.js`: new plugin registration.

**Affected layers (hexagonal)**

- Frontend / application-side React composition only. No domain or port changes. Adapter packages untouched.

**APIs**

- Internal SPA API only. `CoachingActivityDialog` props gain a required `expandActivity` callback. `useCoachingDialog` signature changes. `@kaiord/workout-spa-editor` is `private: true` and is NOT in `.changeset/config.json#linked` — no changeset is required and no version bump is published.

**Risk**

- Activating `react-hooks/rules-of-hooks` may surface pre-existing violations elsewhere in the SPA (other call sites of factory-style hooks). Mitigation: run lint locally before merging; fix or scope-bound any incidental findings inside this change.
- Enriching the error-boundary payload sends slightly more data per `route-error` event. Default analytics is `noop`, so production behavior is unchanged unless a real adapter is wired (out of scope here).
