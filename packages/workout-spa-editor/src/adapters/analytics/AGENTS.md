<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/adapters/analytics/`

## Purpose

Implements the `Analytics` port from `@kaiord/core` using Umami (website id + `umami` global). Wired once in `main.tsx`.

## Key Files

- `umami-analytics.ts` — `createUmamiAnalytics(websiteId?: string)` factory. Returns `{ event, pageView }` that no-op when website id is absent or when running in test/SSR.
- `umami-analytics.test.ts` — verifies no-website-id no-op, event/pageView shape, and PII-scrub via `scrub-analytics-string`.

## For AI Agents

### Working In This Directory

1. The adapter is the only place that may touch `window.umami` / `umami.d.ts`.
2. All user-supplied strings reaching analytics MUST first pass through `lib/scrub-analytics-string.ts` (zone redaction, KRD-payload stripping).
3. The tracker loads with `data-auto-track="false"`; page views are submitted manually. Manual page views use Umami's payload-modifier form (`window.umami.track((props) => ({ ...props, url }))`) rather than the plain `track(name, props)` form.

### Testing Requirements

- Website-id-absent tests verify zero side effects (no fetch, no DOM mutation).
- PII-scrub coverage is asserted via the imported scrubber's own tests; this file checks call composition.

### Common Patterns

- Factory returns plain object with `event(name, props?)` and `pageView(path)`; matches the core port shape so the in-memory test double can swap in.

## Dependencies

### Internal

- `@kaiord/core` (`Analytics` type).
- `../../lib/scrub-analytics-string` (PII scrub).

### External

- `umami` global typed by `../../types/umami.d.ts`.

<!-- MANUAL: -->

Never log user content (workout names, profile data) verbatim — route through the scrubber.
