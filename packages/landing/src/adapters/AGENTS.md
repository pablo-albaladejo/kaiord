<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# src/adapters/ AGENTS.md

## Purpose

Adapter implementations for external integrations. Currently holds the Umami analytics adapter, which wraps the `window.umami` API and implements the core `Analytics` interface with error handling.

## Key Files

- **`analytics/umami-analytics.ts`** (18 LOC) — Factory function `createUmamiAnalytics(websiteId?: string)` that returns an `Analytics` object. When website id is falsy, returns noop. When website id exists, calls `window.umami.track()` with error suppression.
- **`analytics/umami-analytics.test.ts`** (72 LOC) — vitest suite covering both noop (undefined, empty string) and tracker scenarios (event calls, pageView, tracker absent, track throwing).

## Subdirectories

- **`analytics/`** — Umami analytics adapter.

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

- **Umami** — tracker script is injected into the page by a `<script>` tag in `index.html` (controlled by the `conditionalUmami` Vite plugin). This adapter assumes the tracker is available on `window.umami` if the website id was provided.
- **No analytics on website id missing** — if `VITE_UMAMI_WEBSITE_ID` is not set at build time, the tracker script is stripped from HTML and the adapter returns noop.

<!-- MANUAL: -->
