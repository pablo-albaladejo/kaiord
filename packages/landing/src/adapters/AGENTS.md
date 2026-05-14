<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/ AGENTS.md

## Purpose

Adapter implementations for external integrations. Currently holds the Cloudflare Web Analytics adapter, which wraps the `window.cfBeacon` API and implements the core `Analytics` interface with error handling.

## Key Files

- **`analytics/cloudflare-analytics.ts`** (18 LOC) — Factory function `createCloudflareAnalytics()` that returns an `Analytics` object. When token is falsy, returns noop. When token exists, calls `window.cfBeacon.pushEvent()` with error suppression.
- **`analytics/cloudflare-analytics.test.ts`** (72 LOC) — vitest suite covering both noop (undefined, empty string) and beacon scenarios (event calls, pageView, beacon absent, pushEvent throwing).

## Subdirectories

- **`analytics/`** — Cloudflare Web Analytics adapter.

## For AI Agents

### Working In This Directory

- **Strategy pattern** — adapters implement core interfaces (`Analytics` from `@kaiord/core`) and are passed into application code.
- **Error handling** — adapter errors must never surface to the application. Wrap external API calls in try/catch.
- **Conditional noop** — if configuration is missing or unavailable, return a noop implementation (all methods are no-ops).
- **Type safety** — import interface types from `@kaiord/core` and return implementations that satisfy them.

### Testing Requirements

- **jsdom + vitest** — tests use `vi.fn()` for mocking, `Object.defineProperty()` for window mocks.
- **AAA pattern** — every test has `// Arrange`, `// Act`, `// Assert`.
- **Titles start with "should "** — enforced.
- **Setup/teardown** — use `beforeEach()`/`afterEach()` to configure and clean up window mocks.

### Common Patterns

- **Factory function** — `createX()` pattern. Returns the implementation object.
- **Token/config validation** — check falsy values early and return noop.
- **Window API safety** — check `typeof window !== "undefined"` before accessing window properties.
- **Silent failures** — external API errors caught and suppressed; never thrown.

## Dependencies

### Internal

- `@kaiord/core` — `Analytics`, `AnalyticsEvent`, `createNoopAnalytics`.

### External

- **`vitest`** — test framework (dev only).

## Notes

- **Cloudflare Web Analytics** — beacon is injected into the page by a `<script>` tag in `index.html` (controlled by the `conditionalBeacon` Vite plugin). This adapter assumes the beacon is available on `window.cfBeacon` if the token was provided.
- **No analytics on token missing** — if `VITE_CF_ANALYTICS_TOKEN` is not set at build time, the beacon script is stripped from HTML and the adapter returns noop.

<!-- MANUAL: -->
